import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAnswerCorrect } from '@/lib/answerUtils'
import { generateVariationsForCategory } from '@/lib/variationGenerator'

const WRONG_THRESHOLD = 3 // auto-trigger variation generation after this many wrongs

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
    category_id: string
    time_spent_seconds?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { session_id, question_id, student_answer, category_id, time_spent_seconds } = body

  // Look up correct_answer server-side — never trust the client.
  const { data: questionRow, error: lookupError } = await supabase
    .from('questions')
    .select('correct_answer')
    .eq('id', question_id)
    .single()

  if (lookupError || !questionRow) {
    return NextResponse.json({ error: '題目不存在' }, { status: 404 })
  }

  const correct = isAnswerCorrect(student_answer, questionRow.correct_answer)

  // Record answer
  const { error: answerError } = await supabase.from('answer_records').insert({
    session_id,
    student_id: user.id,
    question_id,
    question_source: 'questions',
    student_answer,
    is_correct: correct,
    time_spent_seconds: time_spent_seconds ?? null,
  })

  if (answerError) {
    return NextResponse.json({ error: '記錄失敗' }, { status: 500 })
  }

  // Update wrong_question_bank
  if (!correct) {
    await supabase.rpc('upsert_wrong_question', {
      p_student_id: user.id,
      p_question_id: question_id,
      p_category_id: category_id,
    })

    // Auto-trigger variation generation if wrong count crosses threshold
    // Fire-and-forget (don't await — don't block the student response)
    triggerVariationIfNeeded(user.id, category_id).catch(() => {
      // Silently ignore errors — generation failure shouldn't affect student flow
    })
  } else {
    // Update streak in wrong bank
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

  // SECURITY: also return correct_answer to the client so the practice UI can
  // show it in the wrong-answer banner. This is post-submit (the student has
  // already committed their answer) so it does not enable cheating; the
  // /api/practice/start response no longer leaks correct_answer up-front.
  return NextResponse.json({ correct, correct_answer: questionRow.correct_answer })
}

/**
 * Checks if the student has >= WRONG_THRESHOLD unresolved wrong questions
 * in the given category, and if so, generates AI variations for that category.
 * Called fire-and-forget — errors are silently ignored. Calls the generator
 * in-process so it does not need to satisfy the teacher-only check on the
 * /api/variations/generate route.
 */
async function triggerVariationIfNeeded(
  studentId: string,
  categoryId: string,
) {
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
