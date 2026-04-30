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

const PRIORITY_COLORS = {
  '最高優先': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  '高優先':   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  '中優先':   { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
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

  const score = report.score ?? (
    report.totalQuestions > 0
      ? Math.round((report.totalCorrect / report.totalQuestions) * 100)
      : 0
  )

  const band = report.band ?? (score >= 85 ? 'Band 1' : score >= 65 ? 'Band 2' : 'Band 3')
  const bandDescription = report.bandDescription ?? ''
  const strongAreas = report.strongAreas ?? []
  const weakAreas = report.weakAreas ?? []
  const learningPlan = report.learningPlan ?? []

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
            <div className="mb-5">
              <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">
                升分秘笈 數學學習評估報告
              </p>
              <h1 className="text-2xl font-bold">{s.student_name} 的診斷報告</h1>
            </div>

            {/* 3-column stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/15 rounded-xl px-3 py-3 text-center">
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-white/70 text-xs mt-0.5">整體分數</div>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-3 text-center">
                <div className="text-xl font-bold leading-tight mt-1">{band}</div>
                <div className="text-white/70 text-xs mt-0.5">預估程度</div>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-3 text-center">
                <div className="text-3xl font-bold">{strongAreas.length}</div>
                <div className="text-white/70 text-xs mt-0.5">個強項範疇</div>
              </div>
            </div>

            {/* Student info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-white/60 text-xs mb-0.5">學校</p>
                <p className="font-medium">{s.school_name || '—'}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">年級</p>
                <p className="font-medium">{s.grade_level}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">評估日期</p>
                <p className="font-medium">{dateStr}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">題目數量</p>
                <p className="font-medium">{report.totalCorrect}/{report.totalQuestions} 題正確</p>
              </div>
            </div>
          </div>

          {/* Band bar */}
          <div className="bg-white/10 px-6 py-3">
            <p className="text-white/90 text-xs">{band} · {bandDescription}</p>
          </div>
        </div>

        {/* ── Overall Summary ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <h2 className="font-bold text-gray-800 text-base mb-3">整體評語</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{report.overallSummary}</p>
        </div>

        {/* ── Strong Areas ── */}
        {strongAreas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h2 className="font-bold text-gray-800 text-base">孩子的強項</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {strongAreas.map((area, i) => (
                <div key={i} className="px-5 py-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#1D9E75' }}
                    >
                      {i + 1}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">{area.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3 ml-9">
                    {area.observation}
                  </p>
                  <div className="ml-9 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-teal-700 leading-relaxed">
                      <span className="font-semibold">💡 建議：</span>{area.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Weak Areas ── */}
        {weakAreas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h2 className="font-bold text-gray-800 text-base">需要加強的範疇</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {weakAreas.map((area, i) => {
                const colors = PRIORITY_COLORS[area.priority] ?? PRIORITY_COLORS['中優先']
                return (
                  <div key={i} className="px-5 py-5">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {area.priority}
                      </span>
                      <h3 className="font-semibold text-gray-800 text-sm">{area.name}</h3>
                    </div>

                    {/* Error analysis */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        問題分析
                      </p>
                      <div className="space-y-1.5 mb-3">
                        {area.errorTypes.map((e, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="text-xs text-red-400 mt-0.5 flex-shrink-0">•</span>
                            <span className="text-xs text-gray-700">{e}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-gray-700">根本原因：</span>
                          {area.rootCause}
                        </p>
                      </div>
                    </div>

                    {/* Solutions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        升分秘笈的解決方法
                      </p>
                      <div className="space-y-2">
                        {area.solutions.map((sol, j) => (
                          <div key={j} className="flex gap-3">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: '#0E7CBF' }}
                            >
                              {j + 1}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-0.5">{sol.title}</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{sol.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Module Accuracy Grid ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-base">各範疇掌握度分析</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            {report.modules.map((mod) => {
              const rating = mod.rating as Rating
              const colors = RATING_COLORS[rating]
              const pct = mod.total > 0 ? Math.round((mod.correct / mod.total) * 100) : 0
              return (
                <div key={mod.name} className={`rounded-xl p-3 border ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2">
                      {mod.name}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            rating === 'S' || rating === 'A' ? '#1D9E75' : rating === 'B' ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${colors.text} w-9 text-right flex-shrink-0`}>
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{mod.correct}/{mod.total} 題</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Module Diagnostic Comments ── */}
        {report.modules.some((m) => m.comment) && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-base">各範疇詳細診斷</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {report.modules.map((mod) => {
                if (!mod.comment) return null
                const rating = mod.rating as Rating
                const colors = RATING_COLORS[rating]
                const pct = mod.total > 0 ? Math.round((mod.correct / mod.total) * 100) : 0
                return (
                  <div key={mod.name} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800 text-sm">{mod.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {rating}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {mod.correct}/{mod.total}（{pct}%）
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {mod.comment}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

        {/* ── Learning Plan ── */}
        {learningPlan.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-base">建議學習計劃</h2>
            </div>
            <div className="px-5 py-4">
              <div className="space-y-2">
                {learningPlan.map((item, i) => {
                  const isFirst = item.priority === '第一優先'
                  const isContinue = item.priority === '持續練習'
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-xl px-3 py-3 ${
                        isFirst ? 'bg-red-50 border border-red-100' :
                        isContinue ? 'bg-teal-50 border border-teal-100' :
                        'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${
                          isFirst ? 'bg-red-100 text-red-700' :
                          isContinue ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{item.area}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.action}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
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

        {/* ── CTA ── */}
        <div
          className="rounded-2xl p-6 text-center text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0E7CBF 100%)' }}
        >
          <p className="font-bold text-lg mb-1">立即預約免費試堂</p>
          <p className="text-white/80 text-sm mb-5">
            讓我們的老師為孩子制定個人化學習計劃
          </p>
          <div className="flex flex-col gap-3 items-center">
            <a
              href="https://wa.me/85200000000"
              className="inline-block px-8 py-3 bg-white rounded-xl font-semibold text-sm w-full max-w-xs"
              style={{ color: '#1D9E75' }}
            >
              WhatsApp 查詢
            </a>
            <a
              href="tel:+85200000000"
              className="inline-block px-8 py-3 bg-white/20 border border-white/40 rounded-xl font-semibold text-sm text-white w-full max-w-xs"
            >
              致電查詢
            </a>
          </div>
          <p className="text-white/60 text-xs mt-4">
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
