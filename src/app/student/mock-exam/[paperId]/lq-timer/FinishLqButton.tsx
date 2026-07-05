'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n/LanguageProvider'

export default function FinishLqButton({ paperId }: { paperId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { t } = useLang()
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!confirm(t('確定已完成所有長答題？停止計時後將無法繼續作答。'))) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mock-exam/${paperId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? t('無法停止計時'))
        setLoading(false)
        return
      }
      router.push('/student')
    } catch {
      setError(t('網絡錯誤，請重試'))
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
        className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold disabled:opacity-60 active:scale-[0.98] transition shadow-md"
      >
        {loading ? t('處理中…') : `${t('我已完成長答題')} ✓`}
      </button>
    </>
  )
}
