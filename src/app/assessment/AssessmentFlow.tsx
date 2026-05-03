'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAnswerCorrect } from '@/lib/answerUtils'
import FractionDisplay, { InlineMath } from '@/components/FractionDisplay'
import type { AssessmentQuestion, AssessmentAnswer } from '@/types/assessment'

// ── Types ──────────────────────────────────────────────────────────────────

type Step = 'grade_select' | 'loading_questions' | 'empty' | 'questions' | 'review' | 'contact_form' | 'generating' | 'error'

type GradeOption = { label: string; grade: number; month: number; gradeLevel: string }

const GRADE_OPTIONS: GradeOption[] = [
  { label: '小五（9月入學）', grade: 5, month: 9, gradeLevel: '小五（9月入學）' },
  { label: '小五（11月入學）', grade: 5, month: 11, gradeLevel: '小五（11月入學）' },
  { label: '小五（1月入學）', grade: 5, month: 1, gradeLevel: '小五（1月入學）' },
  { label: '小五（3月入學）', grade: 5, month: 3, gradeLevel: '小五（3月入學）' },
  { label: '小五（5月入學）', grade: 5, month: 5, gradeLevel: '小五（5月入學）' },
  { label: '小六（9月入學）', grade: 6, month: 9, gradeLevel: '小六（9月入學）' },
  { label: '小六（11月入學）', grade: 6, month: 11, gradeLevel: '小六（11月入學）' },
  { label: '小六（1月入學）', grade: 6, month: 1, gradeLevel: '小六（1月入學）' },
  { label: '小六（3月入學）', grade: 6, month: 3, gradeLevel: '小六（3月入學）' },
  { label: '小六（5月入學）', grade: 6, month: 5, gradeLevel: '小六（5月入學）' },
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
            完成約15至20條題目，即時獲取個人化診斷報告，了解孩子的數學強弱項。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">請選擇學生目前就讀年級</p>
          <div className="space-y-2">
            {GRADE_OPTIONS.map((opt) => (
              <button
                key={opt.gradeLevel}
                onClick={() => setSelected(opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selected?.gradeLevel === opt.gradeLevel
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
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
          開始評估
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          免費 · 無需登入 · 約10至15分鐘
        </p>
      </div>
    </div>
  )
}

// ── Question Card ──────────────────────────────────────────────────────────

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

  const submitAnswer = (answer: string) => {
    const correct = isAnswerCorrect(answer, question.correct_answer)
    onAnswer(answer, correct)
    setSelectedOption(null)
    setFillValue('')
  }

  const progressPct = ((questionNumber - 1) / totalQuestions) * 100

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
            {questionNumber}/{totalQuestions}
          </span>
        </div>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
          {moduleName}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 p-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-base text-gray-800 leading-relaxed font-medium">
            <InlineMath text={question.question_text} />
          </p>
        </div>

        {/* Multiple Choice */}
        {question.question_type === 'multiple_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((opt) => {
              const style = opt === selectedOption
                ? 'border-teal-400 bg-teal-50 text-teal-700'
                : 'border-gray-200 bg-white text-gray-700'

              return (
                <button
                  key={opt}
                  onClick={() => {
                    setSelectedOption(opt)
                    submitAnswer(opt)
                  }}
                  className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all text-sm font-medium ${style}`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* Fill In */}
        {(question.question_type === 'fill_in' || question.question_type === 'fill_in_number') && (
          <div className="space-y-3">
            <input
              type="text"
              inputMode="text"
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && fillValue.trim()) {
                  submitAnswer(fillValue.trim())
                }
              }}
              placeholder="輸入答案"
              className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-base text-gray-800 focus:outline-none focus:border-teal-400 bg-white"
            />
            <button
              onClick={() => fillValue.trim() && submitAnswer(fillValue.trim())}
              disabled={!fillValue.trim()}
              className="w-full py-4 rounded-xl text-white font-semibold text-base disabled:opacity-40 transition-all"
              style={{ backgroundColor: '#1D9E75' }}
            >
              確認
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Review Answers ─────────────────────────────────────────────────────────

function ReviewAnswers({
  answers,
  onContinue,
}: {
  answers: AssessmentAnswer[]
  onContinue: () => void
}) {
  const correctCount = answers.filter((a) => a.is_correct).length
  const totalCount = answers.length

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">作答總結</h2>
          <p className="text-gray-500 text-sm">
            共 {totalCount} 題，答對 <span className="font-semibold text-teal-600">{correctCount}</span> 題
          </p>
        </div>

        {/* Answer list */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mb-6">
          {answers.map((a, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  a.is_correct ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {a.is_correct ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-medium">第 {i + 1} 題</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {a.module_name}
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-snug mb-1">
                  <InlineMath text={a.question_text} />
                </p>
                <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                  你的答案：
                  <span className={a.is_correct ? 'text-teal-600 font-medium' : 'text-amber-600 font-medium'}>
                    <FractionDisplay value={a.student_answer} />
                  </span>
                  {!a.is_correct && (
                    <>
                      <span className="text-gray-300 mx-1">·</span>
                      正確答案：
                      <span className="text-gray-700 font-medium">
                        <FractionDisplay value={a.correct_answer} />
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base"
          style={{ backgroundColor: '#1D9E75' }}
        >
          繼續查看診斷報告
        </button>
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
        <p className="text-gray-500 text-sm">
          AI 老師正在分析您的答題情況{dots.slice(0, count).join('')}
        </p>
        <p className="text-gray-400 text-xs mt-2">約需 5 至 10 秒，請稍候</p>
      </div>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ gradeLabel, onBack }: { gradeLabel: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔧</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">題庫準備中</h2>
        <p className="text-gray-500 text-sm mb-6">
          {gradeLabel}的評估題庫正在整理，敬請期待！歡迎聯絡我們預約試堂。
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border-2 border-teal-500 text-teal-600 font-medium text-sm"
        >
          返回選擇年級
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
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleGradeStart = async (opt: GradeOption) => {
    setSelectedGrade(opt)
    setStep('loading_questions')

    try {
      const res = await fetch(`/api/assessment/questions?grade=${opt.grade}&month=${opt.month}`)
      const data = await res.json()

      if (data.empty || !data.questions?.length) {
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
    }
    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setStep('review')
    }
  }

  const handleContactSubmit = async (info: {
    student_name: string
    school_name: string
    grade_display: string
    parent_phone: string
    parent_email: string
  }) => {
    setStep('generating')

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade!.grade,
          month: selectedGrade!.month,
          grade_level: info.grade_display || selectedGrade!.gradeLevel,
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

  if (step === 'loading_questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">正在載入題目⋯</p>
        </div>
      </div>
    )
  }

  if (step === 'empty') {
    return (
      <EmptyState
        gradeLabel={selectedGrade?.gradeLevel ?? ''}
        onBack={() => setStep('grade_select')}
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
        moduleName={q.module_name}
        onAnswer={handleAnswer}
      />
    )
  }

  if (step === 'review') {
    return (
      <ReviewAnswers
        answers={answers}
        onContinue={() => setStep('contact_form')}
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
