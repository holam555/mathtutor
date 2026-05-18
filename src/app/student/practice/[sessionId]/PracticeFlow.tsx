'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types/database'
import { QuestionContent } from '@/components/FractionDisplay'
import UnifiedKeyboard from '@/components/UnifiedKeyboard'

type FeedbackState = 'idle' | 'correct' | 'wrong'

// Server-augmented question: numeric_answer flag tells us whether the
// fill_in question expects a number/fraction (custom keyboard) without
// leaking the answer itself.
type SessionQuestion = Question & { numeric_answer?: boolean }

export default function PracticeFlow({
  sessionId,
  questions,
}: {
  sessionId: string
  questions: SessionQuestion[]
}) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [fillInput, setFillInput] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [revealedAnswer, setRevealedAnswer] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef(Date.now())

  const currentQuestion = questions[currentIndex]
  const qType = currentQuestion.question_type
  const progress = ((currentIndex + (feedback !== 'idle' ? 1 : 0)) / questions.length) * 100

  // Show the custom fraction keyboard for fill_in_number, calculation, OR fill_in
  // questions whose correct answer is a number/fraction. The numeric_answer flag
  // is set server-side from the actual answer so the client doesn't need it.
  const useCustomKeyboard =
    qType === 'fill_in_number' ||
    qType === 'calculation' ||
    (qType === 'fill_in' && !!currentQuestion.numeric_answer)

  const advanceOrFinish = useCallback(
    async () => {
      if (currentIndex + 1 >= questions.length) {
        // Server recomputes correct_count from answer_records — no need to send it.
        await fetch('/api/practice/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        router.push(`/student/results/${sessionId}`)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelectedOption(null)
        setFillInput('')
        setFeedback('idle')
        setRevealedAnswer('')
        startTimeRef.current = Date.now()
      }
    },
    [currentIndex, questions.length, sessionId, router]
  )

  // Auto-advance after 1.5s feedback
  useEffect(() => {
    if (feedback === 'idle') return
    const timer = setTimeout(() => advanceOrFinish(), 1500)
    return () => clearTimeout(timer)
  }, [feedback, advanceOrFinish])

  // Focus text input when using system keyboard
  useEffect(() => {
    if (!useCustomKeyboard && qType !== 'multiple_choice' && feedback === 'idle') {
      setTimeout(() => textInputRef.current?.focus(), 100)
    }
  }, [currentIndex, qType, feedback, useCustomKeyboard])

  async function submitAnswer(answer: string) {
    if (feedback !== 'idle' || isSubmitting || !answer.trim()) return
    setIsSubmitting(true)

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)

    // Server grades and returns {correct, correct_answer}. We wait for the
    // response before showing feedback so the banner can reveal the right
    // answer on a wrong tap.
    try {
      const res = await fetch('/api/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.id,
          student_answer: answer,
          category_id: currentQuestion.category_id,
          time_spent_seconds: timeSpent,
        }),
      })
      const data: { correct?: boolean; correct_answer?: string } = await res.json().catch(() => ({}))
      const correct = !!data.correct
      setRevealedAnswer(data.correct_answer ?? '')
      setFeedback(correct ? 'correct' : 'wrong')
    } catch {
      // Network failure: fall back to a neutral "wrong" feedback so the
      // student can still progress; nothing is recorded if the request died.
      setRevealedAnswer('')
      setFeedback('wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOptionSelect(option: string) {
    if (feedback !== 'idle') return
    setSelectedOption(option)
    submitAnswer(option)
  }

  function getOptionStyle(option: string) {
    const base =
      'w-full h-14 rounded-xl text-left px-4 text-base font-medium transition-all active:scale-[0.98] border-2'
    if (feedback === 'idle') {
      return `${base} bg-white border-[#1D9E75] text-gray-800 hover:bg-[#1D9E75]/5`
    }
    // Use the server-revealed correct answer (post-submit) — the question
    // payload itself never carries it.
    if (revealedAnswer && option === revealedAnswer) {
      return `${base} bg-[#1D9E75] border-[#1D9E75] text-white`
    }
    if (option === selectedOption && feedback === 'wrong') {
      return `${base} bg-[#EF9F27] border-[#EF9F27] text-white`
    }
    return `${base} bg-white border-gray-200 text-gray-400`
  }

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
        <div className="bg-white rounded-2xl p-5 shadow-sm min-h-[140px] flex flex-col items-start gap-4">
          <div className="text-[18px] text-gray-800" style={{ lineHeight: '1.6' }}>
            <QuestionContent text={currentQuestion.question_text} />
          </div>
          {currentQuestion.question_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentQuestion.question_image_url}
              alt={currentQuestion.image_alt_text ?? ''}
              className="self-center max-w-full h-auto rounded-lg"
            />
          )}
        </div>

        {/* System text keyboard input (text answers: units, names, expressions, ordering) */}
        {!useCustomKeyboard && qType !== 'multiple_choice' && (
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

        {/* System keyboard — confirm button */}
        {!useCustomKeyboard && qType !== 'multiple_choice' && (
          <button
            onClick={() => submitAnswer(fillInput)}
            disabled={feedback !== 'idle' || !fillInput.trim()}
            className="w-full h-14 rounded-xl bg-[#1D9E75] text-white text-base font-semibold disabled:opacity-40 active:scale-[0.98] transition"
          >
            確認
          </button>
        )}

        {/* Unified keyboard (numbers, fractions, mixed numbers) */}
        {useCustomKeyboard && (
          <UnifiedKeyboard
            value={fillInput}
            onChange={(v) => { if (feedback === 'idle') setFillInput(v) }}
            onSubmit={() => submitAnswer(fillInput)}
            disabled={feedback !== 'idle'}
          />
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
            <div className="mt-1">
              {revealedAnswer && (
                <p className="text-sm font-semibold text-white flex items-center gap-1 flex-wrap">
                  正確答案：<FractionDisplay value={revealedAnswer} />
                </p>
              )}
              <p className="text-xs text-white/70 mt-0.5">已加入挑戰題，下次再戰！</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
