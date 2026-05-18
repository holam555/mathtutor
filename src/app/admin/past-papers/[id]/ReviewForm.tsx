'use client'

import { useState, useTransition } from 'react'
import { approveUpload, rejectUpload, type ApprovedQuestion } from '../actions'
import type { ExtractedQuestion } from '@/lib/gemini'

type Category = {
  id: string
  name: string
  code: string
  grade: number
  semester: string
}

type QuestionState = {
  included: boolean
  question_text: string
  question_type: 'multiple_choice' | 'fill_in' | 'calculation'
  options: string[]
  correct_answer: string
  category_id: string
  difficulty: number
}

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: '選擇題',
  fill_in: '填充題',
  calculation: '計算題',
}

function findCategoryId(code: string, categories: Category[]): string {
  return categories.find((c) => c.code === code)?.id ?? ''
}

export default function ReviewForm({
  uploadId,
  uploadStatus,
  signedUrls,
  extractedQuestions,
  categories,
  uploadMeta,
}: {
  uploadId: string
  uploadStatus: string
  signedUrls: string[]
  extractedQuestions: ExtractedQuestion[]
  categories: Category[]
  uploadMeta: { school_name: string | null; exam_year: number | null }
}) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'approved' | 'rejected' | null>(
    uploadStatus !== 'pending' ? (uploadStatus as 'approved' | 'rejected') : null
  )
  const [tokenResult, setTokenResult] = useState<{ awarded: number; warning: string | null } | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [questions, setQuestions] = useState<QuestionState[]>(() =>
    extractedQuestions.map((q) => ({
      included: !q.has_image, // default-exclude questions that need images
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ?? [],
      correct_answer: q.suggested_answer,
      category_id: findCategoryId(q.suggested_category_code, categories),
      difficulty: 1,
    }))
  )

  function updateQuestion(idx: number, patch: Partial<QuestionState>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  function handleApprove() {
    const selected: ApprovedQuestion[] = questions
      .filter((q) => q.included && q.category_id)
      .map((q) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options : null,
        correct_answer: q.correct_answer,
        category_id: q.category_id,
        difficulty: q.difficulty,
        school_name: uploadMeta.school_name,
        exam_year: uploadMeta.exam_year,
      }))

    startTransition(async () => {
      const res = await approveUpload(uploadId, selected)
      if (res.error) {
        alert(`批准失敗：${res.error}`)
        return
      }
      setTokenResult({ awarded: res.tokensAwarded ?? 0, warning: res.tokenWarning ?? null })
      setDone('approved')
    })
  }

  function handleReject() {
    startTransition(async () => {
      await rejectUpload(uploadId)
      setDone('rejected')
    })
  }

  const includedCount = questions.filter((q) => q.included).length

  if (done === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-700">已批准並加入題庫</p>
        {tokenResult && tokenResult.awarded > 0 && (
          <p className="text-sm text-green-600 mt-1">已發放 🪙 {tokenResult.awarded} 代幣</p>
        )}
        {tokenResult?.warning && (
          <p className="text-sm text-amber-600 mt-1">⚠️ {tokenResult.warning}</p>
        )}
        <a href="/admin/past-papers" className="mt-4 inline-block text-sm text-[#4A90E2] underline">
          返回列表
        </a>
      </div>
    )
  }
  if (done === 'rejected') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <p className="text-gray-400">已拒絕此 Past Paper</p>
        <a href="/admin/past-papers" className="mt-4 inline-block text-sm text-[#4A90E2] underline">
          返回列表
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: images */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500">原試卷圖片</h2>
        {signedUrls.length === 0 ? (
          <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center text-gray-400 text-sm">
            圖片不可用
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrls[currentPage]}
                alt={`第${currentPage + 1}頁`}
                className="w-full object-contain max-h-[600px]"
              />
            </div>
            {signedUrls.length > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg disabled:opacity-40"
                >
                  ← 上頁
                </button>
                <span className="text-sm text-gray-500">
                  第 {currentPage + 1} / {signedUrls.length} 頁
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(signedUrls.length - 1, p + 1))}
                  disabled={currentPage === signedUrls.length - 1}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg disabled:opacity-40"
                >
                  下頁 →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: extracted questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500">
            AI 提取題目（{includedCount} / {questions.length} 已選取）
          </h2>
          <button
            onClick={() =>
              setQuestions((prev) =>
                prev.map((q) => ({ ...q, included: !prev.every((x) => x.included) }))
              )
            }
            className="text-xs text-[#4A90E2] underline"
          >
            {questions.every((q) => q.included) ? '全部取消' : '全部選取'}
          </button>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {questions.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400 text-sm">
              AI 未能提取任何題目
            </div>
          )}
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-4 border transition ${
                q.included ? 'border-[#4A90E2]/40' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Header row */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={q.included}
                  onChange={(e) => updateQuestion(idx, { included: e.target.checked })}
                  className="w-4 h-4 accent-[#4A90E2]"
                />
                <select
                  value={q.question_type}
                  onChange={(e) =>
                    updateQuestion(idx, {
                      question_type: e.target.value as QuestionState['question_type'],
                    })
                  }
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                  {Object.entries(TYPE_LABEL).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
                <select
                  value={q.difficulty}
                  onChange={(e) => updateQuestion(idx, { difficulty: parseInt(e.target.value) })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                  <option value={1}>易</option>
                  <option value={2}>中</option>
                  <option value={3}>難</option>
                </select>
                <span className="text-xs text-gray-400 ml-auto">P{
                  extractedQuestions[idx]?.page_number ?? idx + 1
                }</span>
              </div>

              {/* Category */}
              <select
                value={q.category_id}
                onChange={(e) => updateQuestion(idx, { category_id: e.target.value })}
                className={`w-full text-xs border rounded-lg px-2 py-1.5 bg-white mb-2 ${
                  !q.category_id ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">— 選擇分類 —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} {c.name}
                  </option>
                ))}
              </select>

              {/* Question text */}
              <textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(idx, { question_text: e.target.value })}
                rows={2}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:border-[#4A90E2] outline-none mb-2"
              />

              {/* Options for MC */}
              {q.question_type === 'multiple_choice' && (
                <div className="space-y-1 mb-2">
                  {q.options.map((opt, oi) => (
                    <input
                      key={oi}
                      value={opt}
                      onChange={(e) => {
                        const next = [...q.options]
                        next[oi] = e.target.value
                        updateQuestion(idx, { options: next })
                      }}
                      className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
                    />
                  ))}
                </div>
              )}

              {/* Correct answer */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">答案：</span>
                <input
                  value={q.correct_answer}
                  onChange={(e) => updateQuestion(idx, { correct_answer: e.target.value })}
                  className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {uploadStatus === 'pending' && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApprove}
              disabled={isPending || includedCount === 0}
              className="flex-1 h-11 rounded-xl bg-[#4CAF50] text-white text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {isPending ? '…' : `✓ 批准 ${includedCount} 題並加入題庫`}
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="h-11 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              ✗ 拒絕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
