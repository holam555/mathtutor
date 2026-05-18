// Mock exam paper composition
//
// Goal: produce a 40-question paper (18 多項選擇題 + 17 短答題 + 5 長答題)
// with a paper-level difficulty mix of 20% 易 / 60% 中 / 20% 難.
//
// We always try to fill to 40 questions, treating the difficulty mix as a
// soft target. If a difficulty tier is exhausted, we fill from whatever
// is available. If a section pool is too small, we fall back to filling
// from other sections (only within MC/SQ — LQ is separate).

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
  total_marks: number
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

export function selectMockExamQuestions(
  mcSqPool: AssessmentQuestionRow[],
  lqPool: LongQuestionRow[]
): {
  mcQuestions: AssessmentQuestionRow[]
  sqQuestions: AssessmentQuestionRow[]
  lqQuestions: LongQuestionRow[]
  difficultyActual: Record<DifficultyTier, number>
} {
  // LQ
  const lqQuestions = pickByTier(lqPool, PAPER_TARGET.lq, TIER_TARGET_LQ)

  // MC
  const mcPool = mcSqPool.filter((q) => q.question_type === 'multiple_choice')
  const mcQuestions = pickByTier(mcPool, PAPER_TARGET.mc, TIER_TARGET_MC)

  // SQ — fill_in_number is the canonical SQ, but allow fill_in/calculation as fallback
  const sqPoolStrict = mcSqPool.filter((q) => q.question_type === 'fill_in_number')
  const sqPoolFallback = mcSqPool.filter(
    (q) => q.question_type === 'fill_in' || q.question_type === 'calculation'
  )
  let sqQuestions = pickByTier(sqPoolStrict, PAPER_TARGET.sq, TIER_TARGET_SQ)

  if (sqQuestions.length < PAPER_TARGET.sq) {
    const need = PAPER_TARGET.sq - sqQuestions.length
    const usedIds = new Set(sqQuestions.map((q) => q.id))
    const extras = shuffle(sqPoolFallback.filter((q) => !usedIds.has(q.id))).slice(0, need)
    sqQuestions = [...sqQuestions, ...extras]
  }

  // If still under 40 total, top up MC+SQ together from the wider pool
  let total = mcQuestions.length + sqQuestions.length + lqQuestions.length
  if (total < PAPER_TARGET.total) {
    const usedIds = new Set([
      ...mcQuestions.map((q) => q.id),
      ...sqQuestions.map((q) => q.id),
    ])
    const remainder = shuffle(mcSqPool.filter((q) => !usedIds.has(q.id)))
    const need = PAPER_TARGET.total - total
    sqQuestions = [...sqQuestions, ...remainder.slice(0, need)]
    total = mcQuestions.length + sqQuestions.length + lqQuestions.length
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
