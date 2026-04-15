export type CategoryStat = {
  category_id: string
  category_name: string
  category_code: string
  total_attempts: number
  correct_count: number
  accuracy: number  // 0–100
}

export function computeAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}
