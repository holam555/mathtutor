'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n/LanguageProvider'

export default function WrongBankClient({
  unitId,
  categoryId,
  studentId,
}: {
  unitId?: string
  categoryId?: string
  studentId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { t } = useLang()

  async function startRetry() {
    setLoading(true)
    try {
      const body: Record<string, unknown> = { student_id: studentId }
      if (unitId) {
        body.mode = 'unit'
        body.unit_id = unitId
      } else if (categoryId) {
        body.mode = 'category'
        body.category_id = categoryId
      } else {
        return
      }
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) router.push(`/student/practice/${data.session_id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={startRetry}
      disabled={loading}
      className="text-sm text-[#1D9E75] font-medium disabled:opacity-50"
    >
      {loading ? '…' : `${t('練習')} →`}
    </button>
  )
}
