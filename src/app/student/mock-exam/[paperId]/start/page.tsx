import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import StartMockExamButton from './StartMockExamButton'

export default async function MockExamStartPage({
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
      'id, student_id, mc_sq_question_ids, lq_question_ids, mc_sq_count, lq_count, mc_sq_session_id, timer_status, status'
    )
    .eq('id', params.paperId)
    .single()

  if (!paper) notFound()
  if (paper.student_id !== user.id) redirect('/student')

  // If timer is already running or finished, route to the appropriate next step.
  if (paper.timer_status === 'running' && paper.mc_sq_session_id) {
    redirect(`/student/practice/${paper.mc_sq_session_id}`)
  }
  if (paper.status === 'mc_sq_done' || paper.timer_status === 'paused_for_lq') {
    redirect(`/student/mock-exam/${paper.id}/results`)
  }
  if (paper.status === 'lq_uploaded' || paper.status === 'reviewed' || paper.timer_status === 'finished') {
    redirect(`/student/mock-exam/${paper.id}/results`)
  }

  const totalCount = paper.mc_sq_count + paper.lq_count

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#FFF8EC] to-white">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">📝 模擬考試試卷</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">試卷組成</p>
        <p className="text-sm text-gray-700">
          全卷共 <strong>{totalCount}</strong> 題：
        </p>
        <ul className="text-sm text-gray-700 mt-2 space-y-1">
          <li>· 多項選擇題 + 短答題 {paper.mc_sq_count} 題（喺 App 內作答）</li>
          <li>· 長答題 {paper.lq_count} 題（請列印或喺 iPad 上書寫）</li>
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          限時 50 分鐘。完成 App 內題目後計時會暫停，等你開始長答題再繼續。
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">📄 下載長答題試卷</p>
        <p className="text-xs text-gray-500 mb-3">
          建議開始作答前先下載並列印，或在 iPad 上開啟。
        </p>
        <div className="flex gap-2">
          <Link
            href={`/student/mock-exam/${paper.id}/lq?view=question`}
            target="_blank"
            className="flex-1 text-center py-2.5 rounded-xl bg-[#4A90E2] text-white text-sm font-medium hover:bg-[#3a80d2] transition"
          >
            試卷
          </Link>
          <Link
            href={`/student/mock-exam/${paper.id}/lq?view=answer`}
            target="_blank"
            className="flex-1 text-center py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
          >
            答案紙
          </Link>
        </div>
      </div>

      <StartMockExamButton paperId={paper.id} sessionId={paper.mc_sq_session_id ?? ''} />

      <p className="text-center text-xs text-gray-400 mt-4">
        按下「開始作答」即時開始 50 分鐘計時
      </p>
    </main>
  )
}
