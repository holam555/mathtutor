import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMockExamComment } from '@/lib/gemini'
import { MARKS, formatMarks, marksForQuestionType, totalPossibleMarks } from '@/lib/mockExamMarks'
import ResumeTimerButton from './ResumeTimerButton'

export default async function MockExamResultsPage({
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
      'id, student_id, mc_sq_session_id, mc_sq_count, lq_count, mc_sq_question_ids, status, timer_status, ai_comment'
    )
    .eq('id', params.paperId)
    .single()

  if (!paper) notFound()
  if (paper.student_id !== user.id) redirect('/student')

  const { data: session } = paper.mc_sq_session_id
    ? await service
        .from('practice_sessions')
        .select('id, correct_count, total_questions, completed_at')
        .eq('id', paper.mc_sq_session_id)
        .single()
    : { data: null }

  const sessionDone = !!session?.completed_at
  const correctCount = session?.correct_count ?? 0
  const totalCount = session?.total_questions ?? paper.mc_sq_count
  const accuracy = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100)

  // Pull question_type for every MC+SQ question on this paper so we can:
  //   (a) compute earned marks (MC = 1.5, SQ = 2)
  //   (b) compute the MC+SQ portion of the paper's 滿分
  //   (c) reuse the topic_id map for AI comment generation below
  const qIds = (paper.mc_sq_question_ids ?? []) as string[]
  const { data: aqRows } = qIds.length
    ? await service
        .from('assessment_questions')
        .select('id, topic_id, question_type')
        .in('id', qIds)
    : { data: [] as { id: string; topic_id: string; question_type: string }[] }

  const qToType = new Map<string, string>(
    (aqRows ?? []).map((q: { id: string; question_type: string }) => [q.id, q.question_type])
  )
  const mcSqPossibleMarks = (aqRows ?? []).reduce(
    (s, q) => s + marksForQuestionType(q.question_type),
    0
  )

  // Earned marks: fetched once, used for the score display and as input for
  // the AI comment block below.
  const { data: answerRows } = sessionDone && paper.mc_sq_session_id
    ? await service
        .from('answer_records')
        .select('question_id, is_correct')
        .eq('session_id', paper.mc_sq_session_id)
    : { data: [] as { question_id: string; is_correct: boolean }[] }

  let earnedMarks = 0
  for (const a of answerRows ?? []) {
    if (!a.is_correct) continue
    const type = qToType.get(a.question_id) ?? 'fill_in_number'
    earnedMarks += marksForQuestionType(type)
  }

  const lqMarksAvailable = paper.lq_count * MARKS.lq
  const totalPaperMarks = totalPossibleMarks({
    mc: (aqRows ?? []).filter((q) => q.question_type === 'multiple_choice').length,
    sq: (aqRows ?? []).filter((q) => q.question_type !== 'multiple_choice').length,
    lq: paper.lq_count,
  })

  let aiComment = paper.ai_comment ?? ''

  // Pause timer + flip status if not yet done (idempotent)
  if (sessionDone && paper.timer_status === 'running') {
    await service
      .from('mock_exam_papers')
      .update({ status: 'mc_sq_done' })
      .eq('id', paper.id)
  }

  // Generate AI comment lazily on first view if missing
  if (sessionDone && !aiComment) {
    try {
      const { data: profile } = await service
        .from('student_profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      const answers = answerRows
      const qToTopic = new Map<string, string>(
        (aqRows ?? []).map((q: { id: string; topic_id: string }) => [q.id, q.topic_id])
      )
      const topicIds: string[] = Array.from(new Set<string>(Array.from(qToTopic.values())))
      const { data: topics } = topicIds.length
        ? await service.from('curriculum_topics').select('id, name').in('id', topicIds)
        : { data: [] as { id: string; name: string }[] }
      const topicName = new Map<string, string>(
        (topics ?? []).map((t: { id: string; name: string }) => [t.id, t.name])
      )

      const tally = new Map<string, { correct: number; total: number }>()
      for (const a of answers ?? []) {
        const tid = qToTopic.get(a.question_id)
        if (!tid) continue
        const cur = tally.get(tid) ?? { correct: 0, total: 0 }
        cur.total += 1
        if (a.is_correct) cur.correct += 1
        tally.set(tid, cur)
      }
      const perTopic = Array.from(tally.entries()).map(([tid, v]) => ({
        topic_name: topicName.get(tid) ?? '未分類',
        correct: v.correct,
        total: v.total,
      }))

      aiComment = await generateMockExamComment({
        studentName: profile?.name ?? '同學',
        totalAnswered: answers?.length ?? 0,
        totalCorrect: answers?.filter((a) => a.is_correct).length ?? 0,
        perTopic,
      })

      if (aiComment) {
        await service
          .from('mock_exam_papers')
          .update({ ai_comment: aiComment })
          .eq('id', paper.id)
      }
    } catch (e) {
      console.error('Mock exam AI comment generation failed:', e)
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#FFF8EC] to-white">
      <h1 className="text-xl font-bold mb-1">📝 模擬考試 · 階段一完成</h1>
      <p className="text-sm text-gray-500 mb-5">多項選擇題 + 短答題</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          已得分數（多項選擇題 + 短答題）
        </p>
        <p className="text-5xl font-bold text-[#1D9E75]">
          {formatMarks(earnedMarks)}
          <span className="text-2xl text-gray-400">/{formatMarks(mcSqPossibleMarks)} 分</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          答對 {correctCount} / {totalCount} 題（{accuracy}%）
        </p>
        <p className="text-xs text-gray-400 mt-1">
          長答題 {paper.lq_count} 題（{formatMarks(lqMarksAvailable)} 分）將由老師批改 · 全卷滿分 {formatMarks(totalPaperMarks)} 分
        </p>
      </div>

      {aiComment && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            老師評語
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {aiComment}
          </p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          ⏱ 請繼續完成長答題部分
        </p>
        <p className="text-xs text-amber-700">
          按下方按鈕後計時將繼續，請在已下載嘅試卷上完成 {paper.lq_count} 題長答題。
        </p>
      </div>

      <ResumeTimerButton paperId={paper.id} />

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
