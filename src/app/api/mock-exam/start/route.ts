import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  selectMockExamQuestions,
  type AssessmentQuestionRow,
  type LongQuestionRow,
} from '@/lib/mockExamSelection'

// POST /api/mock-exam/start
//
// Builds a 40-question mock paper based on the student's active 考試範圍,
// creates the `mock_exam_papers` row, and pre-creates the linked
// `practice_sessions` row for the MC+SQ section. Returns the paperId so
// the student can be sent to the intro page.

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const service = createServiceClient()

  // 1. Resolve active exam scope for this student
  const { data: scope } = await service
    .from('exam_scopes')
    .select('id, unit_ids')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!scope || !Array.isArray(scope.unit_ids) || scope.unit_ids.length === 0) {
    return NextResponse.json({ error: '尚未上載考試範圍' }, { status: 404 })
  }

  // 2. Resolve topics in scope
  const { data: topics } = await service
    .from('curriculum_topics')
    .select('id')
    .in('unit_id', scope.unit_ids)

  const topicIds = (topics ?? []).map((t) => t.id)
  if (topicIds.length === 0) {
    return NextResponse.json({ error: '考試範圍內沒有課程小單元' }, { status: 404 })
  }

  // 3. Pull MC/SQ candidates from assessment_questions and LQ candidates
  const [aqRes, lqRes] = await Promise.all([
    service
      .from('assessment_questions')
      .select(
        'id, topic_id, question_text, question_type, options, correct_answer, image_url, image_alt_text, difficulty_tier, group_id, sub_order'
      )
      .in('topic_id', topicIds)
      .eq('is_active', true),
    service
      .from('long_questions')
      .select('id, topic_id, question_text, model_answer, difficulty_tier, image_url')
      .in('topic_id', topicIds)
      .eq('is_active', true),
  ])

  const mcSqPool = (aqRes.data ?? []) as AssessmentQuestionRow[]
  const lqPool = (lqRes.data ?? []) as LongQuestionRow[]

  if (mcSqPool.length === 0 && lqPool.length === 0) {
    return NextResponse.json({ error: '考試範圍內暫時沒有題目' }, { status: 404 })
  }

  const { mcQuestions, sqQuestions, lqQuestions, difficultyActual } = selectMockExamQuestions(
    mcSqPool,
    lqPool
  )

  const mcSqQuestionIds = [...mcQuestions, ...sqQuestions].map((q) => q.id)
  const lqQuestionIds = lqQuestions.map((q) => q.id)

  if (mcSqQuestionIds.length === 0) {
    return NextResponse.json({ error: '考試範圍內沒有可用的 MC/SQ 題目' }, { status: 404 })
  }

  // 4. Create the linked practice_sessions row (MC+SQ phase)
  const { data: session, error: sessionError } = await service
    .from('practice_sessions')
    .insert({
      student_id: user.id,
      session_type: 'mock_exam',
      category_id: null,
      total_questions: mcSqQuestionIds.length,
      question_ids: mcSqQuestionIds,
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: `無法建立練習記錄：${sessionError?.message ?? '未知錯誤'}` },
      { status: 500 }
    )
  }

  // 5. Create the mock_exam_papers row
  const { data: paper, error: paperError } = await service
    .from('mock_exam_papers')
    .insert({
      student_id: user.id,
      exam_scope_id: scope.id,
      scope_unit_ids: scope.unit_ids,
      mc_sq_question_ids: mcSqQuestionIds,
      lq_question_ids: lqQuestionIds,
      mc_sq_session_id: session.id,
      mc_sq_count: mcSqQuestionIds.length,
      lq_count: lqQuestionIds.length,
      difficulty_actual: difficultyActual,
      status: 'in_progress',
      timer_status: 'not_started',
    })
    .select('id')
    .single()

  if (paperError || !paper) {
    return NextResponse.json(
      { error: `無法建立試卷：${paperError?.message ?? '未知錯誤'}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ paper_id: paper.id, session_id: session.id })
}
