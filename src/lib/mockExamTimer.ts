// Timer helpers for 模擬考試試卷.
//
// The 50-minute clock runs while the student is answering MC+SQ, pauses
// after they finish that section (so the AI strength/weakness comment can
// be read without bleeding the clock), and resumes when the student clicks
// 「繼續計時」to work on the LQ paper. The timer is server-authoritative —
// `timer_started_at` + `timer_elapsed_seconds` + current pause state lets
// us compute remaining time without trusting the client.

export const MOCK_EXAM_DURATION_SECONDS = 50 * 60

export type TimerStatus = 'not_started' | 'running' | 'paused_for_lq' | 'finished'

export type TimerState = {
  timer_started_at: string | null
  timer_paused_at: string | null
  timer_elapsed_seconds: number
  timer_status: TimerStatus
}

export function computeElapsedSeconds(state: TimerState, now: Date = new Date()): number {
  const base = state.timer_elapsed_seconds ?? 0
  if (state.timer_status === 'running' && state.timer_started_at) {
    const since = Math.floor((now.getTime() - new Date(state.timer_started_at).getTime()) / 1000)
    return base + Math.max(0, since)
  }
  return base
}

export function computeRemainingSeconds(state: TimerState, now: Date = new Date()): number {
  const elapsed = computeElapsedSeconds(state, now)
  return Math.max(0, MOCK_EXAM_DURATION_SECONDS - elapsed)
}
