'use client'

import { useState, useTransition } from 'react'
import { generateForCategory } from './actions'

export default function GenerateCategoryButton({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; generated?: number; error?: string } | null>(null)

  function handleGenerate() {
    setResult(null)
    startTransition(async () => {
      const res = await generateForCategory(categoryId)
      setResult(res)
      if (res.success) {
        // Refresh the page to show newly generated questions
        setTimeout(() => window.location.reload(), 1000)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4A90E2]/10 text-[#4A90E2] text-sm font-medium hover:bg-[#4A90E2]/20 transition disabled:opacity-50"
      >
        {isPending ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-[#4A90E2]/40 border-t-[#4A90E2] rounded-full animate-spin" />
            生成中…
          </>
        ) : (
          '✨ 用 AI 生成新題目'
        )}
      </button>
      {result && (
        <span className={`text-xs ${result.error ? 'text-red-500' : 'text-green-600'}`}>
          {result.error ?? `已生成 ${result.generated} 條題目`}
        </span>
      )}
    </div>
  )
}
