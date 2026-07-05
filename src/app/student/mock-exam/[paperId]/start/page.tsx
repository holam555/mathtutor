import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MARKS, formatMarks, totalPossibleMarks } from '@/lib/mockExamMarks'
import StartMockExamButton from './StartMockExamButton'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function MockExamStartPage({
  params,
}: {
  params: { paperId: string }
}) {
  const supabase = createClient()
  const lang = getLang()
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

  // Split mc_sq into MC vs SQ for the marks breakdown
  const mcSqIds = (paper.mc_sq_question_ids ?? []) as string[]
  const { data: mcSqTypes } = mcSqIds.length
    ? await service
        .from('assessment_questions')
        .select('id, question_type')
        .in('id', mcSqIds)
    : { data: [] as Array<{ id: string; question_type: string }> }

  const mcCount = (mcSqTypes ?? []).filter((q) => q.question_type === 'multiple_choice').length
  const sqCount = (mcSqTypes ?? []).length - mcCount
  const totalMarks = totalPossibleMarks({ mc: mcCount, sq: sqCount, lq: paper.lq_count })

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#FFF8EC] to-white">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">📝 {translate('模擬考試試卷', lang)}</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{translate('試卷組成', lang)}</p>
          <p className="text-xs text-gray-500">
            {translate('滿分', lang)} <strong className="text-gray-700">{formatMarks(totalMarks)}</strong> {translate('分', lang)}
          </p>
        </div>
        <p className="text-sm text-gray-700">
          {translate('全卷共', lang)} <strong>{totalCount}</strong> {translate('題：', lang)}
        </p>
        <ul className="text-sm text-gray-700 mt-2 space-y-1">
          <li>· {translate('多項選擇題', lang)} × {mcCount}（{formatMarks(MARKS.mc)} {translate('分', lang)}/{translate('題', lang)}）</li>
          <li>· {translate('短答題', lang)} × {sqCount}（{formatMarks(MARKS.sq)} {translate('分', lang)}/{translate('題', lang)}）</li>
          <li>· {translate('長答題', lang)} × {paper.lq_count}（{formatMarks(MARKS.lq)} {translate('分', lang)}/{translate('題', lang)}）</li>
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          {translate('限時 50 分鐘。完成 App 內題目後計時會暫停，等你開始長答題再繼續。', lang)}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">📄 {translate('下載長答題試卷', lang)}</p>
        <p className="text-xs text-gray-500 mb-3">
          {translate('建議開始作答前先下載並列印，或在 iPad 上開啟。', lang)}
        </p>
        <div className="flex gap-2">
          <Link
            href={`/student/mock-exam/${paper.id}/lq?view=question`}
            target="_blank"
            className="flex-1 text-center py-2.5 rounded-xl bg-[#4A90E2] text-white text-sm font-medium hover:bg-[#3a80d2] transition"
          >
            {translate('試卷', lang)}
          </Link>
          <Link
            href={`/student/mock-exam/${paper.id}/lq?view=answer`}
            target="_blank"
            className="flex-1 text-center py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
          >
            {translate('答案', lang)}
          </Link>
        </div>
      </div>

      <StartMockExamButton paperId={paper.id} sessionId={paper.mc_sq_session_id ?? ''} />

      <p className="text-center text-xs text-gray-400 mt-4">
        {translate('按下「開始作答」即時開始 50 分鐘計時', lang)}
      </p>
    </main>
  )
}
