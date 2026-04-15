'use client'

import { useState, useTransition } from 'react'
import { redeemOption } from './actions'

export default function RedeemButton({
  optionId,
  tokensRequired,
  balance,
}: {
  optionId: string
  tokensRequired: number
  balance: number
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const canRedeem = balance >= tokensRequired

  function handleRedeem() {
    if (!confirm(`確認兌換？將使用 ${tokensRequired} Tokens，申請後等待老師審批。`)) return
    setResult(null)
    startTransition(async () => {
      const res = await redeemOption(optionId)
      setResult(res)
    })
  }

  if (result?.success) {
    return (
      <span className="text-xs text-green-600 font-medium">✓ 已提交申請</span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRedeem}
        disabled={isPending || !canRedeem}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
          canRedeem
            ? 'bg-[#4A90E2] text-white hover:bg-[#3a80d2]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        } disabled:opacity-60`}
      >
        {isPending ? '…' : '兌換'}
      </button>
      {result?.error && (
        <span className="text-xs text-red-500">{result.error}</span>
      )}
    </div>
  )
}
