import type { DifficultyTier } from '@/types/assessment'

/**
 * Legacy features (past-paper extraction, AI variations) grade difficulty
 * as an int 1-3; the current question bank uses named tiers. One mapping,
 * used by every legacy→assessment_questions write path.
 */
export function intToTier(difficulty: number): DifficultyTier {
  if (difficulty <= 1) return 'basic'
  if (difficulty >= 3) return 'advanced'
  return 'enhancement'
}
