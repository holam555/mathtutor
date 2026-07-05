import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MARKS, formatMarks, marksForQuestionType, totalPossibleMarks } from '@/lib/mockExamMarks'
import ResumeTimerButton from './ResumeTimerButton'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function MockExamResultsPage({
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
      'id, student_id, mc_sq_session_id, mc_sq_count, lq_count, mc_sq_question_ids, status, timer_status'
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

  // Pull every MC+SQ question's text + correct_answer so the page can render
  // a per-question breakdown (right/wrong + reveal). question_type drives
  // the per-question marks calc (MC = 1.5, SQ = 2). The Gemini-based AI
  // comment path that used to live here is gone — teachers found it
  // inaccurate ("did well on…" when the student got 4 / 35) so we let the
  // score + per-question reveal speak for itself instead.
  const qIds = (paper.mc_sq_question_ids ?? []) as string[]
  const { data: aqRows } = qIds.length
    ? await service
        .from('assessment_questions')
        .select('id, question_type, question_text, correct_answer')
        .in('id', qIds)
    : { data: [] as Array<{ id: string; question_type: string; question_text: string; correct_answer: string }> }

  type AqRow = { id: string; question_type: string; question_text: string; correct_answer: string }
  const aqRowsTyped = (aqRows ?? []) as AqRow[]

  const qToType = new Map<string, string>(aqRowsTyped.map((q) => [q.id, q.question_type]))
  const aqById = new Map<string, AqRow>(aqRowsTyped.map((q) => [q.id, q]))
  const mcSqPossibleMarks = aqRowsTyped.reduce(
    (s, q) => s + marksForQuestionType(q.question_type),
    0
  )

  // Earned marks + per-question student answers
  const { data: answerRows } = sessionDone && paper.mc_sq_session_id
    ? await service
        .from('answer_records')
        .select('question_id, student_answer, is_correct')
        .eq('session_id', paper.mc_sq_session_id)
    : { data: [] as Array<{ question_id: string; student_answer: string; is_correct: boolean }> }

  type AnsRow = { question_id: string; student_answer: string; is_correct: boolean }
  const ansRowsTyped = (answerRows ?? []) as AnsRow[]

  let earnedMarks = 0
  for (const a of ansRowsTyped) {
    if (!a.is_correct) continue
    const type = qToType.get(a.question_id) ?? 'fill_in_number'
    earnedMarks += marksForQuestionType(type)
  }

  const answerById = new Map<string, { student_answer: string; is_correct: boolean }>(
    ansRowsTyped.map((a) => [a.question_id, { student_answer: a.student_answer, is_correct: a.is_correct }])
  )

  const breakdown = qIds.map((qid, i) => {
    const q = aqById.get(qid)
    const ans = answerById.get(qid)
    return {
      num: i + 1,
      text: q?.question_text ?? translate('(題目資料缺失)', lang),
      type: q?.question_type ?? '',
      correct: q?.correct_answer ?? '',
      student: ans?.student_answer ?? translate('(未作答)', lang),
      answered: !!ans,
      isCorrect: !!ans?.is_correct,
    }
  })

  const lqMarksAvailable = paper.lq_count * MARKS.lq
  const totalPaperMarks = totalPossibleMarks({
    mc: aqRowsTyped.filter((q) => q.question_type === 'multiple_choice').length,
    sq: aqRowsTyped.filter((q) => q.question_type !== 'multiple_choice').length,
    lq: paper.lq_count,
  })

  // Pause timer + flip status if not yet done (idempotent)
  if (sessionDone && paper.timer_status === 'running') {
    await service
      .from('mock_exam_papers')
      .update({ status: 'mc_sq_done' })
      .eq('id', paper.id)
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#FFF8EC] to-white">
      <h1 className="text-xl font-bold mb-1">📝 {translate('模擬考試 · 階段一完成', lang)}</h1>
      <p className="text-sm text-gray-500 mb-5">{translate('多項選擇題', lang)} + {translate('短答題', lang)}</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {translate('已得分數', lang)}（{translate('多項選擇題', lang)} + {translate('短答題', lang)}）
        </p>
        <p className="text-5xl font-bold text-[#1D9E75]">
          {formatMarks(earnedMarks)}
          <span className="text-2xl text-gray-400">/{formatMarks(mcSqPossibleMarks)} {translate('分', lang)}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {translate('答對', lang)} {correctCount} / {totalCount}（{accuracy}%）
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {lang === 'en' ? `${paper.lq_count} long-answer questions (${formatMarks(lqMarksAvailable)} marks) will be graded by the teacher · full paper ${formatMarks(totalPaperMarks)} marks` : `長答題 ${paper.lq_count} 題（${formatMarks(lqMarksAvailable)} 分）將由老師批改 · 全卷滿分 ${formatMarks(totalPaperMarks)} 分`}
        </p>
      </div>

      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{translate('詳細答題情況', lang)}</p>
          <ul className="space-y-3">
            {breakdown.map((b) => (
              <li key={b.num} className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    b.isCorrect
                      ? 'bg-[#1D9E75] text-white'
                      : b.answered
                        ? 'bg-[#EF9F27] text-white'
                        : 'bg-gray-300 text-white'
                  }`}
                  aria-label={translate(b.isCorrect ? '答對' : b.answered ? '答錯' : '未作答', lang)}
                >
                  {b.isCorrect ? '✓' : b.answered ? '✗' : '—'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {lang === 'en' ? `Q${b.num}` : `第 ${b.num} 題`}
                    <span className="ml-2 text-xs text-gray-400">
                      {translate(b.type === 'multiple_choice' ? '多項選擇' : '短答', lang)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 break-words">{b.text}</p>
                  <div className="mt-1 text-xs leading-relaxed">
                    <span className="text-gray-500">{translate('你的答案：', lang)}</span>
                    <span
                      className={
                        b.isCorrect
                          ? 'text-[#1D9E75] font-semibold'
                          : b.answered
                            ? 'text-[#EF9F27] font-semibold'
                            : 'text-gray-400 italic'
                      }
                    >
                      {b.student}
                    </span>
                    {!b.isCorrect && (
                      <>
                        <span className="text-gray-500 ml-2">{translate('正確答案：', lang)}</span>
                        <span className="text-[#1D9E75] font-semibold break-words">{b.correct}</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          {lang === 'en' ? `⏱ ${paper.lq_count} long-answer questions remaining (${formatMarks(lqMarksAvailable)} marks)` : `⏱ 仲有 ${paper.lq_count} 題長答題未做（${formatMarks(lqMarksAvailable)} 分）`}
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          {translate('按下方按鈕後計時將繼續，請喺已下載的試卷上完成所有長答題。完成後家長幫手影相上載畀老師批改。', lang)}
        </p>
      </div>

      <ResumeTimerButton paperId={paper.id} />

      <div className="mt-5 text-center">
        <Link
          href={`/student/mock-exam/${paper.id}/lq?view=question`}
          target="_blank"
          className="text-sm text-gray-500 underline"
        >
          {translate('重新下載長答題試卷', lang)}
        </Link>
      </div>
    </main>
  )
}
