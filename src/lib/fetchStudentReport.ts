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

  // Sessions in range (include session_type for labelling)
  let sessionsQuery = service
    .from('practice_sessions')
    .select('id, started_at, completed_at, total_questions, correct_count, session_type')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })

  if (sinceISO) sessionsQuery = sessionsQuery.gte('started_at', sinceISO)

  const { data: sessions } = await sessionsQuery

  // Answer records in range
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

  // Streak
  const { data: streakData } = await service.rpc('get_student_streak', { p_student_id: studentId })

  // Category stats
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

  // ── Wrong questions ───────────────────────────────────────────────────────
  // Fetch all unresolved wrong questions (both legacy and assessment)
  const { data: wrongRaw } = await service
    .from('wrong_question_bank')
    .select('wrong_count, question_id, question_source, category_id')
    .eq('student_id', studentId)
    .eq('is_resolved', false)
    .order('wrong_count', { ascending: false })

  const wrongAll = wrongRaw ?? []

  // Split by source
  const legacyWrong = wrongAll.filter(
    (w) => !w.question_source || w.question_source === 'questions' || w.question_source === 'generated_questions'
  )
  const assessmentWrong = wrongAll.filter((w) => w.question_source === 'assessment_questions')

  type WrongGroup = {
    category_name: string
    category_code: string
    questions: {
      id: string
      question_text: string
      correct_answer: string
      last_wrong_answer: string
      wrong_count: number
    }[]
  }

  // Helper: fetch last wrong student answer per question
  async function fetchLastWrongAnswers(questionIds: string[]) {
    const map = new Map<string, string>()
    if (questionIds.length === 0) return map
    const { data: rows } = await service
      .from('answer_records')
      .select('question_id, student_answer, answered_at')
      .eq('student_id', studentId)
      .in('question_id', questionIds)
      .eq('is_correct', false)
      .order('answered_at', { ascending: false })
    for (const row of rows ?? []) {
      if (!map.has(row.question_id)) map.set(row.question_id, row.student_answer ?? '')
    }
    return map
  }

  // ── Legacy wrong questions (grouped by category) ──────────────────────────
  const legacyQIds = Array.from(new Set(legacyWrong.map((w) => w.question_id)))
  const legacyTextMap = new Map<string, string>()
  const legacyAnswerMap = new Map<string, string>()
  const legacyCategoryMap = new Map<string, { name: string; code: string }>()

  if (legacyQIds.length > 0) {
    const { data: qs } = await service
      .from('questions')
      .select('id, question_text, correct_answer, category_id')
      .in('id', legacyQIds)
    for (const q of qs ?? []) {
      legacyTextMap.set(q.id, q.question_text)
      legacyAnswerMap.set(q.id, q.correct_answer)
    }

    // Fetch category names for any that have one
    const catIds = Array.from(new Set(legacyWrong.map((w) => w.category_id).filter(Boolean)))
    if (catIds.length > 0) {
      const { data: cats } = await service
        .from('question_categories')
        .select('id, name, code')
        .in('id', catIds)
      for (const c of cats ?? []) legacyCategoryMap.set(c.id, { name: c.name, code: c.code ?? c.id })
    }
  }

  const legacyLastWrong = await fetchLastWrongAnswers(legacyQIds)

  const groupMap = new Map<string, WrongGroup>()
  for (const w of legacyWrong) {
    const cat = w.category_id ? legacyCategoryMap.get(w.category_id) : null
    const key = cat?.code ?? 'other'
    const catName = cat?.name ?? '其他題目'
    if (!groupMap.has(key)) {
      groupMap.set(key, { category_name: catName, category_code: key, questions: [] })
    }
    groupMap.get(key)!.questions.push({
      id: w.question_id,
      question_text: legacyTextMap.get(w.question_id) ?? '(題目已刪除)',
      correct_answer: legacyAnswerMap.get(w.question_id) ?? '',
      last_wrong_answer: legacyLastWrong.get(w.question_id) ?? '',
      wrong_count: w.wrong_count ?? 1,
    })
  }

  // ── Assessment wrong questions (grouped by curriculum unit) ───────────────
  const assessmentQIds = Array.from(new Set(assessmentWrong.map((w) => w.question_id)))
  if (assessmentQIds.length > 0) {
    const { data: aqs } = await service
      .from('assessment_questions')
      .select('id, question_text, correct_answer, topic_id')
      .in('id', assessmentQIds)

    // Resolve topic → unit
    const topicIds = Array.from(new Set((aqs ?? []).map((q) => q.topic_id)))
    const topicToUnit = new Map<string, { unit_number: number; name: string }>()
    if (topicIds.length > 0) {
      const { data: topics } = await service
        .from('curriculum_topics')
        .select('id, unit_id')
        .in('id', topicIds)
      const unitIds = Array.from(new Set((topics ?? []).map((t) => t.unit_id)))
      if (unitIds.length > 0) {
        const { data: units } = await service
          .from('curriculum_units')
          .select('id, unit_number, name')
          .in('id', unitIds)
        const unitMap = new Map((units ?? []).map((u) => [u.id, u]))
        for (const t of topics ?? []) {
          const u = unitMap.get(t.unit_id)
          if (u) topicToUnit.set(t.id, { unit_number: u.unit_number, name: u.name })
        }
      }
    }

    const aqTextMap = new Map((aqs ?? []).map((q) => [q.id, q.question_text]))
    const aqAnswerMap = new Map((aqs ?? []).map((q) => [q.id, q.correct_answer]))
    const aqTopicMap = new Map((aqs ?? []).map((q) => [q.id, q.topic_id]))
    const aqLastWrong = await fetchLastWrongAnswers(assessmentQIds)

    for (const w of assessmentWrong) {
      const topicId = aqTopicMap.get(w.question_id)
      const unit = topicId ? topicToUnit.get(topicId) : null
      const key = unit ? `U${unit.unit_number}` : 'aq-other'
      const catName = unit ? `U${unit.unit_number} ${unit.name}` : '評估題目'
      if (!groupMap.has(key)) {
        groupMap.set(key, { category_name: catName, category_code: key, questions: [] })
      }
      groupMap.get(key)!.questions.push({
        id: w.question_id,
        question_text: aqTextMap.get(w.question_id) ?? '(題目已刪除)',
        correct_answer: aqAnswerMap.get(w.question_id) ?? '',
        last_wrong_answer: aqLastWrong.get(w.question_id) ?? '',
        wrong_count: w.wrong_count ?? 1,
      })
    }
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
