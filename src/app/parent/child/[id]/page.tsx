import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchStudentReport } from '@/lib/fetchStudentReport'
import StudentReport from '@/components/StudentReport'
import type { TimeRange } from '@/lib/studentReport'

const GRADE_LABEL: Record<number, string> = { 3: '三', 4: '四', 5: '五', 6: '六' }

const TABS = [
  { key: 'overview', label: '整體表現' },
  { key: 'wrong',    label: '需要加強' },
  { key: 'history',  label: '練習記錄' },
  { key: 'sprint',   label: '考試衝刺練習' },
] as const

export default async function ParentChildReport({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string; range?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()

  // CRITICAL: Verify this parent is linked to this student
  const { data: link } = await service
    .from('parent_student_relationships')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', params.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) redirect('/parent')

  const rawTab = searchParams.tab
  // Support old 'scope' key as alias
  const isSprint = rawTab === 'sprint' || rawTab === 'scope'
  const tab: 'overview' | 'wrong' | 'history' =
    rawTab === 'wrong' || rawTab === 'history' ? rawTab : 'overview'

  const rawRange = searchParams.range
  const range: TimeRange =
    rawRange === 'month' || rawRange === 'all' ? rawRange : 'week'

  // Always fetch student profile
  const { data: profile } = await service
    .from('student_profiles')
    .select('id, name, grade')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  // Fetch ALL scopes (active + past history)
  const { data: allScopes } = await service
    .from('exam_scopes')
    .select('id, exam_name, exam_date, unit_ids, is_active, created_at')
    .eq('student_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activeScope = (allScopes ?? []).find((s) => s.is_active) ?? null
  const pastScopes  = (allScopes ?? []).filter((s) => !s.is_active)

  // Resolve unit names for active scope
  let scopeUnits: { id: string; unit_number: number; name: string }[] = []
  if (activeScope?.unit_ids?.length) {
    const { data: units } = await service
      .from('curriculum_units')
      .select('id, unit_number, name')
      .in('id', activeScope.unit_ids)
      .order('display_order')
    scopeUnits = (units ?? []).map((u) => ({ id: u.id, unit_number: u.unit_number, name: u.name }))
  }

  // Resolve unit names for past scopes (batch fetch all unique ids)
  const pastUnitIds = Array.from(new Set((pastScopes ?? []).flatMap((s) => s.unit_ids ?? [])))
  const pastUnitMap = new Map<string, { unit_number: number; name: string }>()
  if (pastUnitIds.length > 0) {
    const { data: pastUnits } = await service
      .from('curriculum_units')
      .select('id, unit_number, name')
      .in('id', pastUnitIds)
    for (const u of pastUnits ?? []) pastUnitMap.set(u.id, { unit_number: u.unit_number, name: u.name })
  }

  // Count exam sprint sessions
  const { count: sprintCount } = await service
    .from('practice_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', params.id)
    .eq('session_type', 'exam_sprint')

  const basePath = `/parent/child/${params.id}`
  const sprintTabHref = `${basePath}?tab=sprint&range=${range}`

  // ── Sprint / exam scope tab ───────────────────────────────────────────────
  if (isSprint) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/parent" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <div>
            <h1 className="text-xl font-bold">{profile.name} 的表現</h1>
            {profile.grade && (
              <p className="text-xs text-gray-400">小{GRADE_LABEL[profile.grade] ?? '—'}</p>
            )}
          </div>
        </div>

        {/* 4-tab nav */}
        <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`${basePath}?tab=${t.key}&range=${range}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                t.key === 'sprint'
                  ? 'border-[#EF9F27] text-[#EF9F27]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Sprint content */}
        {!activeScope ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-semibold text-gray-700 mb-1">尚未設定考試衝刺練習</p>
            <p className="text-sm text-gray-400 mb-4">設定後，{profile.name}可以在主頁開始練習</p>
            <Link
              href="/parent/exam-scope/upload"
              className="inline-block bg-[#1D9E75] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              立即設定
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active scope card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{activeScope.exam_name ?? '考試衝刺練習'}</p>
                  {activeScope.exam_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      考試日期：{new Date(activeScope.exam_date).toLocaleDateString('zh-HK')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    設定於 {new Date(activeScope.created_at).toLocaleDateString('zh-HK')}
                  </p>
                </div>
                <span className="text-xs bg-[#1D9E75]/10 text-[#1D9E75] font-medium px-2 py-1 rounded-full shrink-0">
                  已生效
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                考試單元（共 {scopeUnits.length} 個）
              </p>
              <ul className="space-y-1.5">
                {scopeUnits.map((u) => (
                  <li key={u.id} className="flex items-center gap-2.5 p-2 bg-[#F7FBF9] rounded-xl">
                    <span className="w-6 h-6 rounded-lg bg-[#1D9E75] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {u.unit_number}
                    </span>
                    <span className="text-sm text-gray-700">{u.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sprint count */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">衝刺練習完成次數</p>
                <p className="text-xs text-gray-400 mt-0.5">針對以上單元的專項練習</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#EF9F27]">{sprintCount ?? 0}</p>
                <p className="text-xs text-gray-400">次</p>
              </div>
            </div>

            {/* Print */}
            <Link
              href={`/parent/child/${params.id}/print-exam`}
              className="flex items-center justify-between bg-[#EFF9F5] border border-[#1D9E75]/20 rounded-2xl p-4"
            >
              <div>
                <p className="text-sm font-medium text-[#1D9E75]">🖨 列印練習卷</p>
                <p className="text-xs text-gray-500 mt-0.5">生成包含答案卷的 PDF 練習紙</p>
              </div>
              <span className="text-[#1D9E75] text-sm">→</span>
            </Link>

            {/* Update */}
            <Link
              href="/parent/exam-scope/upload"
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4"
            >
              <p className="text-sm text-gray-600">更新考試範圍</p>
              <span className="text-gray-400 text-sm">→</span>
            </Link>

            {/* Past scopes history */}
            {pastScopes.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  過往考試範圍
                </p>
                <div className="space-y-3">
                  {pastScopes.map((s) => (
                    <div key={s.id} className="border-b last:border-b-0 border-gray-50 pb-3 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-gray-700 font-medium">{s.exam_name ?? '考試範圍'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            設定於 {new Date(s.created_at).toLocaleDateString('zh-HK')} ·{' '}
                            {(s.unit_ids ?? []).length} 個單元
                          </p>
                        </div>
                        <span className="text-xs text-gray-300 font-medium px-2 py-0.5 border border-gray-200 rounded-full shrink-0">
                          已過期
                        </span>
                      </div>
                      {(s.unit_ids ?? []).length > 0 && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          {(s.unit_ids ?? [])
                            .map((uid: string) => {
                              const u = pastUnitMap.get(uid)
                              return u ? `U${u.unit_number} ${u.name}` : null
                            })
                            .filter(Boolean)
                            .join('、')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    )
  }

  // ── Other tabs — delegate to StudentReport ────────────────────────────────
  const report = await fetchStudentReport(params.id, range)
  if (!report.profile) notFound()

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <StudentReport
        mode="parent"
        studentName={report.profile.name}
        studentGrade={report.profile.grade ?? null}
        range={range}
        basePath={basePath}
        stats={report.stats}
        categoryStats={report.categoryStats}
        sessions={report.sessions}
        wrongGroups={report.wrongGroups}
        avgSecondsPerQuestion={report.avgSecondsPerQuestion}
        activeTab={tab}
        sprintTabHref={sprintTabHref}
      />
    </main>
  )
}
