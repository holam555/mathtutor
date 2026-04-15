'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentHomeClient({
  wrongCount,
  studentId,
}: {
  wrongCount: number
  studentId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startPractice(mode: 'new' | 'retry_wrong') {
    setLoading(mode)
    setError(null)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '請稍後再試')
        return
      }
      router.push(`/student/practice/${data.session_id}`)
    } catch {
      setError('網絡錯誤，請重試')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        onClick={() => startPractice('new')}
        disabled={!!loading}
        className="w-full h-16 rounded-2xl bg-[#1D9E75] text-white text-lg font-bold disabled:opacity-60 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-md"
      >
        {loading === 'new' ? (
          <span className="animate-pulse">準備題目中…</span>
        ) : (
          <>開始練習 <span className="text-xl">→</span></>
        )}
      </button>

      {wrongCount > 0 && (
        <button
          onClick={() => startPractice('retry_wrong')}
          disabled={!!loading}
          className="w-full h-12 rounded-2xl bg-[#EF9F27]/10 border-2 border-[#EF9F27]/30 text-[#C87E10] text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition"
        >
          {loading === 'retry_wrong' ? '準備題目中…' : '挑戰題再戰 ⚔️'}
        </button>
      )}
    </div>
  )
}
