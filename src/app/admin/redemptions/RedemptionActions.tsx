'use client'

import { useTransition, useState } from 'react'
import { approveRedemption, rejectRedemption } from './actions'
import { useLang } from '@/lib/i18n/LanguageProvider'

export function RedemptionButtons({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const { t } = useLang()
  const [done, setDone] = useState<'approved' | 'rejected' | null>(
    status !== 'pending' ? (status as 'approved' | 'rejected') : null
  )

  if (done === 'approved') {
    return <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{t('已批准')}</span>
  }
  if (done === 'rejected') {
    return <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{t('已拒絕')}</span>
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            await approveRedemption(id)
            setDone('approved')
          })
        }
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-medium bg-[#4CAF50] text-white rounded-lg disabled:opacity-50"
      >
        {t('批准')}
      </button>
      <button
        onClick={() =>
          startTransition(async () => {
            await rejectRedemption(id)
            setDone('rejected')
          })
        }
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50"
      >
        {t('拒絕')}
      </button>
    </div>
  )
}
