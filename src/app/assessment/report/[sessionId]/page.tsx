import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { RATING_LABELS, RATING_COLORS } from '@/lib/assessmentUtils'
import type { ReportData, Rating, AssessmentAnswer } from '@/types/assessment'

type AssessmentSession = {
  id: string
  student_name: string
  school_name: string | null
  grade_level: string
  created_at: string
  report_data: ReportData | null
  answers: AssessmentAnswer[] | null
}

export default async function AssessmentReportPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createServiceClient()

  const { data: session, error } = await supabase
    .from('assessment_sessions')
    .select('id, student_name, school_name, grade_level, created_at, report_data, answers')
    .eq('id', params.sessionId)
    .single()

  if (error || !session) {
    notFound()
  }

  const s = session as AssessmentSession
  const report = s.report_data

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500">報告正在生成中，請稍後重新載入頁面。</p>
        </div>
      </div>
    )
  }

  const dateStr = new Date(s.created_at).toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const overallPct =
    report.totalQuestions > 0
      ? Math.round((report.totalCorrect / report.totalQuestions) * 100)
      : 0

  // Group wrong answers by module for the detail section
  const wrongAnswers = (s.answers ?? []).filter((a) => !a.is_correct)
  const wrongByModule = new Map<string, AssessmentAnswer[]>()
  for (const a of wrongAnswers) {
    if (!wrongByModule.has(a.module_name)) wrongByModule.set(a.module_name, [])
    wrongByModule.get(a.module_name)!.push(a)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Cover Card ── */}
        <div
          className="rounded-2xl overflow-hidden shadow-md"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0E7CBF 100%)' }}
        >
          <div className="px-6 py-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">
                  數學練習
                </p>
                <h1 className="text-3xl font-bold">診斷報告</h1>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{overallPct}%</div>
                <div className="text-white/70 text-xs mt-1">整體正確率</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60 text-xs mb-0.5">姓名</p>
                <p className="font-semibold">{s.student_name}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">學校</p>
                <p className="font-semibold">{s.school_name || '—'}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">年級</p>
                <p className="font-semibold">{s.grade_level}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">評估日期</p>
                <p className="font-semibold">{dateStr}</p>
              </div>
            </div>
          </div>
          {/* Accuracy bar */}
          <div className="bg-white/10 px-6 py-3 flex items-center gap-3">
            <span className="text-white/80 text-xs whitespace-nowrap">
              {report.totalCorrect}/{report.totalQuestions} 題
            </span>
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Module Breakdown ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-base">知識點掌握情況</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {report.modules.map((mod) => {
              const rating = mod.rating as Rating
              const colors = RATING_COLORS[rating]
              const pct = mod.total > 0 ? Math.round((mod.correct / mod.total) * 100) : 0

              return (
                <div key={mod.name} className="px-5 py-5">
                  {/* Module header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{mod.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {rating}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {mod.correct}/{mod.total} 題（{pct}%）
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          rating === 'S' || rating === 'A' ? '#1D9E75' : rating === 'B' ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>

                  {/* Diagnostic comment */}
                  {mod.comment && (
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {mod.comment}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Wrong Answer Details ── */}
        {wrongAnswers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-base">答錯題目詳情</h2>
              <p className="text-xs text-gray-400 mt-0.5">共答錯 {wrongAnswers.length} 題</p>
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from(wrongByModule.entries()).map(([moduleName, qs]) => (
                <div key={moduleName} className="px-5 py-4">
                  <p className="text-xs font-semibold text-teal-600 mb-3">{moduleName}</p>
                  <div className="space-y-3">
                    {qs.map((a, i) => (
                      <div key={i} className="rounded-xl bg-gray-50 px-3 py-2.5">
                        <p className="text-xs text-gray-700 leading-relaxed mb-2">
                          {a.question_text}
                        </p>
                        <div className="flex items-center gap-4 text-xs flex-wrap">
                          <span className="flex items-center gap-1 text-amber-600">
                            <span className="font-medium">答：</span>
                            <span className="line-through opacity-80">{a.student_answer}</span>
                          </span>
                          <span className="flex items-center gap-1 text-teal-600">
                            <span className="font-medium">正確：</span>
                            <span className="font-semibold">{a.correct_answer}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rating Legend ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-3">評級說明</p>
          <div className="grid grid-cols-4 gap-2">
            {(['S', 'A', 'B', 'C'] as Rating[]).map((r) => {
              const c = RATING_COLORS[r]
              return (
                <div
                  key={r}
                  className={`text-center py-2 rounded-lg border ${c.bg} ${c.border}`}
                >
                  <div className={`text-lg font-bold ${c.text}`}>{r}</div>
                  <div className={`text-xs ${c.text} opacity-80`}>{RATING_LABELS[r]}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <p className="text-xs text-gray-400">≥90%</p>
            <p className="text-xs text-gray-400">75–89%</p>
            <p className="text-xs text-gray-400">50–74%</p>
            <p className="text-xs text-gray-400">&lt;50%</p>
          </div>
        </div>

        {/* ── Overall Summary ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <h2 className="font-bold text-gray-800 text-base mb-3">整體評語及建議</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{report.overallSummary}</p>
        </div>

        {/* ── Next Steps ── */}
        {report.nextSteps?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <h2 className="font-bold text-gray-800 text-base mb-4">下一階段目標</h2>
            <div className="space-y-3">
              {(['學習習慣', '專注力', '主動性', '基礎功底'] as const).map((label, i) => (
                <div key={label} className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#1D9E75' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">{label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {report.nextSteps[i] ?? ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="rounded-2xl p-6 text-center text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0E7CBF 100%)' }}
        >
          <p className="font-bold text-lg mb-1">立即預約免費試堂</p>
          <p className="text-white/80 text-sm mb-5">
            讓我們的老師為孩子制定個人化學習計劃
          </p>
          <a
            href="tel:+85200000000"
            className="inline-block px-8 py-3 bg-white rounded-xl font-semibold text-sm"
            style={{ color: '#1D9E75' }}
          >
            立即致電查詢
          </a>
          <p className="text-white/60 text-xs mt-3">
            我們將在一個工作日內與您聯絡
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pb-6">
          <a href="/assessment" className="text-xs text-teal-600 underline">
            讓其他孩子也做評估
          </a>
        </div>

      </div>
    </div>
  )
}
