'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  computeRemainingSeconds,
  type TimerState,
} from '@/lib/mockExamTimer'

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MockExamTimer({
  initial,
  paperId,
  sessionId,
  onExpire,
}: {
  initial: TimerState
  // Optional — when both are present, the timer self-handles expiry by
  // completing the practice session, pausing the paper-level timer for the
  // LQ stage, and routing the student to the results page. This is how MC+SQ
  // gets force-submitted when 50 minutes runs out.
  paperId?: string
  sessionId?: string
  onExpire?: () => void
}) {
  const router = useRouter()
  const [remaining, setRemaining] = useState(() => computeRemainingSeconds(initial))
  const [expired, setExpired] = useState(false)
  const expireHandledRef = useRef(false)

  useEffect(() => {
    // Only tick while the timer is actually running. When paused_for_lq, the
    // remaining seconds are fixed by the snapshot taken on pause — there's
    // nothing to recompute, and re-running computeRemainingSeconds every
    // second invites drift if the function ever starts mixing wall-clock
    // into the paused branch. The initial useState seeds the paused display.
    if (initial.timer_status !== 'running') return
    const tick = () => {
      const r = computeRemainingSeconds(initial)
      setRemaining(r)
      if (r === 0 && !expireHandledRef.current) {
        expireHandledRef.current = true
        setExpired(true)
        if (onExpire) onExpire()
        if (paperId && sessionId) void handleExpire()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initial.timer_status,
    initial.timer_started_at,
    initial.timer_paused_at,
    initial.timer_elapsed_seconds,
  ])

  async function handleExpire() {
    // Force-complete the MC+SQ session, then pause the paper-level timer so
    // the student lands at the results bridge page. Both fetches are best-
    // effort: if either fails we still redirect so the student isn't stuck
    // on the now-locked practice page.
    try {
      await fetch('/api/practice/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch {
      /* keep going */
    }
    try {
      await fetch(`/api/mock-exam/${paperId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause_for_lq' }),
      })
    } catch {
      /* keep going */
    }
    router.push(`/student/mock-exam/${paperId}/results`)
  }

  const paused = initial.timer_status === 'paused_for_lq'

  return (
    <>
      <div
        className={`fixed top-3 right-3 z-50 px-3 py-1.5 rounded-full shadow-md text-sm font-mono font-semibold ${
          expired
            ? 'bg-red-500 text-white'
            : paused
              ? 'bg-gray-200 text-gray-600'
              : 'bg-[#EF9F27] text-white'
        }`}
      >
        {expired ? '⏰ ' : paused ? '⏸ ' : '⏱ '}
        {format(remaining)}
      </div>
      {expired && (
        // Full-viewport blocker so the student can't keep tapping answers
        // while we save + redirect. z-[100] beats the timer pill (z-50) and
        // anything inside PracticeFlow.
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-6"
          role="alertdialog"
          aria-live="assertive"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <p className="text-5xl mb-3">⏰</p>
            <p className="text-lg font-bold text-gray-800 mb-1">時間到</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              多項選擇題 + 短答題部分已結束，正在儲存你的答案…
            </p>
          </div>
        </div>
      )}
    </>
  )
}
