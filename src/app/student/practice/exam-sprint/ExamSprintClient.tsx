'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n/LanguageProvider'

export default function ExamSprintClient({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { t } = useLang()
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, mode: 'exam_sprint' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('請稍後再試'))
        return
      }
      router.push(`/student/practice/${data.session_id}`)
    } catch {
      setError(t('網絡錯誤，請重試'))
    } finally {
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
        {loading ? t('準備題目中…') : `${t('開始衝刺練習')} →`}
      </button>
    </>
  )
}
