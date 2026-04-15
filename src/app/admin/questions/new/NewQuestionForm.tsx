'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { createQuestion, type QuestionFormState } from '../actions'
import type { QuestionCategory } from '@/types/database'

type CategoryGroup = {
  label: string
  categories: QuestionCategory[]
}

function groupCategories(categories: QuestionCategory[]): CategoryGroup[] {
  const map = new Map<string, QuestionCategory[]>()
  for (const cat of categories) {
    const key = `小${cat.grade === 5 ? '五' : '六'}${cat.semester}學期`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(cat)
  }
  return Array.from(map.entries()).map(([label, cats]) => ({ label, categories: cats }))
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-14 rounded-xl bg-[#4A90E2] text-white text-base font-semibold disabled:opacity-60 active:scale-[0.98] transition"
    >
      {pending ? '儲存中…' : '儲存題目'}
    </button>
  )
}

export default function NewQuestionForm({ categories }: { categories: QuestionCategory[] }) {
  const [state, formAction] = useFormState(createQuestion, {} as QuestionFormState)
  const [questionType, setQuestionType] = useState('fill_in')
  const groups = groupCategories(categories)

  return (
    <form action={formAction} className="space-y-5">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          題目分類 <span className="text-red-500">*</span>
        </label>
        <select
          name="category_id"
          required
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 outline-none text-base bg-white"
        >
          <option value="">請選擇分類</option>
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.code} {cat.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          題目內容 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="question_text"
          required
          rows={3}
          placeholder="例：下列哪個數不是 48 的因數？"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 outline-none text-base resize-none"
        />
      </div>

      {/* Question type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">題目類型</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'multiple_choice', label: '選擇題' },
            { value: 'fill_in', label: '填充題' },
            { value: 'calculation', label: '計算題' },
          ].map((t) => (
            <label
              key={t.value}
              className={`flex items-center justify-center h-11 rounded-xl border cursor-pointer text-sm font-medium transition ${
                questionType === t.value
                  ? 'border-[#4A90E2] bg-[#4A90E2]/10 text-[#4A90E2]'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="radio"
                name="question_type"
                value={t.value}
                checked={questionType === t.value}
                onChange={() => setQuestionType(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Options (multiple choice only) */}
      {questionType === 'multiple_choice' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            選項 <span className="text-red-500">*</span>
          </label>
          {['A', 'B', 'C', 'D'].map((letter) => (
            <div key={letter} className="flex items-center gap-2">
              <span className="w-8 text-sm font-semibold text-gray-500">{letter}.</span>
              <input
                name={`option_${letter}`}
                type="text"
                required={questionType === 'multiple_choice'}
                placeholder={`選項 ${letter}`}
                className="flex-1 h-11 px-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 outline-none text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Correct answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          正確答案 <span className="text-red-500">*</span>
        </label>
        <input
          name="correct_answer"
          type="text"
          required
          placeholder={
            questionType === 'multiple_choice' ? '例：A. 9（必須與選項格式一致）' : '例：5/6'
          }
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 outline-none text-base"
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">難度</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: '1', label: '易' },
            { value: '2', label: '中' },
            { value: '3', label: '難' },
          ].map((d) => (
            <label
              key={d.value}
              className="flex items-center justify-center h-11 rounded-xl border border-gray-300 cursor-pointer text-sm font-medium text-gray-600 has-[:checked]:border-[#4A90E2] has-[:checked]:bg-[#4A90E2]/10 has-[:checked]:text-[#4A90E2] transition"
            >
              <input
                type="radio"
                name="difficulty"
                value={d.value}
                defaultChecked={d.value === '1'}
                className="sr-only"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {state.error && (
        <p className="text-sm text-[#F44336] bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[#4CAF50] bg-green-50 rounded-lg px-3 py-2">
          題目已成功儲存！
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
