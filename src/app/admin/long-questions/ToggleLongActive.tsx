'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleLongQuestionActive } from './actions'
import { useLang } from '@/lib/i18n/LanguageProvider'

export default function ToggleLongActive({
  questionId,
  isActive,
}: {
  questionId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { t } = useLang()

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await toggleLongQuestionActive(questionId, !isActive)
          router.refresh()
        })
      }
      disabled={isPending}
      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
        isActive
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } disabled:opacity-50`}
    >
      {isPending ? '…' : t(isActive ? '啟用中' : '已停用')}
    </button>
  )
}
