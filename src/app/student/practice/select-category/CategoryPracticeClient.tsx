'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CategoryPracticeClient({
  categoryId,
  studentId,
  disabled,
}: {
  categoryId: string
  studentId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          mode: 'category',
          category_id: categoryId,
        }),
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
      onClick={handleStart}
      disabled={loading || disabled}
      className="shrink-0 px-4 py-2 rounded-xl bg-[#4A90E2] text-white text-sm font-medium disabled:opacity-40 active:scale-[0.97] transition"
    >
      {loading ? '…' : '練習'}
    </button>
  )
}
