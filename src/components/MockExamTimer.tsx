'use client'

import { useEffect, useState } from 'react'
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
  onExpire,
}: {
  initial: TimerState
  onExpire?: () => void
}) {
  const [remaining, setRemaining] = useState(() => computeRemainingSeconds(initial))

  useEffect(() => {
    if (initial.timer_status !== 'running' && initial.timer_status !== 'paused_for_lq') return
    const tick = () => {
      const r = computeRemainingSeconds(initial)
      setRemaining(r)
      if (r === 0 && onExpire) onExpire()
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

  const paused = initial.timer_status === 'paused_for_lq'

  return (
    <div
      className={`fixed top-3 right-3 z-50 px-3 py-1.5 rounded-full shadow-md text-sm font-mono font-semibold ${
        paused ? 'bg-gray-200 text-gray-600' : 'bg-[#EF9F27] text-white'
      }`}
    >
      {paused ? '⏸ ' : '⏱ '}
      {format(remaining)}
    </div>
  )
}
