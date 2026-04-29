import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { RATING_COLORS } from '@/lib/assessmentUtils'
import type { ReportData, Rating } from '@/types/assessment'

type AssessmentRow = {
  id: string
  student_name: string
  school_name: string | null
  grade_level: string
  parent_phone: string | null
  parent_email: string | null
  created_at: string
  report_data: ReportData | null
  answers: { is_correct: boolean }[]
}

export default async function AdminAssessmentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const { data: rows } = await service
    .from('assessment_sessions')
    .select('id, student_name, school_name, grade_level, parent_phone, parent_email, created_at, report_data, answers')
    .order('created_at', { ascending: false })
    .limit(200)

  const sessions: AssessmentRow[] = (rows ?? []) as AssessmentRow[]

  const totalLeads = sessions.length
  const thisWeek = sessions.filter((s) => {
    const d = new Date(s.created_at)
    const now = new Date()
    return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-teal-600 hover:underline">
            ← 返回後台
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">學前評估記錄</h1>
        <p className="text-sm text-gray-500 mb-6">所有通過公開評估頁面提交的學生資料</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">總評估人數</p>
            <p className="text-3xl font-bold text-gray-800">{totalLeads}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">本週新增</p>
            <p className="text-3xl font-bold" style={{ color: '#1D9E75' }}>{thisWeek}</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">尚未有評估記錄</p>
            <p className="text-xs text-gray-400 mt-1">
              學生完成學前評估後，記錄會顯示在這裡
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const totalQ = s.answers?.length ?? 0
              const correct = s.answers?.filter((a) => a.is_correct).length ?? 0
              const pct = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0
              const date = new Date(s.created_at).toLocaleDateString('zh-HK', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              })

              return (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Row header */}
                  <div className="px-5 py-4 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{s.student_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
                          {s.grade_level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.school_name ?? '學校未填'} · {date}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-lg font-bold text-gray-800">{pct}%</div>
                      <div className="text-xs text-gray-400">{correct}/{totalQ} 題</div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="px-5 pb-3 flex flex-wrap gap-4 border-t border-gray-50 pt-3">
                    {s.parent_phone && (
                      <a
                        href={`tel:${s.parent_phone}`}
                        className="text-xs text-teal-600 font-medium hover:underline"
                      >
                        📞 {s.parent_phone}
                      </a>
                    )}
                    {s.parent_email && (
                      <a
                        href={`mailto:${s.parent_email}`}
                        className="text-xs text-teal-600 font-medium hover:underline"
                      >
                        ✉️ {s.parent_email}
                      </a>
                    )}
                    <Link
                      href={`/assessment/report/${s.id}`}
                      className="text-xs text-gray-400 hover:text-teal-600 hover:underline ml-auto"
                      target="_blank"
                    >
                      查看完整報告 →
                    </Link>
                  </div>

                  {/* Module summary */}
                  {s.report_data?.modules && (
                    <div className="px-5 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {s.report_data.modules.map((mod) => {
                          const r = mod.rating as Rating
                          const c = RATING_COLORS[r]
                          return (
                            <span
                              key={mod.name}
                              className={`text-xs px-2 py-1 rounded-lg border font-medium ${c.bg} ${c.text} ${c.border}`}
                            >
                              {mod.name} {r}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
