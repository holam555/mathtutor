'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RetryWrongButton({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    setLoading(true)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, mode: 'retry_wrong' }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/student/practice/${data.session_id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="block w-full h-14 rounded-xl bg-[#F44336] text-white text-base font-semibold text-center active:scale-[0.98] transition disabled:opacity-60"
    >
      {loading ? '準備中…' : '🔁 重練錯題'}
    </button>
  )
}
