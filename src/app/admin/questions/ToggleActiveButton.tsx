'use client'

import { useTransition } from 'react'
import { toggleQuestionActive } from './actions'

export default function ToggleActiveButton({
  questionId,
  isActive,
}: {
  questionId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await toggleQuestionActive(questionId, !isActive)
        })
      }
      disabled={isPending}
      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
        isActive
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } disabled:opacity-50`}
    >
      {isPending ? '…' : isActive ? '啟用中' : '已停用'}
    </button>
  )
}
