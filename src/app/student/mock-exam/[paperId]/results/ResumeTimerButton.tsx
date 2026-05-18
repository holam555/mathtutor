'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResumeTimerButton({ paperId }: { paperId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      // First call pause_for_lq (idempotent if already paused) then resume
      await fetch(`/api/mock-exam/${paperId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause_for_lq' }),
      })
      const res = await fetch(`/api/mock-exam/${paperId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '無法繼續計時')
        setLoading(false)
        return
      }
      router.push(`/student/mock-exam/${paperId}/lq-timer`)
    } catch {
      setError('網絡錯誤，請重試')
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-3">{error}</p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full h-14 rounded-2xl bg-[#4A90E2] text-white text-base font-bold disabled:opacity-60 active:scale-[0.98] transition shadow-md"
      >
        {loading ? '準備中…' : '繼續計時，開始長答題 →'}
      </button>
    </>
  )
}
