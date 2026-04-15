'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WrongBankClient({
  categoryId,
  studentId,
}: {
  categoryId: string
  studentId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function startCategoryRetry() {
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
      onClick={startCategoryRetry}
      disabled={loading}
      className="text-sm text-[#4A90E2] font-medium disabled:opacity-50"
    >
      {loading ? '…' : '練習 →'}
    </button>
  )
}
