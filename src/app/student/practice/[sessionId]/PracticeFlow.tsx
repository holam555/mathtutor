'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types/database'
import { isAnswerCorrect } from '@/lib/answerUtils'

type FeedbackState = 'idle' | 'correct' | 'wrong'

// 4-column numeric keyboard rows: [label, value] pairs
// value === 'backspace' | 'confirm' are special actions
const NUMBER_KEYBOARD: [string, string][][] = [
  [['7', '7'], ['8', '8'], ['9', '9'], ['⌫', 'backspace']],
  [['4', '4'], ['5', '5'], ['6', '6'], ['又', '又']],
  [['1', '1'], ['2', '2'], ['3', '3'], ['/', '/']],
  [['0', '0'], ['.', '.'], ['、', '、'], ['確認', 'confirm']],
]

export default function PracticeFlow({
  sessionId,
  questions,
}: {
  sessionId: string
  questions: Question[]
}) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [fillInput, setFillInput] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef(Date.now())

  const currentQuestion = questions[currentIndex]
  const qType = currentQuestion.question_type
  const progress = ((currentIndex + (feedback !== 'idle' ? 1 : 0)) / questions.length) * 100

  const advanceOrFinish = useCallback(
    async (finalCorrectCount: number) => {
      if (currentIndex + 1 >= questions.length) {
        await fetch('/api/practice/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, correct_count: finalCorrectCount }),
        })
        router.push(`/student/results/${sessionId}`)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelectedOption(null)
        setFillInput('')
        setFeedback('idle')
        startTimeRef.current = Date.now()
      }
    },
    [currentIndex, questions.length, sessionId, router]
  )

  // Auto-advance after 1.5s feedback
  useEffect(() => {
    if (feedback === 'idle') return
    const timer = setTimeout(() => advanceOrFinish(correctCount), 1500)
    return () => clearTimeout(timer)
  }, [feedback, correctCount, advanceOrFinish])

  // Focus text input when switching to fill_in question
  useEffect(() => {
    if (qType === 'fill_in' && feedback === 'idle') {
      setTimeout(() => textInputRef.current?.focus(), 100)
    }
  }, [currentIndex, qType, feedback])

  async function submitAnswer(answer: string) {
    if (feedback !== 'idle' || isSubmitting || !answer.trim()) return
    setIsSubmitting(true)

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correct = isAnswerCorrect(answer, currentQuestion.correct_answer)
    const newCorrectCount = correct ? correctCount + 1 : correctCount

    setFeedback(correct ? 'correct' : 'wrong')
    setCorrectCount(newCorrectCount)

    fetch('/api/practice/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: currentQuestion.id,
        student_answer: answer,
        correct_answer: currentQuestion.correct_answer,
        category_id: currentQuestion.category_id,
        time_spent_seconds: timeSpent,
      }),
    }).finally(() => setIsSubmitting(false))
  }

  function handleOptionSelect(option: string) {
    if (feedback !== 'idle') return
    setSelectedOption(option)
    submitAnswer(option)
  }

  function handleNumKey(value: string) {
    if (feedback !== 'idle') return
    if (value === 'backspace') {
      setFillInput((prev) => prev.slice(0, -1))
    } else if (value === 'confirm') {
      submitAnswer(fillInput)
    } else {
      setFillInput((prev) => prev + value)
    }
  }

  function getOptionStyle(option: string) {
    const base =
      'w-full h-14 rounded-xl text-left px-4 text-base font-medium transition-all active:scale-[0.98] border-2'
    if (feedback === 'idle') {
      return `${base} bg-white border-[#1D9E75] text-gray-800 hover:bg-[#1D9E75]/5`
    }
    if (option === currentQuestion.correct_answer) {
      return `${base} bg-[#1D9E75] border-[#1D9E75] text-white`
    }
    if (option === selectedOption && feedback === 'wrong') {
      return `${base} bg-[#EF9F27] border-[#EF9F27] text-white`
    }
    return `${base} bg-white border-gray-200 text-gray-400`
  }

  const fillDisplayClass = `mt-4 h-14 rounded-xl flex items-center justify-center text-2xl font-semibold border-2 transition-colors ${
    feedback === 'correct'
      ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
      : feedback === 'wrong'
        ? 'bg-[#EF9F27] border-[#EF9F27] text-white'
        : 'bg-white border-[#1D9E75] text-gray-800'
  }`

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      {/* Top bar */}
      <div className="px-5 pt-6 pb-2 flex items-center gap-4">
        <button
          onClick={() => router.push('/student')}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="退出練習"
        >
          ✕
        </button>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 shrink-0">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 px-5 pt-6 pb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm min-h-[140px] flex items-start">
          <p className="text-[18px] leading-relaxed text-gray-800" style={{ lineHeight: '1.6' }}>
            {currentQuestion.question_text}
          </p>
        </div>

        {/* Answer display for fill_in (text input) */}
        {qType === 'fill_in' && (
          <input
            ref={textInputRef}
            type="text"
            value={fillInput}
            onChange={(e) => feedback === 'idle' && setFillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAnswer(fillInput)}
            placeholder="輸入答案"
            disabled={feedback !== 'idle'}
            className={`mt-4 w-full h-14 rounded-xl text-center text-xl font-semibold border-2 outline-none transition-colors ${
              feedback === 'correct'
                ? 'bg-[#1D9E75] border-[#1D9E75] text-white placeholder:text-white/60'
                : feedback === 'wrong'
                  ? 'bg-[#EF9F27] border-[#EF9F27] text-white placeholder:text-white/60'
                  : 'bg-white border-[#1D9E75] text-gray-800 placeholder:text-gray-300'
            }`}
          />
        )}

        {/* Answer display box for fill_in_number / calculation */}
        {(qType === 'fill_in_number' || qType === 'calculation') && (
          <div className={fillDisplayClass}>
            {fillInput || <span className="text-gray-300 text-base">輸入答案</span>}
          </div>
        )}

        {/* Hint for calculation */}
        {qType === 'calculation' && (
          <p className="mt-2 text-xs text-gray-400 text-center">
            請先在草稿紙上列式計算，然後輸入最終答案
          </p>
        )}
      </div>

      {/* Answer area */}
      <div className="px-5 pb-6">
        {/* Multiple choice */}
        {qType === 'multiple_choice' && (
          <div className="space-y-3">
            {(currentQuestion.options ?? []).map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                disabled={feedback !== 'idle'}
                className={getOptionStyle(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* fill_in — system keyboard, submit button */}
        {qType === 'fill_in' && (
          <button
            onClick={() => submitAnswer(fillInput)}
            disabled={feedback !== 'idle' || !fillInput.trim()}
            className="w-full h-14 rounded-xl bg-[#1D9E75] text-white text-base font-semibold disabled:opacity-40 active:scale-[0.98] transition"
          >
            確認
          </button>
        )}

        {/* fill_in_number and calculation — custom number keyboard */}
        {(qType === 'fill_in_number' || qType === 'calculation') && (
          <div className="grid grid-cols-4 gap-2">
            {NUMBER_KEYBOARD.flat().map(([label, value]) => {
              const isConfirm = value === 'confirm'
              const isBackspace = value === 'backspace'
              return (
                <button
                  key={value}
                  onClick={() => handleNumKey(value)}
                  disabled={
                    feedback !== 'idle' ||
                    (isConfirm && !fillInput.trim())
                  }
                  className={`h-14 rounded-lg text-lg font-medium transition active:scale-[0.95] disabled:opacity-40 ${
                    isConfirm
                      ? 'bg-[#1D9E75] text-white text-base font-semibold'
                      : isBackspace
                        ? 'bg-[#F1EFE8] text-gray-500'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Feedback bar */}
      {feedback !== 'idle' && (
        <div
          className={`fixed bottom-0 left-0 right-0 px-6 py-4 text-white ${
            feedback === 'correct' ? 'bg-[#1D9E75]' : 'bg-[#EF9F27]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">
              {feedback === 'correct' ? '答對了！+1 ⭐' : '再試一次！💪'}
            </span>
            <span className="text-2xl">{feedback === 'correct' ? '🎉' : '✨'}</span>
          </div>
          {feedback === 'wrong' && (
            <p className="text-xs text-white/80 mt-1">已加入挑戰題，下次再戰！</p>
          )}
        </div>
      )}
    </div>
  )
}
