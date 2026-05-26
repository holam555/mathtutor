import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MockExamTimer from '@/components/MockExamTimer'
import FinishLqButton from './FinishLqButton'

export default async function LqTimerPage({
  params,
}: {
  params: { paperId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/student')

  const service = createServiceClient()

  const { data: paper } = await service
    .from('mock_exam_papers')
    .select(
      'id, student_id, lq_count, timer_started_at, timer_paused_at, timer_elapsed_seconds, timer_status, status'
    )
    .eq('id', params.paperId)
    .single()

  if (!paper) notFound()
  if (paper.student_id !== user.id) redirect('/student')

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#FFF8EC] to-white">
      <MockExamTimer
        initial={{
          timer_started_at: paper.timer_started_at,
          timer_paused_at: paper.timer_paused_at,
          timer_elapsed_seconds: paper.timer_elapsed_seconds ?? 0,
          timer_status: paper.timer_status,
        }}
      />

      <h1 className="text-xl font-bold mb-3">📝 長答題作答中</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          請在已下載的長答題試卷上完成所有 <strong>{paper.lq_count}</strong> 題。
        </p>
        <p className="text-xs text-gray-500 mt-3">
          完成後請：
        </p>
        <ol className="text-xs text-gray-500 list-decimal pl-5 mt-1 space-y-1">
          <li>按下方「我已完成長答題」停止計時</li>
          <li>叫家長協助拍照上載每題答卷</li>
          <li>等候老師批改</li>
        </ol>
      </div>

      <FinishLqButton paperId={paper.id} />

      <div className="mt-5 text-center">
        <Link
          href={`/student/mock-exam/${paper.id}/lq?view=question`}
          target="_blank"
          className="text-sm text-gray-500 underline"
        >
          重新下載長答題試卷
        </Link>
      </div>
    </main>
  )
}
