/**
 * Shared student performance report — used by admin and parent views.
 * Server Component. Receives pre-fetched data from caller.
 */
import Link from 'next/link'
import { computeAccuracy, type CategoryStat } from '@/lib/statsUtils'
import { type TimeRange } from '@/lib/studentReport'

type SessionRow = {
  id: string
  started_at: string
  total_questions: number | null
  correct_count: number | null
  completed_at: string | null
  session_type?: string | null
}

type WrongGroup = {
  category_name: string
  category_code: string
  questions: {
    id: string
    question_text: string
    correct_answer: string
    last_wrong_answer: string
    wrong_count: number
  }[]
}

export type ReportMode = 'admin' | 'parent'

export default function StudentReport({
  mode,
  studentName,
  studentGrade,
  range,
  basePath,
  stats,
  categoryStats,
  sessions,
  wrongGroups,
  avgSecondsPerQuestion,
  activeTab,
  sprintTabHref,
}: {
  mode: ReportMode
  studentName: string
  studentGrade: number | null
  range: TimeRange
  basePath: string // '/admin/students/[id]' or '/parent/child/[id]'
  stats: { totalAnswers: number; correctAnswers: number; sessionCount: number; streak: number }
  categoryStats: CategoryStat[]
  sessions: SessionRow[]
  wrongGroups: WrongGroup[]
  avgSecondsPerQuestion: number
  activeTab: 'overview' | 'wrong' | 'history'
  sprintTabHref?: string
}) {
  const accuracy = computeAccuracy(stats.correctAnswers, stats.totalAnswers)

  const weakCategories = categoryStats.filter((c) => c.accuracy < 50 && c.total_attempts >= 5)

  const rangeLabel: Record<TimeRange, string> = { week: '本週', month: '本月', all: '全部' }
  const tabLabel = mode === 'parent' ? {
    overview: '整體表現',
    wrong: '需要加強',
    history: '練習記錄',
  } : {
    overview: '整體表現',
    wrong: '錯題詳情',
    history: '練習歷史',
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={mode === 'admin' ? '/admin/students' : '/parent'}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 返回
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {mode === 'parent' ? `${studentName} 的表現` : studentName}
          </h1>
          {studentGrade && (
            <p className="text-xs text-gray-400">
              小{studentGrade === 5 ? '五' : '六'}
            </p>
          )}
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 mb-4">
        {(['week', 'month', 'all'] as const).map((r) => (
          <Link
            key={r}
            href={`${basePath}?tab=${activeTab}&range=${r}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              range === r ? 'bg-[#4A90E2] text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {rangeLabel[r]}
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
        {(['overview', 'wrong', 'history'] as const).map((t) => (
          <Link
            key={t}
            href={`${basePath}?tab=${t}&range=${range}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === t
                ? 'border-[#4A90E2] text-[#4A90E2]'
                : 'border-transparent text-gray-500'
            }`}
          >
            {tabLabel[t]}
          </Link>
        ))}
        {sprintTabHref && (
          <Link
            href={sprintTabHref}
            className="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition border-transparent text-gray-500 hover:text-gray-700"
          >
            模擬考試
          </Link>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="完成題數" value={stats.totalAnswers} />
            <MetricCard
              label="正確率"
              value={stats.totalAnswers ? `${accuracy}%` : '—'}
              color={accuracy >= 70 ? 'text-[#4CAF50]' : accuracy >= 50 ? 'text-[#4A90E2]' : 'text-red-500'}
            />
            <MetricCard label="連續天數" value={`${stats.streak} 天`} color="text-[#EF9F27]" />
            <MetricCard
              label="平均每題用時"
              value={avgSecondsPerQuestion > 0 ? `${avgSecondsPerQuestion} 秒` : '—'}
            />
          </div>

          {/* Category accuracy bars */}
          {categoryStats.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                各題型正確率
              </p>
              <div className="space-y-3">
                {categoryStats.slice(0, 10).map((c) => (
                  <div key={c.category_id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {c.category_code} {c.category_name}
                      </p>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.accuracy}%`,
                            backgroundColor:
                              c.accuracy >= 80
                                ? '#4CAF50'
                                : c.accuracy >= 50
                                  ? '#4A90E2'
                                  : '#F44336',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold w-9 text-right text-gray-700 shrink-0">
                      {c.accuracy}%
                    </span>
                    <span className="text-xs text-gray-400 w-10 text-right shrink-0">
                      {c.total_attempts} 題
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto notes */}
          {mode === 'admin' && weakCategories.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2">系統備注</p>
              <ul className="space-y-1">
                {weakCategories.map((c) => (
                  <li key={c.category_id} className="text-xs text-amber-800">
                    • {c.category_code} {c.category_name} 正確率僅 {c.accuracy}%，建議重點講解
                  </li>
                ))}
              </ul>
            </div>
          )}
          {mode === 'parent' && weakCategories.length > 0 && (
            <div className="bg-[#EF9F27]/10 border border-[#EF9F27]/20 rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#C87E10] mb-2">可以多加練習的題型</p>
              <ul className="space-y-1">
                {weakCategories.slice(0, 3).map((c) => (
                  <li key={c.category_id} className="text-xs text-[#8A5A0A]">
                    • {c.category_name} 可以多加練習
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'wrong' && (
        <div className="space-y-3">
          {wrongGroups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm text-gray-400 text-sm">
              {mode === 'parent' ? '暫時沒有需要加強的題目 👍' : '此時段暫無錯題記錄'}
            </div>
          ) : (
            wrongGroups.map((g) => (
              <div key={g.category_code} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-[#4A90E2] bg-[#4A90E2]/10 px-2 py-0.5 rounded-full">
                    {g.category_code}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{g.category_name}</span>
                  <span className="ml-auto text-xs text-gray-400">{g.questions.length} 題</span>
                </div>
                <div className="space-y-3">
                  {g.questions.map((q) => (
                    <div key={q.id} className="rounded-xl bg-gray-50 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs text-gray-700 leading-relaxed flex-1">{q.question_text}</p>
                        <span className="text-xs text-red-400 shrink-0 font-medium">×{q.wrong_count}</span>
                      </div>
                      {q.last_wrong_answer && (
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <span className="flex items-center gap-1 text-amber-600">
                            <span className="font-medium">學生答：</span>
                            <span className="line-through opacity-80">{q.last_wrong_answer}</span>
                          </span>
                          {q.correct_answer && (
                            <span className="flex items-center gap-1 text-teal-600">
                              <span className="font-medium">正確：</span>
                              <span className="font-semibold">{q.correct_answer}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm text-gray-400 text-sm">
              此時段暫無練習記錄
            </div>
          ) : (
            sessions.map((s) => {
              const pct = s.total_questions
                ? Math.round(((s.correct_count ?? 0) / s.total_questions) * 100)
                : 0
              const duration =
                s.completed_at && s.started_at
                  ? Math.round(
                      (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) /
                        60000
                    )
                  : 0
              const isSprint = s.session_type === 'exam_sprint' || s.session_type === 'mock_exam'
              return (
                <div key={s.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm text-gray-700">
                        {new Date(s.started_at).toLocaleDateString('zh-HK')}{' '}
                        <span className="text-xs text-gray-400">
                          {new Date(s.started_at).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                      {isSprint && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">模擬考試</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.correct_count ?? 0} / {s.total_questions ?? 0} 題
                      {duration > 0 ? ` · ${duration} 分鐘` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-semibold ${
                        pct >= 70 ? 'text-[#4CAF50]' : pct >= 50 ? 'text-[#4A90E2]' : 'text-red-500'
                      }`}
                    >
                      {pct}%
                    </span>
                    {mode === 'parent' && (
                      <Link
                        href={`${basePath}/session/${s.id}`}
                        className="text-xs text-[#4A90E2] underline whitespace-nowrap"
                      >
                        詳情
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </>
  )
}

function MetricCard({
  label,
  value,
  color = 'text-gray-800',
}: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
