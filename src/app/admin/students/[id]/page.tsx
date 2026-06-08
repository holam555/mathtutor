import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchStudentReport } from '@/lib/fetchStudentReport'
import StudentReport from '@/components/StudentReport'
import AssignmentTab from './AssignmentTab'
import type { TimeRange } from '@/lib/studentReport'

export default async function AdminStudentDetail({
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

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const rawTab = searchParams.tab
  const isAssign = rawTab === 'assign'
  const tab: 'overview' | 'wrong' | 'history' =
    rawTab === 'wrong' || rawTab === 'history' ? rawTab : 'overview'

  const rawRange = searchParams.range
  const range: TimeRange =
    rawRange === 'month' || rawRange === 'all' ? rawRange : 'week'

  const service = createServiceClient()
  const basePath = `/admin/students/${params.id}`

  // ── Assign tab ───────────────────────────────────────────────────────────
  if (isAssign) {
    // Need profile for name + grade
    const { data: profile } = await service
      .from('student_profiles')
      .select('id, name, grade')
      .eq('id', params.id)
      .single()

    if (!profile) notFound()

    const GRADE_LABEL: Record<number, string> = { 3: '三', 4: '四', 5: '五', 6: '六' }

    // Fetch units + topics for the student's grade
    const { data: rawUnits } = await service
      .from('curriculum_units')
      .select('id, unit_number, name, semester, display_order')
      .eq('grade', profile.grade ?? 5)
      .neq('unit_number', 999)
      .order('display_order')

    const unitIds = (rawUnits ?? []).map((u) => u.id)
    const { data: rawTopics } = await service
      .from('curriculum_topics')
      .select('id, unit_id, lesson_number, name, display_order')
      .in('unit_id', unitIds)
      .order('display_order')

    const topicsByUnit = new Map<string, typeof rawTopics>()
    for (const t of rawTopics ?? []) {
      if (!topicsByUnit.has(t.unit_id)) topicsByUnit.set(t.unit_id, [])
      topicsByUnit.get(t.unit_id)!.push(t)
    }

    const units = (rawUnits ?? []).map((u) => ({
      id: u.id,
      unit_number: u.unit_number,
      name: u.name,
      semester: u.semester ?? 'A',
      topics: (topicsByUnit.get(u.id) ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        lesson_number: t.lesson_number,
      })),
    }))

    // Fetch current active assignments
    const { data: assignments } = await service
      .from('student_topic_assignments')
      .select('topic_id')
      .eq('student_id', params.id)
      .eq('is_active', true)

    const activeTopicIds = (assignments ?? []).map((a) => a.topic_id)

    const tabs = [
      { key: 'overview', label: '整體表現' },
      { key: 'wrong', label: '錯題詳情' },
      { key: 'history', label: '練習歷史' },
      { key: 'assign', label: '指定練習' },
    ]

    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/students" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            {profile.grade && (
              <p className="text-xs text-gray-400">小{GRADE_LABEL[profile.grade] ?? profile.grade}</p>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`${basePath}?tab=${t.key}&range=${range}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                t.key === 'assign'
                  ? 'border-[#4A90E2] text-[#4A90E2]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <AssignmentTab
          studentId={params.id}
          units={units}
          activeTopicIds={activeTopicIds}
        />
      </main>
    )
  }

  // ── Other tabs — delegate to StudentReport ───────────────────────────────
  const report = await fetchStudentReport(params.id, range)
  if (!report.profile) notFound()

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Assign tab link injected above StudentReport's own tab bar */}
      <div className="mb-[-16px]">
        <Link
          href={`${basePath}?tab=assign&range=${range}`}
          className="inline-block float-right text-xs text-[#4A90E2] underline mb-1"
        >
          指定練習 →
        </Link>
      </div>
      <StudentReport
        mode="admin"
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
      />
    </main>
  )
}
