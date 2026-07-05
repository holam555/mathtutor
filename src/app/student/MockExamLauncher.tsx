'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n/LanguageProvider'

export default function MockExamLauncher() {
  const router = useRouter()
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mock-exam/start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('請稍後再試'))
        return
      }
      router.push(`/student/mock-exam/${data.paper_id}/start`)
    } catch {
      setError(t('網絡錯誤，請重試'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleStart}
        disabled={loading}
        className="block w-full text-left bg-gradient-to-br from-[#EF9F27] to-[#F8B84E] rounded-2xl p-5 shadow-md active:scale-[0.98] transition disabled:opacity-60"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-white">📝 {t('模擬考試試卷')}</p>
            <p className="text-xs text-white/85 mt-0.5">
              {loading ? t('準備試卷中…') : t('40 題 · 50 分鐘 · 多項選擇題 + 短答題 + 長答題')}
            </p>
          </div>
          <span className="text-white/80 text-sm">→</span>
        </div>
      </button>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">{error}</p>
      )}
    </div>
  )
}
