import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchStudentReport } from '@/lib/fetchStudentReport'
import StudentReport from '@/components/StudentReport'
import type { TimeRange } from '@/lib/studentReport'

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

  // CRITICAL: Verify this parent is linked to this student
  const service = createServiceClient()
  const { data: link } = await service
    .from('parent_student_relationships')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', params.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) {
    // Not authorized to view this student
    redirect('/parent')
  }

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
        mode="parent"
        studentName={report.profile.name}
        studentGrade={report.profile.grade ?? null}
        range={range}
        basePath={`/parent/child/${params.id}`}
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
