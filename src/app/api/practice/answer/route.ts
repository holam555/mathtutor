import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAnswerCorrect } from '@/lib/answerUtils'
import { generateVariationsForCategory } from '@/lib/variationGenerator'

const WRONG_THRESHOLD = 3

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: {
    session_id: string
    question_id: string
    student_answer: string
    category_id?: string | null
    time_spent_seconds?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { session_id, question_id, student_answer, category_id, time_spent_seconds } = body

  const { data: sessionRow, error: sessionError } = await supabase
    .from('practice_sessions')
    .select('student_id, question_ids, session_type')
    .eq('id', session_id)
    .single()

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: '練習記錄不存在' }, { status: 404 })
  }
  if (sessionRow.student_id !== user.id) {
    return NextResponse.json({ error: '無權記錄此練習' }, { status: 403 })
  }
  if (!Array.isArray(sessionRow.question_ids) || !sessionRow.question_ids.includes(question_id)) {
    return NextResponse.json({ error: '此題不屬於此練習' }, { status: 400 })
  }

  const service = createServiceClient()

  // Sessions started after 0018 use assessment_questions for all modes
  // except retry_wrong (which can mix). Detect source by querying both —
  // assessment_questions first since legacy is now all is_active=false.
  let correctAnswer: string | null = null
  let questionSource: 'assessment_questions' | 'questions' = 'assessment_questions'
  let topicId: string | null = null
  let legacyCategoryId: string | null = null

  const { data: aq } = await service
    .from('assessment_questions')
    .select('correct_answer, topic_id')
    .eq('id', question_id)
    .maybeSingle()

  if (aq) {
    correctAnswer = aq.correct_answer
    topicId = aq.topic_id ?? null
    questionSource = 'assessment_questions'
  } else {
    const { data: lq } = await service
      .from('questions')
      .select('correct_answer, category_id')
      .eq('id', question_id)
      .maybeSingle()
    if (lq) {
      correctAnswer = lq.correct_answer
      legacyCategoryId = (lq.category_id as string | null) ?? category_id ?? null
      questionSource = 'questions'
    }
  }

  if (correctAnswer == null) {
    return NextResponse.json({ error: '題目不存在' }, { status: 404 })
  }

  const correct = isAnswerCorrect(student_answer, correctAnswer)

  const { error: answerError } = await supabase.from('answer_records').insert({
    session_id,
    student_id: user.id,
    question_id,
    question_source: questionSource,
    student_answer,
    is_correct: correct,
    time_spent_seconds: time_spent_seconds ?? null,
  })

  if (answerError) {
    return NextResponse.json({ error: '記錄失敗' }, { status: 500 })
  }

  if (!correct) {
    if (questionSource === 'assessment_questions' && topicId) {
      await service.rpc('upsert_wrong_assessment_question', {
        p_student_id: user.id,
        p_question_id: question_id,
        p_topic_id: topicId,
      })
    } else if (questionSource === 'questions' && legacyCategoryId) {
      await supabase.rpc('upsert_wrong_question', {
        p_student_id: user.id,
        p_question_id: question_id,
        p_category_id: legacyCategoryId,
      })
      // Variation auto-trigger only for legacy-source wrongs (the variation
      // pipeline keys off question_categories — and legacy questions are
      // inactive now so this rarely fires).
      triggerVariationIfNeeded(user.id, legacyCategoryId).catch(() => {})
    }
  } else {
    // Mark progress in wrong bank if previously wrong
    const { data: existing } = await supabase
      .from('wrong_question_bank')
      .select('id, correct_streak')
      .eq('student_id', user.id)
      .eq('question_id', question_id)
      .eq('is_resolved', false)
      .maybeSingle()

    if (existing) {
      const newStreak = (existing.correct_streak ?? 0) + 1
      await supabase
        .from('wrong_question_bank')
        .update({
          correct_streak: newStreak,
          is_resolved: newStreak >= 2,
        })
        .eq('id', existing.id)
    }
  }

  // Mock-exam sessions must not leak correctness back to the client — the
  // UI hides instant feedback and DevTools shouldn't reveal it either. The
  // student still sees their final score on the dedicated results page
  // after the paper completes.
  if (sessionRow.session_type === 'mock_exam') {
    return NextResponse.json({ recorded: true })
  }
  return NextResponse.json({ correct, correct_answer: correctAnswer })
}

async function triggerVariationIfNeeded(studentId: string, categoryId: string) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const { count } = await supabase
    .from('wrong_question_bank')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('category_id', categoryId)
    .eq('is_resolved', false)

  if ((count ?? 0) < WRONG_THRESHOLD) return
  await generateVariationsForCategory(categoryId)
}
