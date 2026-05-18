import { createServiceClient } from '@/lib/supabase/server'

export type ExamPaperQuestion = {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  difficulty_tier: string
  unit_number: number
  unit_name: string
}

export type ExamPaperData = {
  examName: string | null
  examDate: string | null
  questions: ExamPaperQuestion[]
}

export async function fetchExamPaper(studentId: string): Promise<ExamPaperData | null> {
  const service = createServiceClient()

  const { data: scope } = await service
    .from('exam_scopes')
    .select('id, exam_name, exam_date, unit_ids')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!scope?.unit_ids?.length) return null

  const { data: units } = await service
    .from('curriculum_units')
    .select('id, unit_number, name, display_order')
    .in('id', scope.unit_ids)
    .order('display_order')

  if (!units?.length) return null

  const { data: topics } = await service
    .from('curriculum_topics')
    .select('id, unit_id')
    .in('unit_id', units.map((u) => u.id))

  if (!topics?.length) return { examName: scope.exam_name ?? null, examDate: scope.exam_date ?? null, questions: [] }

  const topicToUnit = new Map(topics.map((t) => [t.id, t.unit_id]))

  const { data: rows } = await service
    .from('assessment_questions')
    .select('id, topic_id, question_text, question_type, options, correct_answer, difficulty_tier')
    .in('topic_id', topics.map((t) => t.id))
    .eq('is_active', true)
    .order('difficulty_tier')

  const unitMap = new Map(units.map((u) => [u.id, u]))

  const questions: ExamPaperQuestion[] = (rows ?? []).map((q) => {
    const unitId = topicToUnit.get(q.topic_id) ?? ''
    const unit = unitMap.get(unitId)
    return {
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: (q.options as string[] | null) ?? null,
      correct_answer: q.correct_answer,
      difficulty_tier: q.difficulty_tier ?? 'basic',
      unit_number: unit?.unit_number ?? 0,
      unit_name: unit?.name ?? '',
    }
  })

  // Sort: by unit display_order, then tier (basic→enhancement→advanced)
  const tierOrder: Record<string, number> = { basic: 0, enhancement: 1, advanced: 2 }
  const unitDisplayOrder = new Map(units.map((u, i) => [u.id, i]))
  const qToUnitOrder = new Map(
    (rows ?? []).map((r) => [r.id, unitDisplayOrder.get(topicToUnit.get(r.topic_id) ?? '') ?? 0])
  )
  questions.sort((a, b) => {
    const diff = (qToUnitOrder.get(a.id) ?? 0) - (qToUnitOrder.get(b.id) ?? 0)
    if (diff !== 0) return diff
    return (tierOrder[a.difficulty_tier] ?? 0) - (tierOrder[b.difficulty_tier] ?? 0)
  })

  return {
    examName: scope.exam_name ?? null,
    examDate: scope.exam_date ?? null,
    questions,
  }
}
