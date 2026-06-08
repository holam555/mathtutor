'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StartMockExamButton({
  paperId,
  sessionId,
}: {
  paperId: string
  sessionId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (!sessionId) {
      setError('試卷資料異常，請返回主頁重試')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mock-exam/${paperId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '無法開始計時')
        setLoading(false)
        return
      }
      router.push(`/student/practice/${sessionId}`)
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
        onClick={handleStart}
        disabled={loading}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#EF9F27] to-[#F8B84E] text-white text-base font-bold disabled:opacity-60 active:scale-[0.98] transition shadow-md"
      >
        {loading ? '準備中…' : '開始作答（50 分鐘） →'}
      </button>
    </>
  )
}
