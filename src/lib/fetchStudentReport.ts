import { createServiceClient } from '@/lib/supabase/server'
import { computeAccuracy, type CategoryStat } from '@/lib/statsUtils'
import { getRangeSince, type TimeRange } from '@/lib/studentReport'

export async function fetchStudentReport(studentId: string, range: TimeRange) {
  const service = createServiceClient()

  const since = getRangeSince(range)
  const sinceISO = since?.toISOString() ?? null

  // Profile
  const { data: profile } = await service
    .from('student_profiles')
    .select('name, grade')
    .eq('id', studentId)
    .single()

  // Sessions in range
  let sessionsQuery = service
    .from('practice_sessions')
    .select('id, started_at, completed_at, total_questions, correct_count')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })

  if (sinceISO) sessionsQuery = sessionsQuery.gte('started_at', sinceISO)

  const { data: sessions } = await sessionsQuery

  // Answer records in range (for aggregate counts + time)
  let answersQuery = service
    .from('answer_records')
    .select('is_correct, time_spent_seconds, answered_at')
    .eq('student_id', studentId)
  if (sinceISO) answersQuery = answersQuery.gte('answered_at', sinceISO)
  const { data: answers } = await answersQuery

  const totalAnswers = answers?.length ?? 0
  const correctAnswers = (answers ?? []).filter((a) => a.is_correct).length
  const totalTime = (answers ?? []).reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0)
  const avgSecondsPerQuestion = totalAnswers > 0 ? Math.round(totalTime / totalAnswers) : 0

  // Streak (always based on today, not range)
  const { data: streakData } = await service.rpc('get_student_streak', { p_student_id: studentId })

  // Category stats in range
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 365
  const { data: catRaw } = await service.rpc('get_student_category_stats', {
    p_student_id: studentId,
    p_days: days,
  })
  const categoryStats: CategoryStat[] = ((catRaw as CategoryStat[] | null) ?? []).map((c) => ({
    ...c,
    total_attempts: Number(c.total_attempts),
    correct_count: Number(c.correct_count),
    accuracy: computeAccuracy(Number(c.correct_count), Number(c.total_attempts)),
  }))

  // Wrong questions grouped by category (unresolved only)
  const { data: wrongRaw } = await service
    .from('wrong_question_bank')
    .select(`
      wrong_count,
      question_id,
      question_categories!category_id(name, code)
    `)
    .eq('student_id', studentId)
    .eq('is_resolved', false)
    .order('wrong_count', { ascending: false })

  // Fetch question texts in one go
  const questionIds = Array.from(new Set((wrongRaw ?? []).map((w) => w.question_id)))
  const questionTextMap = new Map<string, string>()
  if (questionIds.length > 0) {
    const { data: qs } = await service
      .from('questions')
      .select('id, question_text')
      .in('id', questionIds)
    for (const q of qs ?? []) questionTextMap.set(q.id, q.question_text)
  }

  type WrongGroup = {
    category_name: string
    category_code: string
    questions: { id: string; question_text: string; wrong_count: number }[]
  }

  const groupMap = new Map<string, WrongGroup>()
  for (const w of wrongRaw ?? []) {
    const cat = w.question_categories as unknown as { name: string; code: string } | null
    if (!cat) continue
    const key = cat.code
    if (!groupMap.has(key)) {
      groupMap.set(key, { category_name: cat.name, category_code: cat.code, questions: [] })
    }
    groupMap.get(key)!.questions.push({
      id: w.question_id,
      question_text: questionTextMap.get(w.question_id) ?? '(題目已刪除)',
      wrong_count: w.wrong_count ?? 1,
    })
  }
  const wrongGroups: WrongGroup[] = Array.from(groupMap.values()).sort(
    (a, b) => b.questions.length - a.questions.length
  )

  return {
    profile,
    stats: {
      totalAnswers,
      correctAnswers,
      sessionCount: sessions?.length ?? 0,
      streak: (streakData as number) ?? 0,
    },
    categoryStats,
    sessions: sessions ?? [],
    wrongGroups,
    avgSecondsPerQuestion,
  }
}
