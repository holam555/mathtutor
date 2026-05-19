'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MARKS, formatMarks } from '@/lib/mockExamMarks'
import { saveLqReview } from './actions'

export default function LqReviewCard({
  paperId,
  submissionId,
  index,
  questionText,
  modelAnswer,
  questionImageUrl,
  submissionImageUrls,
  aiExtractedAnswer,
  initialCorrectedAnswer,
  initialComment,
  isReviewed,
}: {
  paperId: string
  submissionId: string | null
  index: number
  questionText: string
  modelAnswer: string
  questionImageUrl: string | null
  submissionImageUrls: string[]
  aiExtractedAnswer: string | null
  initialCorrectedAnswer: string | null
  initialComment: string | null
  isReviewed: boolean
}) {
  const router = useRouter()
  const [corrected, setCorrected] = useState(initialCorrectedAnswer ?? aiExtractedAnswer ?? '')
  const [comment, setComment] = useState(initialComment ?? '')
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleSave() {
    if (!submissionId) {
      setFeedback('未上載答卷，無法批改')
      return
    }
    const form = new FormData()
    form.append('teacher_corrected_answer', corrected)
    form.append('teacher_comment', comment)
    startTransition(async () => {
      const res = await saveLqReview(submissionId, paperId, form)
      if (res && 'error' in res && res.error) {
        setFeedback(res.error)
      } else {
        setFeedback('已儲存 ✓')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-bold">{index}.</span>
        <span className="text-xs text-gray-400">（{formatMarks(MARKS.lq)} 分）</span>
        {isReviewed && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            已批改
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{questionText}</p>
      {questionImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={questionImageUrl} alt="" className="max-h-40 rounded-lg border mb-3" />
      )}

      <div className="bg-amber-50 rounded-lg p-3 mb-3">
        <p className="text-xs font-semibold text-amber-800 mb-1">模範答案</p>
        <p className="text-xs text-gray-700 whitespace-pre-wrap">{modelAnswer}</p>
      </div>

      {submissionImageUrls.length > 0 ? (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">學生答卷</p>
          <div className="flex gap-2 overflow-x-auto">
            {submissionImageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0">
                <img src={url} alt="" className="h-32 w-auto rounded-lg border" />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic mb-3">學生答卷未上載</p>
      )}

      <label className="block text-xs font-semibold text-gray-700 mb-1">
        AI 辨識答案（可編輯）
      </label>
      <textarea
        value={corrected}
        onChange={(e) => setCorrected(e.target.value)}
        rows={4}
        placeholder={aiExtractedAnswer ? '' : 'AI 未辨識到內容，請手動輸入'}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#4A90E2] outline-none resize-y mb-3"
      />

      <label className="block text-xs font-semibold text-gray-700 mb-1">老師評語（選填）</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#4A90E2] outline-none resize-y mb-3"
      />

      <button
        onClick={handleSave}
        disabled={pending || !submissionId}
        className="w-full h-11 rounded-xl bg-[#4A90E2] text-white text-sm font-semibold disabled:opacity-60 transition"
      >
        {pending ? '儲存中…' : '儲存批改'}
      </button>

      {feedback && (
        <p className="text-xs text-gray-600 mt-2 text-center">{feedback}</p>
      )}
    </div>
  )
}
