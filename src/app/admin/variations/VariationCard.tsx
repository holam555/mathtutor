'use client'

import { useState, useTransition } from 'react'
import { approveVariation, rejectVariation } from './actions'
import { useLang } from '@/lib/i18n/LanguageProvider'

type GeneratedQ = {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  difficulty: number
  category: { name: string; code: string } | null
}

export default function VariationCard({ q }: { q: GeneratedQ }) {
  const [isPending, startTransition] = useTransition()
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(q.question_text)
  const [answer, setAnswer] = useState(q.correct_answer)
  const [opts, setOpts] = useState<string[]>(q.options ?? [])
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  if (done === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700">
        ✓ {t('已批准並加入題目庫')}
      </div>
    )
  }
  if (done === 'rejected') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-400">
        ✗ {t('已拒絕')}
      </div>
    )
  }

  const isMultipleChoice = q.question_type === 'multiple_choice'

  function handleApprove() {
    startTransition(async () => {
      const res = await approveVariation(q.id, editing ? { question_text: text, correct_answer: answer, options: isMultipleChoice ? opts : null } : undefined)
      if (!res.error) setDone('approved')
    })
  }

  function handleReject() {
    startTransition(async () => {
      await rejectVariation(q.id)
      setDone('rejected')
    })
  }

  const diffLabel = ['', '易', '中', '難'][q.difficulty] ?? '中'
  const typeLabel: Record<string, string> = {
    multiple_choice: '選擇題',
    fill_in: '填充題',
    calculation: '計算題',
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-medium text-[#4A90E2] bg-[#4A90E2]/10 px-2 py-0.5 rounded-full">
          {q.category?.code} {q.category?.name}
        </span>
        <span className="text-xs text-gray-400">{t(typeLabel[q.question_type])}</span>
        <span className="text-xs text-gray-400">{t('難度：')}{t(diffLabel)}</span>
        <button
          onClick={() => setEditing((e) => !e)}
          className="ml-auto text-xs text-gray-400 underline"
        >
          {editing ? t('取消修改') : `✏️ ${t('修改')}`}
        </button>
      </div>

      {/* Question text */}
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:border-[#4A90E2] outline-none mb-2"
        />
      ) : (
        <p className="text-sm text-gray-800 mb-2">{q.question_text}</p>
      )}

      {/* Options */}
      {isMultipleChoice && (
        <div className="space-y-1 mb-2">
          {(editing ? opts : q.options ?? []).map((opt, i) => (
            editing ? (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...opts]
                  next[i] = e.target.value
                  setOpts(next)
                }}
                className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
              />
            ) : (
              <p key={i} className={`text-xs px-2 py-1 rounded-lg ${opt === q.correct_answer ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                {opt}
              </p>
            )
          ))}
        </div>
      )}

      {/* Correct answer */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">{t('正確答案：')}</span>
        {editing ? (
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
          />
        ) : (
          <span className="text-sm font-medium text-[#4CAF50]">{q.correct_answer}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex-1 h-10 rounded-xl bg-[#4CAF50] text-white text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
        >
          {isPending ? '…' : editing ? t('修改並批准') : `✓ ${t('批准')}`}
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
        >
          ✗ {t('拒絕')}
        </button>
      </div>
    </div>
  )
}
