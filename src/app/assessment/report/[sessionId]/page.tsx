import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import { RATING_COLORS } from '@/lib/assessmentUtils'
import type { ReportData, Rating, AssessmentAnswer } from '@/types/assessment'
import { DIAGNOSTIC_TIER_LABELS } from '@/types/assessment'
import PrintButton from './PrintButton'

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
    month: 'long',
    day: 'numeric',
  })

  const score = report.score ?? (
    report.totalQuestions > 0
      ? Math.round((report.totalCorrect / report.totalQuestions) * 100)
      : 0
  )
  const band = report.band ?? 'AI 建議'
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

  // Color reflects score (Band 1/2/3 strings replaced with neutral 「AI 建議」 label)
  const bandColor = score >= 85 ? '#1D9E75' : score >= 65 ? '#F59E0B' : '#EF4444'
  const diagnosticTier = report.diagnosticTier
  const unitMastery = report.unitMastery ?? []
  const topicMastery = report.topicMastery ?? []

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <style>{`
        @media print {
          @page { margin: 12mm; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .rounded-2xl { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── PDF export button ── */}
        <div className="flex justify-end print:hidden">
          <PrintButton />
        </div>

        {/* ── Header ── */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo.png"
              alt="霖楓學苑 LF Academy"
              width={160}
              height={64}
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">霖楓學苑 · 學習評估報告</p>
          <h1 className="text-2xl font-bold text-gray-800">數學學習評估</h1>
          <p className="text-gray-500 text-sm mt-1">
            學生：{s.student_name} ｜ {s.grade_level} ｜ {dateStr}
          </p>
        </div>

        {/* ── Diagnostic banner (P3 only) ── */}
        {diagnosticTier && (() => {
          const meta = DIAGNOSTIC_TIER_LABELS[diagnosticTier]
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            teal:   { bg: 'bg-teal-50',   border: 'border-teal-300',   text: 'text-teal-800' },
            amber:  { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-800' },
            orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
          }
          const c = colorMap[meta.color] ?? colorMap.amber
          return (
            <div className={`rounded-2xl border-2 px-5 py-4 ${c.bg} ${c.border}`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">{meta.emoji}</span>
                <div>
                  <p className={`font-bold text-base mb-1 ${c.text}`}>{meta.title}</p>
                  <p className={`text-xs leading-relaxed ${c.text} opacity-90`}>{meta.description}</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── 3-column score card ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-4xl font-bold" style={{ color: '#1D9E75' }}>{score}</div>
            <div className="text-xs text-gray-500 mt-1">評估總分</div>
            <div className="text-xs text-gray-400">滿分100</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold mt-1" style={{ color: bandColor }}>{band}</div>
            <div className="text-xs text-gray-400 leading-tight mt-1">{bandDescription}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-4xl font-bold" style={{ color: '#1D9E75' }}>{strongAreas.length}個</div>
            <div className="text-xs text-gray-500 mt-1">強項範疇</div>
            <div className="text-xs text-gray-400 leading-tight truncate">
              {strongAreas.map((a) => a.title.replace(/^[^一-龥a-zA-Z]+/, '')).join('、') || '—'}
            </div>
          </div>
        </div>

        {/* ── Strong Areas ── */}
        {strongAreas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h2 className="font-bold text-gray-800 text-base">{s.student_name}的強項</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {strongAreas.map((area, i) => (
                <div key={i} className="px-5 py-5" style={{ borderLeft: '4px solid #1D9E75' }}>
                  <h3 className="font-bold text-base mb-2" style={{ color: '#1D9E75' }}>
                    {area.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {area.observation}
                  </p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-sm flex-shrink-0">💡</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{area.tip}</p>
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
                    {/* Title row */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base text-gray-800">
                        {i + 1}. {area.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {area.priority}
                      </span>
                    </div>

                    {/* 問題分析 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm">📋</span>
                        <p className="text-xs font-semibold text-gray-600">問題分析</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 mb-1.5">錯誤類型：</p>
                      <div className="space-y-1 mb-3 ml-1">
                        {area.errorTypes.map((e, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">•</span>
                            <span className="text-xs text-gray-700 leading-relaxed">{e}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="font-semibold">根本原因：</span>{area.rootCause}
                      </p>
                    </div>

                    {/* 解決方案 */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">針對訓練方案</p>
                      <div className="space-y-2.5">
                        {area.solutions.map((sol, j) => (
                          <div key={j} className="flex gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: '#0E7CBF' }}
                            >
                              {j + 1}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-800">{sol.title}：</span>
                              <span className="text-xs text-gray-600 leading-relaxed">{sol.detail}</span>
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

        {/* ── Unit Mastery (P3) or legacy Module Mastery ── */}
        {unitMastery.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="font-bold text-gray-800 text-base">大單元掌握度</h2>
            </div>
            <div className="px-5 py-5 grid grid-cols-2 gap-x-6 gap-y-5">
              {unitMastery.map((m) => {
                const color = m.pct >= 75 ? '#1D9E75' : m.pct >= 50 ? '#F59E0B' : '#EF4444'
                const rc = RATING_COLORS[m.rating as Rating]
                return (
                  <div key={m.unit_id} className="text-center">
                    <p className="text-xs text-gray-500 mb-1 truncate">{m.unit_name}</p>
                    <p className="text-3xl font-bold" style={{ color }}>{m.pct}%</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.correct_marks}/{m.total_marks} 分</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-1.5 py-0.5 rounded border ${rc.bg} ${rc.text} ${rc.border}`}>
                      {m.rating}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="font-bold text-gray-800 text-base">各範疇掌握度分析</h2>
            </div>
            <div className="px-5 py-5 grid grid-cols-2 gap-x-6 gap-y-5">
              {report.modules.map((mod) => {
                const pct = mod.total > 0 ? Math.round((mod.correct / mod.total) * 100) : 0
                const color = pct >= 75 ? '#1D9E75' : pct >= 50 ? '#F59E0B' : '#EF4444'
                const rating = mod.rating as Rating
                const rc = RATING_COLORS[rating]
                return (
                  <div key={mod.name} className="text-center">
                    <p className="text-xs text-gray-500 mb-1 truncate">{mod.name}</p>
                    <p className="text-3xl font-bold" style={{ color }}>{pct}%</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-1.5 py-0.5 rounded border ${rc.bg} ${rc.text} ${rc.border}`}>
                      {rating}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Topic Mastery (P3 drill-down only) ── */}
        {topicMastery.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="font-bold text-gray-800 text-base">小單元掌握度</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {topicMastery.map((m) => {
                const color = m.pct >= 75 ? '#1D9E75' : m.pct >= 50 ? '#F59E0B' : '#EF4444'
                return (
                  <div key={m.topic_id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{m.topic_name}</p>
                      <p className="text-xs text-gray-400">{m.unit_name} · {m.correct_marks}/{m.total_marks} 分</p>
                    </div>
                    <p className="text-2xl font-bold flex-shrink-0" style={{ color }}>{m.pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Learning Plan ── */}
        {learningPlan.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h2 className="font-bold text-gray-800 text-base">建議學習計劃</h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-3">根據評估結果，建議按以下優先順序進行學習：</p>
              <div className="divide-y divide-gray-100">
                {learningPlan.map((item, i) => {
                  const priorityColor = i === 0 ? '#EF4444' : i === 1 ? '#F59E0B' : i === 2 ? '#0E7CBF' : '#1D9E75'
                  return (
                    <div key={i} className="flex items-start gap-3 py-3">
                      <span
                        className="text-xs font-bold w-16 flex-shrink-0 mt-0.5"
                        style={{ color: priorityColor }}
                      >
                        {item.priority}
                      </span>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="font-semibold">{item.area}</span>
                        {item.action ? ` — ${item.action}` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
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

        {/* ── Free Resources ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📚</span>
            <h2 className="font-bold text-gray-800 text-base">免費練習資源（家長可自行使用）</h2>
          </div>
          <ul className="space-y-2">
            {[
              '教育局電子學習資源：www.hkedcity.net',
              '教育城 MathConcept：www.mathconcept.com',
              'YouTube：「小學數學 各題型 教學」系列',
              '教育局《數學與我》網頁遊戲',
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* ── 霖楓學苑課程介紹 ── */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="霖楓學苑 LF Academy" width={120} height={48} className="rounded-lg" />
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center mb-4">
            霖楓學苑如何幫助{s.student_name}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: '👥', title: '小班教學', desc: `針對${s.student_name}的弱項，老師能即時跟進每一個解題思路` },
              { icon: '🧮', title: '系統訓練', desc: '針對性計算和解題方法，提升準確率和解題速度' },
              { icon: '📋', title: '審題技巧', desc: '審題步驟訓練＋關鍵詞識別，建立系統化解題習慣' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-3xl">{f.icon}</span>
                <p className="text-xs font-semibold text-gray-700">{f.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          className="rounded-2xl p-6 text-center text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0E7CBF 100%)' }}
        >
          <p className="font-bold text-lg mb-1">預約試堂</p>
          <p className="text-white/80 text-sm mb-5">
            了解針對{s.student_name}的個人備考方案
          </p>
          <a
            href="https://wa.me/85256011931"
            className="inline-block px-8 py-3 bg-white rounded-xl font-semibold text-sm w-full max-w-xs"
            style={{ color: '#1D9E75' }}
          >
            WhatsApp 查詢
          </a>
          <p className="text-white/60 text-xs mt-4">
            此報告由霖楓學苑導師根據評估結果分析後撰寫，僅供家長參考
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pb-6 text-xs text-gray-400">
          <p>霖楓學苑 LF Academy · 小學數學升分專家</p>
          <a href="/assessment" className="text-teal-600 underline mt-1 inline-block">
            讓其他學生也做評估
          </a>
        </div>

      </div>
    </div>
  )
}
