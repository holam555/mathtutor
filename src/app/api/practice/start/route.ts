import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  selectQuestions,
  flattenItemsToRowOrder,
  type SelectionScope,
  type CandidateRow,
} from '@/lib/assessmentSelection'
import type { DifficultyTier } from '@/types/assessment'

const SESSION_SIZE = 10
const EXAM_SPRINT_SIZE = 15
const TIER_QUOTA_PRACTICE_10: Record<DifficultyTier, number> = {
  basic: 5,
  enhancement: 4,
  advanced: 1,
}
const TIER_QUOTA_PRACTICE_15: Record<DifficultyTier, number> = {
  basic: 7,
  enhancement: 6,
  advanced: 2,
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type AssessmentRow = {
  id: string
  topic_id: string
  question_text: string
  question_type: 'multiple_choice' | 'fill_in' | 'fill_in_number' | 'calculation'
  options: unknown
  correct_answer: string
  image_url: string | null
  image_alt_text: string | null
  difficulty_tier: DifficultyTier
  group_id: string | null
  sub_order: number | null
}

const isNumericAnswer = (s: string | null | undefined) =>
  !!s && /^-?\d+(\.\d+)?(又\d+\/\d+|\/\d+)?$/.test(s.trim())

function toSessionQuestion(q: AssessmentRow) {
  return {
    id: q.id,
    topic_id: q.topic_id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: (q.options as string[] | null) ?? null,
    question_image_url: q.image_url,
    image_alt_text: q.image_alt_text,
    correct_answer: '',
    numeric_answer: isNumericAnswer(q.correct_answer),
    category_id: null as string | null,
    difficulty:
      q.difficulty_tier === 'basic' ? 1 : q.difficulty_tier === 'enhancement' ? 2 : 3,
    is_active: true,
    source: 'assessment_questions' as const,
    school_name: null,
    exam_year: null,
    created_at: new Date().toISOString(),
  }
}

async function selectFromAssessment(
  service: ReturnType<typeof createServiceClient>,
  unitIds: string[],
  tierQuota: Record<DifficultyTier, number>,
): Promise<AssessmentRow[]> {
  if (unitIds.length === 0) return []

  const { data: units } = await service
    .from('curriculum_units')
    .select('id, display_order')
    .in('id', unitIds)
    .order('display_order')

  if (!units || units.length === 0) return []

  const { data: unitTopics } = await service
    .from('curriculum_topics')
    .select('id, unit_id')
    .in('unit_id', units.map((u) => u.id))

  const topicsByUnit = new Map<string, string[]>()
  for (const t of unitTopics ?? []) {
    if (!topicsByUnit.has(t.unit_id)) topicsByUnit.set(t.unit_id, [])
    topicsByUnit.get(t.unit_id)!.push(t.id)
  }

  const scopes: SelectionScope[] = units.map((u) => ({
    id: u.id,
    display_order: u.display_order,
    topic_ids: topicsByUnit.get(u.id) ?? [],
  }))

  const allTopicIds = scopes.flatMap((s) => s.topic_ids)
  if (allTopicIds.length === 0) return []

  const { data: pool } = await service
    .from('assessment_questions')
    .select('id, topic_id, difficulty_tier, group_id, sub_order')
    .in('topic_id', allTopicIds)
    .eq('is_active', true)

  if (!pool || pool.length === 0) return []

  const candidateRows: CandidateRow[] = pool.map((p) => ({
    id: p.id,
    topic_id: p.topic_id,
    difficulty_tier: p.difficulty_tier as DifficultyTier,
    group_id: p.group_id,
    sub_order: p.sub_order ?? 1,
  }))

  const result = selectQuestions(candidateRows, scopes, tierQuota)
  const orderedRowIds = flattenItemsToRowOrder(result.selectedItems).map((r) => r.id)
  if (orderedRowIds.length === 0) return []

  const { data: full } = await service
    .from('assessment_questions')
    .select(
      'id, topic_id, question_text, question_type, options, correct_answer, image_url, image_alt_text, difficulty_tier, group_id, sub_order',
    )
    .in('id', orderedRowIds)

  if (!full) return []

  const byId = new Map((full as AssessmentRow[]).map((q) => [q.id, q]))
  return orderedRowIds
    .map((id) => byId.get(id))
    .filter((q): q is AssessmentRow => q != null)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: { mode: string; unit_id?: string; category_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { mode, unit_id, category_id } = body
  const VALID_MODES = ['new', 'retry_wrong', 'unit', 'exam_sprint', 'category']
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: '無效的練習模式' }, { status: 400 })
  }

  const service = createServiceClient()

  // ── retry_wrong ──────────────────────────────────────────────
  if (mode === 'retry_wrong') {
    const { data: wrongEntries } = await supabase
      .from('wrong_question_bank')
      .select('question_id, question_source')
      .eq('student_id', user.id)
      .eq('is_resolved', false)
      .order('wrong_count', { ascending: false })
      .limit(SESSION_SIZE)

    if (!wrongEntries?.length) {
      return NextResponse.json({ error: '沒有待重練的錯題' }, { status: 400 })
    }

    const legacyIds = wrongEntries
      .filter((e) => e.question_source === 'questions')
      .map((e) => e.question_id)
    const assessmentIds = wrongEntries
      .filter((e) => e.question_source === 'assessment_questions')
      .map((e) => e.question_id)

    const [legacyRes, assessRes] = await Promise.all([
      legacyIds.length
        ? service.from('questions').select('*').in('id', legacyIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      assessmentIds.length
        ? service
            .from('assessment_questions')
            .select(
              'id, topic_id, question_text, question_type, options, correct_answer, image_url, image_alt_text, difficulty_tier, group_id, sub_order',
            )
            .in('id', assessmentIds)
        : Promise.resolve({ data: [] as AssessmentRow[] }),
    ])

    const legacyMap = new Map(
      ((legacyRes.data ?? []) as Array<Record<string, unknown> & { id: string }>).map(
        (q) => [q.id, q],
      ),
    )
    const assessMap = new Map(
      ((assessRes.data ?? []) as AssessmentRow[]).map((q) => [q.id, q]),
    )

    const ordered: ReturnType<typeof toSessionQuestion>[] = []
    for (const e of wrongEntries) {
      if (e.question_source === 'questions') {
        const q = legacyMap.get(e.question_id)
        if (q) {
          ordered.push({
            id: q.id as string,
            topic_id: '' as string,
            question_text: q.question_text as string,
            question_type: q.question_type as AssessmentRow['question_type'],
            options: (q.options as string[] | null) ?? null,
            question_image_url: (q.question_image_url as string | null) ?? null,
            image_alt_text: (q.image_alt_text as string | null) ?? null,
            correct_answer: '',
            numeric_answer: isNumericAnswer(q.correct_answer as string),
            category_id: (q.category_id as string | null) ?? null,
            difficulty: (q.difficulty as number) ?? 1,
            is_active: true,
            source: 'questions' as 'assessment_questions',
            school_name: null,
            exam_year: null,
            created_at: new Date().toISOString(),
          })
        }
      } else if (e.question_source === 'assessment_questions') {
        const q = assessMap.get(e.question_id)
        if (q) ordered.push(toSessionQuestion(q))
      }
    }

    if (!ordered.length) {
      return NextResponse.json({ error: '錯題已不可用' }, { status: 404 })
    }

    return await createSessionAndRespond(service, user.id, 'retry_wrong', null, shuffle(ordered))
  }

  // ── unit / category (single unit drill) ───────────────────────
  if (mode === 'unit' || mode === 'category') {
    const targetUnitId = unit_id ?? category_id
    if (!targetUnitId) {
      return NextResponse.json({ error: '請選擇單元' }, { status: 400 })
    }
    const rows = await selectFromAssessment(service, [targetUnitId], TIER_QUOTA_PRACTICE_10)
    if (rows.length === 0) {
      return NextResponse.json({ error: '此單元暫時沒有題目' }, { status: 404 })
    }
    const final = shuffle(rows.slice(0, SESSION_SIZE)).map(toSessionQuestion)
    return await createSessionAndRespond(service, user.id, 'unit', null, final)
  }

  // ── exam_sprint ──────────────────────────────────────────────
  if (mode === 'exam_sprint') {
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

    const rows = await selectFromAssessment(service, scope.unit_ids, TIER_QUOTA_PRACTICE_15)
    if (rows.length === 0) {
      return NextResponse.json({ error: '考試範圍內暫時沒有題目' }, { status: 404 })
    }
    const final = shuffle(rows.slice(0, EXAM_SPRINT_SIZE)).map(toSessionQuestion)
    return await createSessionAndRespond(service, user.id, 'exam_sprint', null, final)
  }

  // ── new: teacher-assigned topics (if any) override auto selection ──
  const { data: assignments } = await service
    .from('student_topic_assignments')
    .select('topic_id')
    .eq('student_id', user.id)
    .eq('is_active', true)

  if (assignments && assignments.length > 0) {
    const assignedTopicIds = assignments.map((a) => a.topic_id)

    const { data: pool } = await service
      .from('assessment_questions')
      .select(
        'id, topic_id, question_text, question_type, options, correct_answer, image_url, image_alt_text, difficulty_tier, group_id, sub_order',
      )
      .in('topic_id', assignedTopicIds)
      .eq('is_active', true)

    if (pool && pool.length > 0) {
      const scopes: SelectionScope[] = assignedTopicIds.map((tid, i) => ({
        id: tid,
        display_order: i,
        topic_ids: [tid],
      }))
      const candidateRows: CandidateRow[] = (pool as AssessmentRow[]).map((p) => ({
        id: p.id,
        topic_id: p.topic_id,
        difficulty_tier: p.difficulty_tier as DifficultyTier,
        group_id: p.group_id,
        sub_order: p.sub_order ?? 1,
      }))
      const result = selectQuestions(candidateRows, scopes, TIER_QUOTA_PRACTICE_10)
      const orderedIds = flattenItemsToRowOrder(result.selectedItems).map((r) => r.id)
      const byId = new Map((pool as AssessmentRow[]).map((q) => [q.id, q]))
      const rows = orderedIds
        .map((id) => byId.get(id))
        .filter((q): q is AssessmentRow => q != null)

      if (rows.length > 0) {
        const final = shuffle(rows.slice(0, SESSION_SIZE)).map(toSessionQuestion)
        return await createSessionAndRespond(service, user.id, 'new', null, final)
      }
    }
    // Fall through to auto selection if assigned topics have no questions
  }

  // ── new: weakest units + fallback random of student's grade ──
  const { data: profile } = await service
    .from('student_profiles')
    .select('grade')
    .eq('id', user.id)
    .single()

  if (!profile?.grade) {
    return NextResponse.json({ error: '尚未設定年級' }, { status: 400 })
  }

  const { data: gradeUnits } = await service
    .from('curriculum_units')
    .select('id')
    .eq('grade', profile.grade)
    .neq('unit_number', 999)

  const allUnitIds = (gradeUnits ?? []).map((u) => u.id)
  if (allUnitIds.length === 0) {
    return NextResponse.json({ error: '尚未設定此年級的課程' }, { status: 404 })
  }

  const { data: statsRaw } = await service.rpc('get_student_unit_stats', {
    p_student_id: user.id,
    p_days: 30,
  })
  type UnitStat = { unit_id: string; total_attempts: number; correct_count: number }
  const stats: UnitStat[] = ((statsRaw as UnitStat[] | null) ?? [])
    .map((s) => ({
      unit_id: s.unit_id,
      total_attempts: Number(s.total_attempts),
      correct_count: Number(s.correct_count),
    }))
    .sort((a, b) => {
      const accA = a.total_attempts > 0 ? a.correct_count / a.total_attempts : 1
      const accB = b.total_attempts > 0 ? b.correct_count / b.total_attempts : 1
      return accA - accB
    })

  const weakUnitIds = stats
    .slice(0, 3)
    .map((s) => s.unit_id)
    .filter((id) => allUnitIds.includes(id))
  const focusUnitIds = weakUnitIds.length > 0 ? weakUnitIds : shuffle(allUnitIds).slice(0, 3)

  const rows = await selectFromAssessment(service, focusUnitIds, TIER_QUOTA_PRACTICE_10)
  if (rows.length === 0) {
    return NextResponse.json({ error: '找不到題目，請聯絡老師' }, { status: 404 })
  }
  const final = shuffle(rows.slice(0, SESSION_SIZE)).map(toSessionQuestion)
  return await createSessionAndRespond(service, user.id, 'new', null, final)
}

async function createSessionAndRespond(
  service: ReturnType<typeof createServiceClient>,
  studentId: string,
  sessionType: 'new' | 'retry_wrong' | 'unit' | 'exam_sprint' | 'category',
  categoryId: string | null,
  questions: ReturnType<typeof toSessionQuestion>[],
) {
  const { data: session, error: sessionError } = await service
    .from('practice_sessions')
    .insert({
      student_id: studentId,
      session_type: sessionType,
      category_id: categoryId,
      total_questions: questions.length,
      question_ids: questions.map((q) => q.id),
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: '無法建立練習記錄' }, { status: 500 })
  }

  return NextResponse.json({ session_id: session.id, questions })
}
