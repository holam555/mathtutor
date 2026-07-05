'use client'

import { useState, useTransition } from 'react'
import { redeemOption } from './actions'
import { useLang } from '@/lib/i18n/LanguageProvider'

type Child = { id: string; name: string; balance: number }

export default function RedeemButton({
  optionId,
  tokensRequired,
  rewardDescription,
  childCandidates,
}: {
  optionId: string
  tokensRequired: number
  rewardDescription: string
  childCandidates: Child[]
}) {
  const [isPending, startTransition] = useTransition()
  const { t, lang } = useLang()
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const eligible = childCandidates.filter((c) => c.balance >= tokensRequired)
  const canRedeem = eligible.length > 0

  function submit(studentId: string) {
    const child = childCandidates.find((c) => c.id === studentId)
    if (!child) return
    if (
      !confirm(
        lang === 'en'
          ? `Redeem "${rewardDescription}" using ${tokensRequired} of ${child.name}'s credits? The teacher will review after submission.`
          : `用 ${child.name} 的 ${tokensRequired} 個代幣兌換「${rewardDescription}」？提交後等老師審批。`
      )
    )
      return
    setShowPicker(false)
    setResult(null)
    startTransition(async () => {
      const res = await redeemOption(optionId, studentId)
      setResult(res)
    })
  }

  function handleClick() {
    if (eligible.length === 1) {
      submit(eligible[0].id)
    } else {
      setShowPicker(true)
    }
  }

  if (result?.success) {
    return <span className="text-xs text-green-600 font-medium">✓ {t('已提交申請')}</span>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending || !canRedeem}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
          canRedeem
            ? 'bg-[#1D9E75] text-white hover:bg-[#178A66]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        } disabled:opacity-60`}
      >
        {isPending ? '…' : t(canRedeem ? '兌換' : '代幣不足')}
      </button>

      {showPicker && eligible.length > 1 && (
        <div className="absolute right-5 mt-12 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-100 w-56">
          <p className="text-xs text-gray-500 mb-2">{t('用邊位子女的代幣兌換？')}</p>
          <div className="space-y-1">
            {eligible.map((c) => (
              <button
                key={c.id}
                onClick={() => submit(c.id)}
                className="block w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 text-sm"
              >
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400 ml-2">{t('餘')} {c.balance}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="mt-2 w-full text-xs text-gray-400 underline"
          >
            {t('取消')}
          </button>
        </div>
      )}

      {result?.error && <span className="text-xs text-red-500">{result.error}</span>}
    </div>
  )
}
