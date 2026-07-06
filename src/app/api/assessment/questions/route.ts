import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  selectQuestions,
  flattenItemsToRowOrder,
  type SelectionScope,
  type CandidateRow,
} from '@/lib/assessmentSelection'
import type { AssessmentQuestion, DifficultyTier } from '@/types/assessment'
import { TIER_QUOTA } from '@/types/assessment'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { signQuestionImage } from '@/lib/storage'

// GET /api/assessment/questions
//   ?grade=3&unit_ids=uuid,uuid (or topic_ids=uuid,uuid)
// All grades (P3–P6) are DB-backed. The legacy hardcoded-paper path
// (getAssessmentPaper + hc- ids) was removed in the 2026-07 cleanup.
const DB_BACKED_GRADES = new Set([3, 4, 5, 6])

export async function GET(request: NextRequest) {
  // Public endpoint hitting the question bank — generous limit, blocks scraping loops.
  const { allowed, retryAfterSeconds } = rateLimit(`assess-questions:${clientIp(request)}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: '請求太頻繁，請稍後再試' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    )
  }

  const { searchParams } = new URL(request.url)
  const grade = parseInt(searchParams.get('grade') ?? '', 10)

  if (!grade) {
    return NextResponse.json({ error: '請提供年級' }, { status: 400 })
  }

  // Grades outside P3–P6 have no question pool.
  if (!DB_BACKED_GRADES.has(grade)) {
    return NextResponse.json({ error: '暫未支援該年級評估，敬請期待', empty: true }, { status: 200 })
  }

  // ─── DB-backed path (P3, P4, P5, P6): load curriculum + select from assessment_questions ────
  // The new P4-P6 pools all have basic/enhancement/advanced; use default quota.
  // TIER_QUOTA_P5 (advanced=0) was for the legacy P5 pool which is now deactivated.
  const tierQuota = TIER_QUOTA
  const unitIdsRaw = searchParams.get('unit_ids') ?? ''
  const topicIdsRaw = searchParams.get('topic_ids') ?? ''
  const unitIds = unitIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
  const topicIds = topicIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)

  if (unitIds.length === 0 && topicIds.length === 0) {
    return NextResponse.json({ error: '請選擇至少一個單元或主題' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Build scopes:
  // - If topic_ids provided → use topics directly as scopes (drill-down mode).
  // - Else → use units as scopes; expand each unit to its topic ids.
  type ScopeMeta = SelectionScope & { name: string; isTopic: boolean }
  let scopes: ScopeMeta[]
  let allowedTopicIds: string[]

  if (topicIds.length > 0) {
    const { data: topics, error: tErr } = await supabase
      .from('curriculum_topics')
      .select('id, name, display_order, unit_id')
      .in('id', topicIds)
      .order('display_order')

    if (tErr || !topics || topics.length === 0) {
      console.error('Failed to load topics:', tErr)
      return NextResponse.json({ error: '載入小單元失敗' }, { status: 500 })
    }

    scopes = topics.map((t) => ({
      id: t.id,
      display_order: t.display_order,
      topic_ids: [t.id],
      name: t.name,
      isTopic: true,
    }))
    allowedTopicIds = topics.map((t) => t.id)
  } else {
    const { data: units, error: uErr } = await supabase
      .from('curriculum_units')
      .select('id, name, display_order')
      .in('id', unitIds)
      .order('display_order')

    if (uErr || !units || units.length === 0) {
      console.error('Failed to load units:', uErr)
      return NextResponse.json({ error: '載入大單元失敗' }, { status: 500 })
    }

    const { data: unitTopics, error: utErr } = await supabase
      .from('curriculum_topics')
      .select('id, unit_id')
      .in('unit_id', units.map((u) => u.id))

    if (utErr || !unitTopics) {
      console.error('Failed to load topics-by-unit:', utErr)
      return NextResponse.json({ error: '載入小單元失敗' }, { status: 500 })
    }

    const topicsByUnit = new Map<string, string[]>()
    for (const t of unitTopics) {
      if (!topicsByUnit.has(t.unit_id)) topicsByUnit.set(t.unit_id, [])
      topicsByUnit.get(t.unit_id)!.push(t.id)
    }

    scopes = units.map((u) => ({
      id: u.id,
      display_order: u.display_order,
      topic_ids: topicsByUnit.get(u.id) ?? [],
      name: u.name,
      isTopic: false,
    }))
    allowedTopicIds = unitTopics.map((t) => t.id)
  }

  if (allowedTopicIds.length === 0) {
    return NextResponse.json({ questions: [], modules: [], warnings: ['揀咗的單元下面冇任何小單元'] })
  }

  // Pull all candidate questions
  const { data: pool, error: pErr } = await supabase
    .from('assessment_questions')
    .select('id, topic_id, difficulty_tier, group_id, sub_order')
    .in('topic_id', allowedTopicIds)
    .eq('is_active', true)

  if (pErr || !pool) {
    console.error('Failed to load assessment_questions pool:', pErr)
    return NextResponse.json({ error: '載入題目池失敗' }, { status: 500 })
  }

  if (pool.length === 0) {
    return NextResponse.json({
      questions: [],
      modules: [],
      warnings: ['揀咗的範圍內冇題目，題庫尚在建設中'],
      empty: true,
    })
  }

  const candidateRows: CandidateRow[] = pool.map((p) => ({
    id: p.id,
    topic_id: p.topic_id,
    difficulty_tier: p.difficulty_tier as DifficultyTier,
    group_id: p.group_id,
    sub_order: p.sub_order ?? 1,
  }))

  const result = selectQuestions(candidateRows, scopes, tierQuota)
  const orderedRows = flattenItemsToRowOrder(result.selectedItems)
  const orderedRowIds = orderedRows.map((r) => r.id)

  if (orderedRowIds.length === 0) {
    return NextResponse.json({
      questions: [],
      modules: [],
      warnings: result.warnings.length ? result.warnings : ['抽題失敗'],
      empty: true,
    })
  }

  // Fetch full question details for the selected ids
  const { data: full, error: fErr } = await supabase
    .from('assessment_questions')
    .select('id, topic_id, question_text, question_type, options, correct_answer, difficulty_tier, group_id, sub_order, image_url, image_alt_text')
    .in('id', orderedRowIds)

  if (fErr || !full) {
    console.error('Failed to load full question details:', fErr)
    return NextResponse.json({ error: '載入題目詳情失敗' }, { status: 500 })
  }

  // Topic + unit lookup for modules display
  const { data: topicsLookup } = await supabase
    .from('curriculum_topics')
    .select('id, name, unit_id, curriculum_units(id, name)')
    .in('id', Array.from(new Set(full.map((q) => q.topic_id))))

  type TopicLookup = {
    id: string
    name: string
    unit_id: string
    curriculum_units: { id: string; name: string } | { id: string; name: string }[] | null
  }
  const topicMap = new Map<string, TopicLookup>()
  for (const t of (topicsLookup ?? []) as TopicLookup[]) {
    topicMap.set(t.id, t)
  }

  // Preserve the sort order from the selection algorithm
  const byId = new Map(full.map((q) => [q.id, q]))
  const orderedFull = orderedRowIds
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => q != null)

  // ── Dedup pass: replace duplicate question_text entries ─────────────────
  const seenTexts = new Set<string>()
  const usedIds = new Set(orderedFull.map((q) => q.id))
  const dupIndices: { index: number; tier: string }[] = []

  for (let i = 0; i < orderedFull.length; i++) {
    const norm = orderedFull[i].question_text.trim().toLowerCase()
    if (seenTexts.has(norm)) {
      dupIndices.push({ index: i, tier: orderedFull[i].difficulty_tier })
    } else {
      seenTexts.add(norm)
    }
  }

  if (dupIndices.length > 0) {
    // Fetch the full P3 replacement pool (all active questions not already selected)
    const { data: replacementPool } = await supabase
      .from('assessment_questions')
      .select('id, topic_id, question_text, question_type, options, correct_answer, difficulty_tier, group_id, sub_order, image_url, image_alt_text')
      .eq('is_active', true)
      .not('id', 'in', `(${Array.from(usedIds).join(',')})`)

    if (replacementPool && replacementPool.length > 0) {
      const replacementSeenTexts = new Set(seenTexts)
      const byTier = new Map<string, typeof replacementPool>()
      for (const r of replacementPool) {
        const t = r.difficulty_tier
        if (!byTier.has(t)) byTier.set(t, [])
        byTier.get(t)!.push(r)
      }

      for (const { index, tier } of dupIndices) {
        const candidates = byTier.get(tier) ?? []
        const replacement = candidates.find(
          (c) => !replacementSeenTexts.has(c.question_text.trim().toLowerCase())
        )
        if (replacement) {
          orderedFull[index] = replacement as typeof orderedFull[0]
          replacementSeenTexts.add(replacement.question_text.trim().toLowerCase())
          usedIds.add(replacement.id)
          // Remove from candidates to avoid reuse
          const idx = candidates.indexOf(replacement)
          if (idx !== -1) candidates.splice(idx, 1)
        }
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const questions: AssessmentQuestion[] = await Promise.all(orderedFull.map(async (q) => {
    const topic = topicMap.get(q.topic_id)
    const unitData = topic?.curriculum_units
    const unit = Array.isArray(unitData) ? unitData[0] : unitData
    return {
      id: q.id,
      category_id: '',
      question_text: q.question_text,
      question_image_url: await signQuestionImage(supabase, q.image_url),
      question_type: q.question_type as AssessmentQuestion['question_type'],
      options: (q.options as string[] | null) ?? null,
      // SECURITY: never send correct_answer to the client — server grades on submit.
      correct_answer: '',
      difficulty: q.difficulty_tier === 'basic' ? 1 : q.difficulty_tier === 'enhancement' ? 2 : 3,
      is_active: true,
      created_at: new Date().toISOString(),
      category: undefined,
      // module_name = drilldown ? topic name : unit name (for legacy field compat).
      module_name: topicIds.length > 0 ? (topic?.name ?? '') : (unit?.name ?? ''),
      topic_id: q.topic_id,
      topic_name: topic?.name ?? null,
      unit_id: unit?.id ?? null,
      unit_name: unit?.name ?? null,
      difficulty_tier: q.difficulty_tier as DifficultyTier,
      group_id: q.group_id,
      sub_order: q.sub_order ?? 1,
      image_alt_text: q.image_alt_text ?? null,
    }
  }))

  const modules = Array.from(new Set(questions.map((q) => q.module_name).filter(Boolean)))

  return NextResponse.json({
    questions,
    modules,
    warnings: result.warnings,
    perTierActual: result.perTierActual,
  })
}
