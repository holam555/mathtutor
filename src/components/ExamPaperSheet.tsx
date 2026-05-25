import PrintButton from '@/components/PrintButton'
import type { ExamPaperData } from '@/lib/examPaper'
import { MARKS, formatMarks, marksForQuestionType } from '@/lib/mockExamMarks'

const TIER_LABEL: Record<string, string> = {
  basic: '易',
  enhancement: '中',
  advanced: '難',
}

export default function ExamPaperSheet({
  studentName,
  paper,
}: {
  studentName?: string
  paper: ExamPaperData
}) {
  const mcqs = paper.questions.filter((q) => q.question_type === 'multiple_choice')
  const fills = paper.questions.filter((q) => q.question_type !== 'multiple_choice')
  const mcqStart = 1
  const fillStart = mcqs.length + 1
  const totalQ = paper.questions.length
  // Sum per-question marks against the canonical schedule (MC=1.5, SQ=2)
  // instead of the legacy `totalQ * 2` which double-counted MC questions.
  const totalMarks = paper.questions.reduce(
    (sum, q) => sum + marksForQuestionType(q.question_type),
    0
  )
  const mcqMarks = mcqs.length * MARKS.mc
  const fillMarks = fills.length * MARKS.sq

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {paper.examName ?? '考試衝刺練習卷'}
          </p>
          <p className="text-xs text-gray-400">共 {totalQ} 題 · 列印後可自行填寫答案</p>
        </div>
        <PrintButton />
      </div>

      {/* Exam paper body — A4 width on screen, full-width in print */}
      <div
        className="max-w-[794px] mx-auto px-10 py-10 print:px-[1.5cm] print:py-[1.5cm] print:max-w-none"
        style={{ fontFamily: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif' }}
      >
        {/* ── Header ── */}
        <div className="text-center mb-6 print:mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="霖楓學苑"
            className="mx-auto mb-3 h-14 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-wide">
            數學練習卷
          </h1>
          {paper.examName && (
            <p className="text-base text-gray-600 mt-1">{paper.examName}</p>
          )}
          {paper.examDate && (
            <p className="text-sm text-gray-400 mt-0.5">考試日期：{paper.examDate}</p>
          )}
        </div>

        {/* Name / class / date row */}
        <div className="flex gap-8 mb-8 text-sm border-b border-gray-300 pb-4">
          <span>姓名：{studentName ? <span className="font-semibold">{studentName}</span> : <span className="inline-block w-28 border-b border-gray-500">&nbsp;</span>}</span>
          <span>班別：<span className="inline-block w-20 border-b border-gray-500">&nbsp;</span></span>
          <span>日期：<span className="inline-block w-24 border-b border-gray-500">&nbsp;</span></span>
          <span className="ml-auto">滿分：{formatMarks(totalMarks)} 分</span>
        </div>

        {/* ── Section A: Multiple Choice ── */}
        {mcqs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold mb-4 border-l-4 border-gray-800 pl-3">
              甲部　選擇題（每題 {formatMarks(MARKS.mc)} 分，共 {formatMarks(mcqMarks)} 分）
            </h2>
            <p className="text-xs text-gray-500 mb-4 italic">在每題右邊的方格內填入正確答案的英文字母。</p>
            <div className="space-y-5">
              {mcqs.map((q, idx) => (
                <div key={q.id} className="flex gap-3">
                  <span className="text-sm font-semibold shrink-0 w-7 pt-0.5">
                    {mcqStart + idx}.
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-relaxed flex-1">{q.question_text}</p>
                      {/* Answer box */}
                      <div className="shrink-0 w-10 h-10 border-2 border-gray-400 rounded print:rounded-none" />
                    </div>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 ml-1">
                        {q.options.map((opt) => (
                          <span key={opt} className="text-sm">{opt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Section B: Fill-in ── */}
        {fills.length > 0 && (
          <section className="mb-8" style={{ breakBefore: mcqs.length > 8 ? 'page' : 'auto' }}>
            <h2 className="text-base font-bold mb-4 border-l-4 border-gray-800 pl-3">
              乙部　填充題（每題 {formatMarks(MARKS.sq)} 分，共 {formatMarks(fillMarks)} 分）
            </h2>
            <div className="space-y-5">
              {fills.map((q, idx) => (
                <div key={q.id} className="flex gap-3 items-start">
                  <span className="text-sm font-semibold shrink-0 w-7 pt-0.5">
                    {fillStart + idx}.
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-end gap-3">
                      <p className="text-sm leading-relaxed">{q.question_text}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-gray-500">答：</span>
                        <div className="w-28 border-b-2 border-gray-500 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Answer Key (always starts on new page) ── */}
        <div style={{ breakBefore: 'page' }} className="pt-2">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold tracking-wide">答案卷　ANSWER KEY</h2>
            {paper.examName && <p className="text-sm text-gray-500 mt-1">{paper.examName}</p>}
          </div>

          {mcqs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">甲部　選擇題</h3>
              <div className="grid grid-cols-5 gap-3">
                {mcqs.map((q, idx) => (
                  <div key={q.id} className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-500 w-6">{mcqStart + idx}.</span>
                    <span className="text-sm font-bold">
                      {q.correct_answer.match(/^([A-D])/)?.[1] ?? q.correct_answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">乙部　填充題</h3>
              <div className="space-y-1.5">
                {fills.map((q, idx) => (
                  <div key={q.id} className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-500 w-6 shrink-0">{fillStart + idx}.</span>
                    <span className="text-sm font-bold">{q.correct_answer}</span>
                    <span className="text-xs text-gray-400">
                      （{TIER_LABEL[q.difficulty_tier] ?? q.difficulty_tier}）
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-8 text-center print:mt-12">
            — 本練習卷由霖楓學苑數學練習系統生成 —
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  )
}
