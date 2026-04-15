/**
 * Shared helpers for loading student performance reports.
 * Used by /admin/students/[id] and /parent/child/[id].
 */

export type TimeRange = 'week' | 'month' | 'all'

export function getRangeSince(range: TimeRange): Date | null {
  if (range === 'week') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  if (range === 'month') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return null
}

export function statusBadge(accuracy: number, sessions: number): {
  label: string
  color: string
} {
  if (sessions < 3) {
    return { label: '需跟進', color: 'text-red-600 bg-red-50 border-red-200' }
  }
  if (accuracy >= 85) return { label: '優秀', color: 'text-green-600 bg-green-50 border-green-200' }
  if (accuracy >= 70) return { label: '良好', color: 'text-[#4A90E2] bg-[#4A90E2]/10 border-[#4A90E2]/30' }
  if (accuracy >= 50) return { label: '尚可', color: 'text-amber-600 bg-amber-50 border-amber-200' }
  return { label: '需跟進', color: 'text-red-600 bg-red-50 border-red-200' }
}

export function getInitial(name: string | null | undefined): string {
  if (!name) return '?'
  return name.charAt(0)
}
