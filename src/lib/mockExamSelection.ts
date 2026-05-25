// Mock exam paper composition
//
// Goal: produce a 40-question paper (18 多項選擇題 + 17 短答題 + 5 長答題)
// with a paper-level difficulty mix of 20% 易 / 60% 中 / 20% 難.
//
// We always try to fill to 40 questions, treating the difficulty mix as a
// soft target. If a difficulty tier is exhausted, we fill from whatever
// is available. If a section pool is too small, we fall back to filling
// from other sections (only within MC/SQ — LQ is separate).
//
// Sub-question grouping: assessment_questions rows that share a non-null
// `group_id` belong to the same parent prompt (e.g. Q5(a), Q5(b), Q5(c)).
// We must pull a whole group atomically — otherwise students see "(b)"
// without the shared setup/figure from "(a)". Group siblings are sorted
// by `sub_order` so they render in the right order.

import type { DifficultyTier } from '@/types/assessment'

export type AssessmentQuestionRow = {
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

export type LongQuestionRow = {
  id: string
  topic_id: string
  question_text: string
  model_answer: string
  difficulty_tier: DifficultyTier
  image_url: string | null
}

export const PAPER_TARGET = {
  total: 40,
  mc: 18,
  sq: 17,
  lq: 5,
} as const

// Per-section tier targets (sum to overall ≈ 20/60/20)
const TIER_TARGET_MC: Record<DifficultyTier, number> = { basic: 4, enhancement: 11, advanced: 3 }
const TIER_TARGET_SQ: Record<DifficultyTier, number> = { basic: 3, enhancement: 11, advanced: 3 }
const TIER_TARGET_LQ: Record<DifficultyTier, number> = { basic: 1, enhancement: 3, advanced: 1 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Bundle rows into groups. Each row with NULL group_id becomes its own
// singleton group; rows sharing a group_id are bundled and sorted by
// sub_order. The bundle's tier is the tier of its first member.
function bundleGroups(pool: AssessmentQuestionRow[]): AssessmentQuestionRow[][] {
  const groups = new Map<string, AssessmentQuestionRow[]>()
  const singletons: AssessmentQuestionRow[][] = []
  for (const row of pool) {
    if (!row.group_id) {
      singletons.push([row])
      continue
    }
    const list = groups.get(row.group_id) ?? []
    list.push(row)
    groups.set(row.group_id, list)
  }
  const bundled: AssessmentQuestionRow[][] = []
  groups.forEach((list) => {
    list.sort(
      (a: AssessmentQuestionRow, b: AssessmentQuestionRow) =>
        (a.sub_order ?? 0) - (b.sub_order ?? 0)
    )
    bundled.push(list)
  })
  return [...singletons, ...bundled]
}

function pickByTier<T extends { difficulty_tier: DifficultyTier }>(
  pool: T[],
  targetCount: number,
  perTier: Record<DifficultyTier, number>
): T[] {
  const byTier: Record<DifficultyTier, T[]> = {
    basic: shuffle(pool.filter((q) => q.difficulty_tier === 'basic')),
    enhancement: shuffle(pool.filter((q) => q.difficulty_tier === 'enhancement')),
    advanced: shuffle(pool.filter((q) => q.difficulty_tier === 'advanced')),
  }

  const picked: T[] = []
  const tiers: DifficultyTier[] = ['basic', 'enhancement', 'advanced']

  for (const t of tiers) {
    const take = Math.min(perTier[t], byTier[t].length)
    picked.push(...byTier[t].splice(0, take))
  }

  if (picked.length < targetCount) {
    // Fill remainder from whatever's left, ignoring tier
    const leftover = shuffle(tiers.flatMap((t) => byTier[t]))
    picked.push(...leftover.slice(0, targetCount - picked.length))
  }

  return picked.slice(0, targetCount)
}

// Like pickByTier, but each element is a *group* (array of sibling rows
// sharing a group_id, or a singleton). Groups are picked atomically; the
// returned row count may overshoot `targetCount` by the size of the last
// group, since splitting a group would orphan sub-parts. Caller can trim
// if strict count is needed.
function pickGroupsByTier(
  groups: AssessmentQuestionRow[][],
  targetCount: number,
  perTier: Record<DifficultyTier, number>
): AssessmentQuestionRow[] {
  // Tier of a group = tier of its first member (groups should be tier-homogeneous).
  const tierOf = (g: AssessmentQuestionRow[]): DifficultyTier =>
    g[0]?.difficulty_tier ?? 'enhancement'

  const byTier: Record<DifficultyTier, AssessmentQuestionRow[][]> = {
    basic: shuffle(groups.filter((g) => tierOf(g) === 'basic')),
    enhancement: shuffle(groups.filter((g) => tierOf(g) === 'enhancement')),
    advanced: shuffle(groups.filter((g) => tierOf(g) === 'advanced')),
  }

  const picked: AssessmentQuestionRow[] = []
  const pickedGroupIds = new Set<string | null>()
  const tiers: DifficultyTier[] = ['basic', 'enhancement', 'advanced']

  const takeGroup = (g: AssessmentQuestionRow[]) => {
    picked.push(...g)
    pickedGroupIds.add(g[0]?.group_id ?? `_solo:${g[0]?.id}`)
  }

  for (const t of tiers) {
    // Take groups whole; stop when row-quota for the tier would be exceeded
    // by adding the next group (but always allow at least one if quota empty).
    while (byTier[t].length && picked.filter((r) => r.difficulty_tier === t).length < perTier[t]) {
      const g = byTier[t].shift()
      if (!g) break
      takeGroup(g)
    }
  }

  // Top up if still under targetCount, ignoring tier
  if (picked.length < targetCount) {
    const leftover = shuffle(tiers.flatMap((t) => byTier[t]))
    for (const g of leftover) {
      if (picked.length >= targetCount) break
      takeGroup(g)
    }
  }

  return picked
}

export function selectMockExamQuestions(
  mcSqPool: AssessmentQuestionRow[],
  lqPool: LongQuestionRow[]
): {
  mcQuestions: AssessmentQuestionRow[]
  sqQuestions: AssessmentQuestionRow[]
  lqQuestions: LongQuestionRow[]
  difficultyActual: Record<DifficultyTier, number>
} {
  // LQ — no group_id concept on long_questions
  const lqQuestions = pickByTier(lqPool, PAPER_TARGET.lq, TIER_TARGET_LQ)

  // MC — group-aware (a question may have linked sub-parts even if rendered
  // as MC; we still pull siblings together)
  const mcPool = mcSqPool.filter((q) => q.question_type === 'multiple_choice')
  const mcGroups = bundleGroups(mcPool)
  const mcQuestions = pickGroupsByTier(mcGroups, PAPER_TARGET.mc, TIER_TARGET_MC)

  // SQ — fill_in_number is canonical; fall back to fill_in / calculation
  const sqPoolStrict = mcSqPool.filter((q) => q.question_type === 'fill_in_number')
  const sqPoolFallback = mcSqPool.filter(
    (q) => q.question_type === 'fill_in' || q.question_type === 'calculation'
  )
  const sqGroupsStrict = bundleGroups(sqPoolStrict)
  let sqQuestions = pickGroupsByTier(sqGroupsStrict, PAPER_TARGET.sq, TIER_TARGET_SQ)

  if (sqQuestions.length < PAPER_TARGET.sq) {
    const need = PAPER_TARGET.sq - sqQuestions.length
    const usedIds = new Set(sqQuestions.map((q) => q.id))
    const fallbackGroups = bundleGroups(sqPoolFallback.filter((q) => !usedIds.has(q.id)))
    const extras = pickGroupsByTier(fallbackGroups, need, TIER_TARGET_SQ)
    sqQuestions = [...sqQuestions, ...extras]
  }

  // If still under 40 total, top up the SHORT section first, then the other.
  // Previously only SQ was padded — this corrupted the displayed
  // "18 MC + 17 SQ" breakdown when MC was thin.
  const totalSoFar = () => mcQuestions.length + sqQuestions.length + lqQuestions.length
  if (totalSoFar() < PAPER_TARGET.total) {
    const usedIds = new Set([
      ...mcQuestions.map((q) => q.id),
      ...sqQuestions.map((q) => q.id),
    ])

    const mcShort = Math.max(0, PAPER_TARGET.mc - mcQuestions.length)
    const sqShort = Math.max(0, PAPER_TARGET.sq - sqQuestions.length)

    // Pad MC first if it's short, taking groups whole from the wider pool.
    if (mcShort > 0) {
      const remainderMcGroups = bundleGroups(
        mcSqPool.filter((q) => q.question_type === 'multiple_choice' && !usedIds.has(q.id))
      )
      const mcExtras = pickGroupsByTier(remainderMcGroups, mcShort, TIER_TARGET_MC)
      mcQuestions.push(...mcExtras)
      for (const q of mcExtras) usedIds.add(q.id)
    }

    // Then pad SQ.
    if (sqShort > 0 || totalSoFar() < PAPER_TARGET.total) {
      const remainderSqGroups = bundleGroups(
        mcSqPool.filter((q) => q.question_type !== 'multiple_choice' && !usedIds.has(q.id))
      )
      const need = Math.max(sqShort, PAPER_TARGET.total - totalSoFar())
      const sqExtras = pickGroupsByTier(remainderSqGroups, need, TIER_TARGET_SQ)
      sqQuestions.push(...sqExtras)
    }
  }

  // Compute actual distribution
  const difficultyActual: Record<DifficultyTier, number> = {
    basic: 0,
    enhancement: 0,
    advanced: 0,
  }
  for (const q of mcQuestions) difficultyActual[q.difficulty_tier]++
  for (const q of sqQuestions) difficultyActual[q.difficulty_tier]++
  for (const q of lqQuestions) difficultyActual[q.difficulty_tier]++

  return { mcQuestions, sqQuestions, lqQuestions, difficultyActual }
}
