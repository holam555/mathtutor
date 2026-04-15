import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentReport } from '@/lib/fetchStudentReport'
import StudentReport from '@/components/StudentReport'
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
  const tab: 'overview' | 'wrong' | 'history' =
    rawTab === 'wrong' || rawTab === 'history' ? rawTab : 'overview'

  const rawRange = searchParams.range
  const range: TimeRange =
    rawRange === 'month' || rawRange === 'all' ? rawRange : 'week'

  const report = await fetchStudentReport(params.id, range)
  if (!report.profile) notFound()

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <StudentReport
        mode="admin"
        studentName={report.profile.name}
        studentGrade={report.profile.grade ?? null}
        range={range}
        basePath={`/admin/students/${params.id}`}
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
