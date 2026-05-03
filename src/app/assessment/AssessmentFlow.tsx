'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isAnswerCorrect } from '@/lib/answerUtils'
import FractionDisplay, { InlineMath } from '@/components/FractionDisplay'
import UnifiedKeyboard from '@/components/UnifiedKeyboard'
import type { AssessmentQuestion, AssessmentAnswer, CurriculumUnit } from '@/types/assessment'

// ── Types ──────────────────────────────────────────────────────────────────

type Step =
  | 'grade_select'
  | 'loading_curriculum'
  | 'unit_select'
  | 'topic_select'
  | 'loading_questions'
  | 'empty'
  | 'questions'
  | 'contact_form'
  | 'generating'
  | 'error'

type GradeOption = { label: string; grade: number; gradeLevel: string; available: boolean }

const GRADE_OPTIONS: GradeOption[] = [
  { label: '小三（P3）', grade: 3, gradeLevel: '小三', available: true },
  { label: '小四（即將推出）', grade: 4, gradeLevel: '小四', available: false },
  { label: '小五（即將推出）', grade: 5, gradeLevel: '小五', available: false },
  { label: '小六（即將推出）', grade: 6, gradeLevel: '小六', available: false },
]

// ── Grade Selection ────────────────────────────────────────────────────────

function GradeSelect({ onStart }: { onStart: (opt: GradeOption) => void }) {
  const [selected, setSelected] = useState<GradeOption | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">學前數學評估</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            根據學生已學的單元，即時獲取個人化診斷報告。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">請選擇學生目前就讀年級</p>
          <div className="space-y-2">
            {GRADE_OPTIONS.map((opt) => (
              <button
                key={opt.grade}
                onClick={() => opt.available && setSelected(opt)}
                disabled={!opt.available}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selected?.grade === opt.grade
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : opt.available
                      ? 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => selected && onStart(selected)}
          disabled={!selected}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: selected ? '#1D9E75' : '#9CA3AF' }}
        >
          下一步
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          免費 · 無需登入 · 約 10 至 15 分鐘
        </p>
      </div>
    </div>
  )
}

// ── Unit (大單元) Selection ────────────────────────────────────────────────

function UnitSelect({
  units,
  initialSelected,
  onProceed,
  onDrillDown,
  onBack,
}: {
  units: CurriculumUnit[]
  initialSelected: Set<string>
  onProceed: (selectedUnitIds: string[]) => void
  onDrillDown: (selectedUnitIds: string[]) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Group units by semester for display
  const semA = units.filter((u) => u.semester === 'A')
  const semB = units.filter((u) => u.semester === 'B')
  const selectedCount = selected.size

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-5 pt-6 pb-4 shadow-sm">
        <button onClick={onBack} className="text-sm text-gray-400 mb-2">← 返回</button>
        <h2 className="text-lg font-bold text-gray-800">選擇學生已學單元</h2>
        <p className="text-xs text-gray-500 mt-1">可選多個單元。越多單元，題目覆蓋範圍越大。</p>
      </div>

      <div className="p-5 space-y-6">
        {semA.length > 0 && (
          <Section title="3A 上學期" units={semA} selected={selected} onToggle={toggle} />
        )}
        {semB.length > 0 && (
          <Section title="3B 下學期" units={semB} selected={selected} onToggle={toggle} />
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex flex-col gap-2 shadow-lg">
        <p className="text-center text-xs text-gray-500">
          已揀 <span className="font-semibold text-teal-600">{selectedCount}</span> 個大單元
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => selectedCount > 0 && onDrillDown(Array.from(selected))}
            disabled={selectedCount === 0}
            className="flex-1 py-3 rounded-xl border-2 border-teal-500 text-teal-600 text-sm font-medium disabled:opacity-40"
          >
            想再精準啲？揀小單元
          </button>
          <button
            onClick={() => selectedCount > 0 && onProceed(Array.from(selected))}
            disabled={selectedCount === 0}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: selectedCount > 0 ? '#1D9E75' : '#9CA3AF' }}
          >
            開始評估 →
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  units,
  selected,
  onToggle,
}: {
  title: string
  units: CurriculumUnit[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2 px-1">{title}</h3>
      <div className="space-y-2">
        {units.map((u) => (
          <button
            key={u.id}
            onClick={() => onToggle(u.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
              selected.has(u.id) ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                selected.has(u.id) ? 'border-teal-500 bg-teal-500' : 'border-gray-300 bg-white'
              }`}
            >
              {selected.has(u.id) && <span className="text-white text-xs">✓</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${selected.has(u.id) ? 'text-teal-700' : 'text-gray-700'}`}>
                {u.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {u.topics.length} 個小單元
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Topic (小單元) Selection ───────────────────────────────────────────────

function TopicSelect({
  units,
  selectedUnitIds,
  initialTopicIds,
  onProceed,
  onBack,
}: {
  units: CurriculumUnit[]
  selectedUnitIds: string[]
  initialTopicIds: Set<string>
  onProceed: (topicIds: string[]) => void
  onBack: () => void
}) {
  const visibleUnits = units.filter((u) => selectedUnitIds.includes(u.id))
  const allTopicIds = visibleUnits.flatMap((u) => u.topics.map((t) => t.id))

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (initialTopicIds.size > 0) return new Set(initialTopicIds)
    // Default: select all topics under the chosen units
    return new Set(allTopicIds)
  })

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAllInUnit = (unit: CurriculumUnit) => {
    const allChecked = unit.topics.every((t) => selected.has(t.id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const t of unit.topics) {
        if (allChecked) next.delete(t.id)
        else next.add(t.id)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-5 pt-6 pb-4 shadow-sm">
        <button onClick={onBack} className="text-sm text-gray-400 mb-2">← 返回大單元</button>
        <h2 className="text-lg font-bold text-gray-800">細揀學生已學嘅小單元</h2>
        <p className="text-xs text-gray-500 mt-1">每個小單元 = 一堂課嘅內容。</p>
      </div>

      <div className="p-5 space-y-5">
        {visibleUnits.map((unit) => (
          <div key={unit.id}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-semibold text-gray-700">{unit.name}</h3>
              <button
                onClick={() => toggleAllInUnit(unit)}
                className="text-xs text-teal-600 font-medium"
              >
                全選 / 全清
              </button>
            </div>
            <div className="space-y-2">
              {unit.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                    selected.has(t.id) ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selected.has(t.id) ? 'border-teal-500 bg-teal-500' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected.has(t.id) && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <p className={`text-sm ${selected.has(t.id) ? 'text-teal-700 font-medium' : 'text-gray-600'}`}>
                    第 {t.lesson_number} 堂 · {t.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex flex-col gap-2 shadow-lg">
        <p className="text-center text-xs text-gray-500">
          已揀 <span className="font-semibold text-teal-600">{selected.size}</span> 個小單元
        </p>
        <button
          onClick={() => selected.size > 0 && onProceed(Array.from(selected))}
          disabled={selected.size === 0}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: selected.size > 0 ? '#1D9E75' : '#9CA3AF' }}
        >
          開始評估 →
        </button>
      </div>
    </div>
  )
}

// ── Question Card ──────────────────────────────────────────────────────────

type FeedbackState = { correct: boolean; correctAnswer: string } | null

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  moduleName,
  onAnswer,
}: {
  question: AssessmentQuestion
  questionNumber: number
  totalQuestions: number
  moduleName: string
  onAnswer: (answer: string, isCorrect: boolean) => void
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [fillValue, setFillValue] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset typed value when question changes
  useEffect(() => {
    setFillValue('')
    setSelectedOption(null)
    setFeedback(null)
  }, [question.id])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const submitAnswer = (answer: string) => {
    const correct = isAnswerCorrect(answer, question.correct_answer)
    setFeedback({ correct, correctAnswer: question.correct_answer })
    timerRef.current = setTimeout(() => {
      onAnswer(answer, correct)
      setSelectedOption(null)
      setFillValue('')
      setFeedback(null)
    }, 600)
  }

  const progressPct = ((questionNumber - 1) / totalQuestions) * 100

  // Group sub-question label e.g. "(a)" / "(b)"
  const subLabel = question.group_id && (question.sub_order ?? 1) > 0
    ? ` (${String.fromCharCode(96 + (question.sub_order ?? 1))})`
    : ''

  // Tier badge
  const tierBadge = question.difficulty_tier === 'basic'
    ? { text: '基礎', cls: 'bg-teal-50 text-teal-600' }
    : question.difficulty_tier === 'enhancement'
      ? { text: '能力提升', cls: 'bg-amber-50 text-amber-600' }
      : question.difficulty_tier === 'advanced'
        ? { text: '拔尖', cls: 'bg-orange-100 text-orange-600' }
        : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress */}
      <div className="bg-white px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: '#1D9E75' }}
            />
          </div>
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
            {questionNumber}{subLabel}/{totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
            {moduleName}
          </span>
          {tierBadge && (
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${tierBadge.cls}`}>
              {tierBadge.text}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-base text-gray-800 leading-relaxed font-medium">
            <InlineMath text={question.question_text} />
          </p>
          {question.question_image_url && (
            <img
              src={question.question_image_url}
              alt={question.image_alt_text ?? '題目附圖'}
              className="mt-4 max-w-full rounded-lg border border-gray-100"
            />
          )}
        </div>

        {/* Multiple Choice */}
        {question.question_type === 'multiple_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((opt) => {
              let style = 'border-gray-200 bg-white text-gray-700'
              if (feedback) {
                const isThisCorrect = isAnswerCorrect(opt, question.correct_answer)
                if (isThisCorrect) {
                  style = 'border-teal-500 bg-teal-50 text-teal-700'
                } else if (opt === selectedOption && !feedback.correct) {
                  style = 'border-amber-400 bg-amber-50 text-amber-700'
                } else {
                  style = 'border-gray-200 bg-white text-gray-400'
                }
              } else if (opt === selectedOption) {
                style = 'border-teal-400 bg-teal-50 text-teal-700'
              }

              return (
                <button
                  key={opt}
                  disabled={!!feedback}
                  onClick={() => {
                    if (!feedback) {
                      setSelectedOption(opt)
                      submitAnswer(opt)
                    }
                  }}
                  className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all text-sm font-medium ${style}`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* Unified keyboard for all non-MC types (fill_in / fill_in_number / calculation) */}
        {question.question_type !== 'multiple_choice' && (
          <UnifiedKeyboard
            value={fillValue}
            onChange={setFillValue}
            onSubmit={() => fillValue.trim() && submitAnswer(fillValue.trim())}
            disabled={!!feedback}
          />
        )}
      </div>


    </div>
  )
}

// ── Contact Form ───────────────────────────────────────────────────────────

type ContactInfo = {
  student_name: string
  school_name: string
  grade_display: string
  parent_phone: string
  parent_email: string
}

function ContactForm({
  onSubmit,
  gradeLabel,
}: {
  onSubmit: (info: ContactInfo) => void
  gradeLabel: string
}) {
  const [form, setForm] = useState<ContactInfo>({
    student_name: '',
    school_name: '',
    grade_display: gradeLabel,
    parent_phone: '',
    parent_email: '',
  })

  const isValid = form.student_name.trim() && form.parent_phone.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">評估完成！</h2>
          <p className="text-gray-500 text-sm">請填寫資料以查看個人化診斷報告</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              學生姓名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.student_name}
              onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
              placeholder="請輸入學生姓名"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">就讀學校</label>
            <input
              type="text"
              value={form.school_name}
              onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))}
              placeholder="請輸入學校名稱"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">就讀年級</label>
            <input
              type="text"
              value={form.grade_display}
              onChange={(e) => setForm((f) => ({ ...f, grade_display: e.target.value }))}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              家長電話 <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.parent_phone}
              onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
              placeholder="請輸入聯絡電話"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">家長電郵</label>
            <input
              type="email"
              value={form.parent_email}
              onChange={(e) => setForm((f) => ({ ...f, parent_email: e.target.value }))}
              placeholder="請輸入電郵地址"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>

        <button
          onClick={() => isValid && onSubmit(form)}
          disabled={!isValid}
          className="w-full mt-5 py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: isValid ? '#1D9E75' : '#9CA3AF' }}
        >
          查看診斷報告
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          您的資料僅用於發送報告，不會外傳
        </p>
      </div>
    </div>
  )
}

// ── Generating Loader ──────────────────────────────────────────────────────

function GeneratingScreen() {
  const dots = ['·', '·', '·']
  const [count, setCount] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setCount((c) => (c % 3) + 1), 600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin mx-auto mb-6" />
        <h2 className="text-lg font-bold text-gray-800 mb-2">正在生成診斷報告</h2>
        <p className="text-gray-500 text-sm">請稍候{dots.slice(0, count).join('')}</p>
      </div>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔧</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">題庫準備中</h2>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border-2 border-teal-500 text-teal-600 font-medium text-sm"
        >
          返回重新揀
        </button>
      </div>
    </div>
  )
}

// ── Main Flow ──────────────────────────────────────────────────────────────

export default function AssessmentFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('grade_select')
  const [selectedGrade, setSelectedGrade] = useState<GradeOption | null>(null)
  const [units, setUnits] = useState<CurriculumUnit[]>([])
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [emptyMsg, setEmptyMsg] = useState('')

  const handleGradeStart = async (opt: GradeOption) => {
    setSelectedGrade(opt)
    setStep('loading_curriculum')
    try {
      const res = await fetch(`/api/assessment/curriculum?grade=${opt.grade}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '載入課程失敗')
      setUnits(data.units ?? [])
      setStep('unit_select')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '載入課程失敗')
      setStep('error')
    }
  }

  const loadQuestions = async (unitIds: string[], topicIds: string[]) => {
    setStep('loading_questions')
    setSelectedUnitIds(unitIds)
    setSelectedTopicIds(topicIds)
    try {
      const params = new URLSearchParams({ grade: String(selectedGrade!.grade) })
      if (topicIds.length > 0) params.set('topic_ids', topicIds.join(','))
      else params.set('unit_ids', unitIds.join(','))
      const res = await fetch(`/api/assessment/questions?${params}`)
      const data = await res.json()
      if (data.empty || !data.questions?.length) {
        setEmptyMsg(data.warnings?.[0] ?? '題庫尚未準備好')
        setStep('empty')
        return
      }
      setQuestions(data.questions)
      setCurrentIndex(0)
      setAnswers([])
      setStep('questions')
    } catch {
      setErrorMsg('載入題目失敗，請重試')
      setStep('error')
    }
  }

  const handleUnitsProceed = (unitIds: string[]) => loadQuestions(unitIds, [])
  const handleDrillDown = (unitIds: string[]) => {
    setSelectedUnitIds(unitIds)
    setStep('topic_select')
  }
  const handleTopicsProceed = (topicIds: string[]) => loadQuestions(selectedUnitIds, topicIds)

  const handleAnswer = (answer: string, isCorrect: boolean) => {
    const q = questions[currentIndex]
    const newAnswer: AssessmentAnswer = {
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.correct_answer,
      student_answer: answer,
      is_correct: isCorrect,
      category_id: q.category_id ?? '',
      category_code: q.category?.code ?? '',
      module_name: q.module_name,
      topic_id: q.topic_id ?? null,
      topic_name: q.topic_name ?? null,
      unit_id: q.unit_id ?? null,
      unit_name: q.unit_name ?? null,
      difficulty_tier: q.difficulty_tier ?? null,
      group_id: q.group_id ?? null,
      sub_order: q.sub_order ?? null,
    }
    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setStep('contact_form')
    }
  }

  const handleContactSubmit = async (info: ContactInfo) => {
    setStep('generating')
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade!.grade,
          grade_level: info.grade_display || selectedGrade!.gradeLevel,
          selected_unit_ids: selectedUnitIds,
          selected_topic_ids: selectedTopicIds,
          student_name: info.student_name,
          school_name: info.school_name,
          parent_phone: info.parent_phone,
          parent_email: info.parent_email,
          answers,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? '提交失敗')
      }

      const { session_id } = await res.json()
      router.push(`/assessment/report/${session_id}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '提交失敗，請重試')
      setStep('error')
    }
  }

  if (step === 'grade_select') {
    return <GradeSelect onStart={handleGradeStart} />
  }

  if (step === 'loading_curriculum' || step === 'loading_questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">{step === 'loading_curriculum' ? '正在載入課程⋯' : '正在抽題⋯'}</p>
        </div>
      </div>
    )
  }

  if (step === 'unit_select') {
    return (
      <UnitSelect
        units={units}
        initialSelected={new Set(selectedUnitIds)}
        onProceed={handleUnitsProceed}
        onDrillDown={handleDrillDown}
        onBack={() => setStep('grade_select')}
      />
    )
  }

  if (step === 'topic_select') {
    return (
      <TopicSelect
        units={units}
        selectedUnitIds={selectedUnitIds}
        initialTopicIds={new Set(selectedTopicIds)}
        onProceed={handleTopicsProceed}
        onBack={() => setStep('unit_select')}
      />
    )
  }

  if (step === 'empty') {
    return (
      <EmptyState
        message={emptyMsg}
        onBack={() => setStep('unit_select')}
      />
    )
  }

  if (step === 'questions') {
    const q = questions[currentIndex]
    return (
      <QuestionCard
        key={q.id}
        question={q}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        moduleName={q.unit_name ?? q.topic_name ?? q.module_name}
        onAnswer={handleAnswer}
      />
    )
  }

  if (step === 'contact_form') {
    return (
      <ContactForm
        gradeLabel={selectedGrade?.gradeLevel ?? ''}
        onSubmit={handleContactSubmit}
      />
    )
  }

  if (step === 'generating') {
    return <GeneratingScreen />
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">出現問題</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => setStep('grade_select')}
            className="px-6 py-3 rounded-xl text-white font-medium text-sm"
            style={{ backgroundColor: '#1D9E75' }}
          >
            重新開始
          </button>
        </div>
      </div>
    )
  }

  return null
}
