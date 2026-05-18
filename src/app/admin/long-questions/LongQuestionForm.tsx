'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createLongQuestion,
  updateLongQuestion,
  type LongQuestionFormState,
} from './actions'

type Unit = {
  id: string
  grade: number
  unit_number: number
  name: string
  semester: string
  display_order: number
}
type Topic = { id: string; unit_id: string; lesson_number: number; name: string; display_order: number }

export type LongQuestionData = {
  id?: string
  topic_id?: string
  question_text?: string
  model_answer?: string
  difficulty_tier?: string
  notes?: string | null
  image_url?: string | null
}

const GRADE_LABEL: Record<number, string> = { 3: 'P3 小三', 4: 'P4 小四', 5: 'P5 小五', 6: 'P6 小六' }

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-14 rounded-xl bg-[#4A90E2] text-white text-base font-semibold disabled:opacity-60 active:scale-[0.98] transition"
    >
      {pending ? '儲存中…' : isEdit ? '儲存更改' : '新增長答題'}
    </button>
  )
}

export default function LongQuestionForm({
  question,
  currentGrade,
  currentUnitId,
  units,
  topics,
}: {
  question?: LongQuestionData
  currentGrade: number
  currentUnitId?: string
  units: Unit[]
  topics: Topic[]
}) {
  const isEdit = !!question?.id
  const router = useRouter()
  const boundAction = isEdit
    ? updateLongQuestion.bind(null, question!.id!)
    : createLongQuestion
  const [state, formAction] = useFormState(boundAction, {} as LongQuestionFormState)

  const [grade, setGrade] = useState(currentGrade)
  const [unitId, setUnitId] = useState(currentUnitId ?? '')
  const [topicId, setTopicId] = useState(question?.topic_id ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(question?.image_url ?? null)
  const [clearImage, setClearImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const gradeUnits = useMemo(() => units.filter((u) => u.grade === grade), [units, grade])
  const unitTopics = useMemo(() => topics.filter((t) => t.unit_id === unitId), [topics, unitId])
  const semesterGroups = useMemo(
    () => ({
      A: gradeUnits.filter((u) => u.semester === 'A'),
      B: gradeUnits.filter((u) => u.semester === 'B'),
    }),
    [gradeUnits]
  )
  const selectedUnit = gradeUnits.find((u) => u.id === unitId)

  function onGradeChange(g: number) {
    setGrade(g)
    setUnitId('')
    setTopicId('')
  }
  function onUnitChange(id: string) {
    setUnitId(id)
    setTopicId('')
  }

  // Redirect after create
  if (!isEdit && state.success && state.newId) {
    // Use a microtask to avoid setState during render
    setTimeout(() => router.push(`/admin/long-questions?grade=${grade}`), 100)
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Grade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">年級</label>
        <div className="grid grid-cols-4 gap-2">
          {[3, 4, 5, 6].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGradeChange(g)}
              className={`h-10 rounded-xl text-sm font-medium border transition ${
                grade === g
                  ? 'border-[#4A90E2] bg-[#4A90E2] text-white'
                  : 'border-gray-300 text-gray-600 hover:border-[#4A90E2]'
              }`}
            >
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">大單元</label>
        <select
          value={unitId}
          onChange={(e) => onUnitChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm bg-white"
        >
          <option value="">請選擇大單元</option>
          {semesterGroups.A.length > 0 && (
            <optgroup label="上學期（A 冊）">
              {semesterGroups.A.map((u) => (
                <option key={u.id} value={u.id}>
                  U{u.unit_number} {u.name}
                </option>
              ))}
            </optgroup>
          )}
          {semesterGroups.B.length > 0 && (
            <optgroup label="下學期（B 冊）">
              {semesterGroups.B.map((u) => (
                <option key={u.id} value={u.id}>
                  U{u.unit_number} {u.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">小單元</label>
        <select
          name="topic_id"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          disabled={!unitId}
          required
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm bg-white disabled:opacity-50"
        >
          <option value="">{unitId ? '請選擇小單元' : '先選大單元'}</option>
          {unitTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.lesson_number}. {t.name}
            </option>
          ))}
        </select>
        {selectedUnit && (
          <p className="text-xs text-gray-400 mt-1">
            {selectedUnit.semester === 'A' ? '上學期' : '下學期'} · U{selectedUnit.unit_number}{' '}
            {selectedUnit.name}
          </p>
        )}
      </div>

      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          題目內容 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="question_text"
          required
          rows={5}
          defaultValue={question?.question_text ?? ''}
          placeholder="請輸入完整題目（可包含多步驟、子題）"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm resize-y"
        />
      </div>

      {/* Model answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          模範答案 / 步驟解析 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="model_answer"
          required
          rows={6}
          defaultValue={question?.model_answer ?? ''}
          placeholder="逐步寫出解題過程及最終答案"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm resize-y font-mono"
        />
        <p className="text-xs text-gray-400 mt-1">家長會用呢個對住學生嘅長答題答卷批改</p>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          難度 <span className="text-red-500">*</span>
        </label>
        <select
          name="difficulty_tier"
          required
          defaultValue={question?.difficulty_tier ?? 'enhancement'}
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm bg-white"
        >
          <option value="basic">易（1 步）</option>
          <option value="enhancement">中（2–3 步）</option>
          <option value="advanced">難（4+ 步）</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備註（選填）</label>
        <input
          name="notes"
          type="text"
          defaultValue={question?.notes ?? ''}
          placeholder="例：來自 XX 學校 2024 期末考第 5 題"
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm"
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">題目圖片（選填）</label>

        {imagePreview && !clearImage && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="題目圖片"
              className="max-h-52 w-auto rounded-xl border border-gray-200 object-contain mb-2"
            />
            <button
              type="button"
              onClick={() => {
                setClearImage(true)
                setImagePreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="text-xs text-red-500 underline"
            >
              移除圖片
            </button>
          </div>
        )}

        {clearImage && <input type="hidden" name="clear_image" value="1" />}

        <input
          ref={fileInputRef}
          type="file"
          name="image_file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setClearImage(false)
            const reader = new FileReader()
            reader.onload = (ev) => setImagePreview(ev.target?.result as string)
            reader.readAsDataURL(file)
          }}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#4A90E2]/10 file:text-[#4A90E2] hover:file:bg-[#4A90E2]/20 transition"
        />
        <p className="text-xs text-gray-400 mt-1">支援 JPG、PNG、WEBP，最大 5MB</p>
      </div>

      {/* Feedback */}
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          {isEdit ? '已成功儲存！' : '已新增！正在跳轉…'}
        </p>
      )}

      <SubmitButton isEdit={isEdit} />
    </form>
  )
}
