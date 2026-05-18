'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState, useMemo, useRef } from 'react'
import { updateQuestion, type QuestionFormState } from '../actions'

type Unit = { id: string; grade: number; unit_number: number; name: string; semester: string; display_order: number }
type Topic = { id: string; unit_id: string; lesson_number: number; name: string; display_order: number }

type QuestionData = {
  id: string
  topic_id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  difficulty_tier: string
  image_url: string | null
}

const GRADE_LABEL: Record<number, string> = { 3: 'P3 小三', 4: 'P4 小四', 5: 'P5 小五', 6: 'P6 小六' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-14 rounded-xl bg-[#4A90E2] text-white text-base font-semibold disabled:opacity-60 active:scale-[0.98] transition"
    >
      {pending ? '儲存中…' : '儲存更改'}
    </button>
  )
}

export default function EditQuestionForm({
  question,
  currentGrade,
  currentUnitId,
  units,
  topics,
}: {
  question: QuestionData
  currentGrade: number
  currentUnitId: string
  units: Unit[]
  topics: Topic[]
}) {
  const boundUpdate = updateQuestion.bind(null, question.id)
  const [state, formAction] = useFormState(boundUpdate, {} as QuestionFormState)

  const [grade, setGrade] = useState(currentGrade)
  const [unitId, setUnitId] = useState(currentUnitId)
  const [topicId, setTopicId] = useState(question.topic_id)
  const [questionType, setQuestionType] = useState(question.question_type)
  const [imagePreview, setImagePreview] = useState<string | null>(question.image_url)
  const [clearImage, setClearImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derive options text from the stored "A. text" format for the inputs
  const initialOptions = useMemo(() => {
    if (!question.options) return { A: '', B: '', C: '', D: '' }
    const map: Record<string, string> = {}
    for (const opt of question.options) {
      const match = opt.match(/^([A-D])\. (.*)$/)
      if (match) map[match[1]] = match[2]
    }
    return { A: map.A ?? '', B: map.B ?? '', C: map.C ?? '', D: map.D ?? '' }
  }, [question.options])

  const gradeUnits = useMemo(() => units.filter((u) => u.grade === grade), [units, grade])
  const unitTopics = useMemo(() => topics.filter((t) => t.unit_id === unitId), [topics, unitId])
  const semesterGroups = useMemo(() => ({
    A: gradeUnits.filter((u) => u.semester === 'A'),
    B: gradeUnits.filter((u) => u.semester === 'B'),
  }), [gradeUnits])
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

  return (
    <form action={formAction} className="space-y-5">

      {/* 1. Grade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">年級</label>
        <div className="grid grid-cols-4 gap-2">
          {[3, 4, 5, 6].map((g) => (
            <button key={g} type="button" onClick={() => onGradeChange(g)}
              className={`h-10 rounded-xl text-sm font-medium border transition ${
                grade === g ? 'border-[#4A90E2] bg-[#4A90E2] text-white' : 'border-gray-300 text-gray-600 hover:border-[#4A90E2]'
              }`}
            >
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 大單元 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">大單元</label>
        <select value={unitId} onChange={(e) => onUnitChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm bg-white"
        >
          <option value="">請選擇大單元</option>
          {semesterGroups.A.length > 0 && (
            <optgroup label="上學期（A 冊）">
              {semesterGroups.A.map((u) => (
                <option key={u.id} value={u.id}>U{u.unit_number} {u.name}</option>
              ))}
            </optgroup>
          )}
          {semesterGroups.B.length > 0 && (
            <optgroup label="下學期（B 冊）">
              {semesterGroups.B.map((u) => (
                <option key={u.id} value={u.id}>U{u.unit_number} {u.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* 3. 小單元 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">小單元</label>
        <select name="topic_id" value={topicId} onChange={(e) => setTopicId(e.target.value)}
          disabled={!unitId} required
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm bg-white disabled:opacity-50"
        >
          <option value="">{unitId ? '請選擇小單元' : '先選大單元'}</option>
          {unitTopics.map((t) => (
            <option key={t.id} value={t.id}>{t.lesson_number}. {t.name}</option>
          ))}
        </select>
        {selectedUnit && (
          <p className="text-xs text-gray-400 mt-1">
            {selectedUnit.semester === 'A' ? '上學期' : '下學期'} · U{selectedUnit.unit_number} {selectedUnit.name}
          </p>
        )}
      </div>

      {/* 4. Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          題目內容 <span className="text-red-500">*</span>
        </label>
        <textarea name="question_text" required rows={4} defaultValue={question.question_text}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm resize-none"
        />
      </div>

      {/* 5. Question type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">題目類型</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'fill_in_number', label: '數字填充' },
            { value: 'multiple_choice', label: '選擇題' },
            { value: 'fill_in', label: '填充題（文字）' },
            { value: 'calculation', label: '計算題' },
          ].map((t) => (
            <label key={t.value}
              className={`flex items-center justify-center h-11 rounded-xl border cursor-pointer text-sm font-medium transition ${
                questionType === t.value ? 'border-[#4A90E2] bg-[#4A90E2]/10 text-[#4A90E2]' : 'border-gray-300 text-gray-600'
              }`}
            >
              <input type="radio" name="question_type" value={t.value}
                checked={questionType === t.value} onChange={() => setQuestionType(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* 6. Options (MC only) */}
      {questionType === 'multiple_choice' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            選項 <span className="text-red-500">*</span>
          </label>
          {(['A', 'B', 'C', 'D'] as const).map((letter) => (
            <div key={letter} className="flex items-center gap-2">
              <span className="w-8 text-sm font-semibold text-gray-500">{letter}.</span>
              <input name={`option_${letter}`} type="text" required
                defaultValue={initialOptions[letter]}
                placeholder={`選項 ${letter}`}
                className="flex-1 h-11 px-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm"
              />
            </div>
          ))}
          <p className="text-xs text-gray-400">正確答案須填整個選項，例「A. 答案文字」</p>
        </div>
      )}

      {/* 7. Correct answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          正確答案 <span className="text-red-500">*</span>
        </label>
        <input name="correct_answer" type="text" required defaultValue={question.correct_answer}
          placeholder={questionType === 'multiple_choice' ? '例：A. 答案文字' : questionType === 'fill_in_number' ? '例：60 或 5/18 或 1 5/8' : '例：正確答案文字'}
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] outline-none text-sm"
        />
      </div>

      {/* 8. Difficulty tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">難度</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'basic', label: '易', sub: '1 步' },
            { value: 'enhancement', label: '中', sub: '2–3 步' },
            { value: 'advanced', label: '難', sub: '4+ 步' },
          ].map((d) => (
            <label key={d.value}
              className="flex flex-col items-center justify-center h-14 rounded-xl border border-gray-300 cursor-pointer transition has-[:checked]:border-[#4A90E2] has-[:checked]:bg-[#4A90E2]/10"
            >
              <input type="radio" name="difficulty_tier" value={d.value}
                defaultChecked={question.difficulty_tier === d.value}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-gray-700">{d.label}</span>
              <span className="text-[10px] text-gray-400">{d.sub}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 9. Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">題目圖片（選填）</label>

        {imagePreview && !clearImage && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="現有圖片"
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
        <p className="text-xs text-gray-400 mt-1">上載新圖片將取代現有圖片。支援 JPG、PNG、WEBP，最大 5MB。</p>
      </div>

      {/* Feedback */}
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">已成功儲存！</p>
      )}

      <SubmitButton />
    </form>
  )
}
