import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string; sessionId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()

  // Verify parent-student link
  const { data: link } = await service
    .from('parent_student_relationships')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', params.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) redirect('/parent')

  // Fetch session
  const { data: session } = await service
    .from('practice_sessions')
    .select('id, started_at, completed_at, total_questions, correct_count, session_type, student_id')
    .eq('id', params.sessionId)
    .eq('student_id', params.id)
    .single()

  if (!session) notFound()

  // Fetch student name
  const { data: profile } = await service
    .from('student_profiles')
    .select('name')
    .eq('id', params.id)
    .single()

  // Fetch all answer records for this session
  const { data: answers } = await service
    .from('answer_records')
    .select('id, question_id, question_source, student_answer, is_correct, time_spent_seconds, answered_at')
    .eq('session_id', params.sessionId)
    .order('answered_at', { ascending: true })

  const records = answers ?? []

  // Separate by source
  const legacyIds = records.filter((r) => !r.question_source || r.question_source === 'questions').map((r) => r.question_id)
  const assessmentIds = records.filter((r) => r.question_source === 'assessment_questions').map((r) => r.question_id)

  const questionTextMap = new Map<string, string>()
  const questionAnswerMap = new Map<string, string>()
  const questionTypeMap = new Map<string, string>()

  if (legacyIds.length > 0) {
    const { data: qs } = await service
      .from('questions')
      .select('id, question_text, correct_answer, question_type')
      .in('id', legacyIds)
    for (const q of qs ?? []) {
      questionTextMap.set(q.id, q.question_text)
      questionAnswerMap.set(q.id, q.correct_answer)
      questionTypeMap.set(q.id, q.question_type)
    }
  }

  if (assessmentIds.length > 0) {
    const { data: qs } = await service
      .from('assessment_questions')
      .select('id, question_text, correct_answer, question_type')
      .in('id', assessmentIds)
    for (const q of qs ?? []) {
      questionTextMap.set(q.id, q.question_text)
      questionAnswerMap.set(q.id, q.correct_answer)
      questionTypeMap.set(q.id, q.question_type)
    }
  }

  const date = new Date(session.started_at).toLocaleDateString('zh-HK')
  const time = new Date(session.started_at).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })
  const duration =
    session.completed_at
      ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
      : 0
  const isSprint = session.session_type === 'exam_sprint'
  const correctCount = session.correct_count ?? 0
  const totalQ = session.total_questions ?? records.length

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/parent/child/${params.id}?tab=history`}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 返回
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {profile?.name ?? '學生'} 的練習詳情
          </h1>
          <p className="text-xs text-gray-400">
            {date} {time}
            {isSprint && ' · 考試衝刺'}
            {duration > 0 && ` · ${duration} 分鐘`}
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex items-center justify-around text-center">
        <div>
          <p className="text-2xl font-bold text-[#4CAF50]">{correctCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">答對</p>
        </div>
        <div className="w-px h-10 bg-gray-100" />
        <div>
          <p className="text-2xl font-bold text-red-400">{totalQ - correctCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">答錯</p>
        </div>
        <div className="w-px h-10 bg-gray-100" />
        <div>
          <p className="text-2xl font-bold text-gray-700">
            {totalQ > 0 ? `${Math.round((correctCount / totalQ) * 100)}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">正確率</p>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-3">
        {records.map((r, idx) => {
          const qText = questionTextMap.get(r.question_id) ?? '(題目已刪除)'
          const correctAns = questionAnswerMap.get(r.question_id) ?? ''
          return (
            <div
              key={r.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                r.is_correct ? 'border-[#1D9E75]' : 'border-[#EF9F27]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                    r.is_correct ? 'bg-[#1D9E75]' : 'bg-[#EF9F27]'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed">{qText}</p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    <span className={r.is_correct ? 'text-[#1D9E75] font-medium' : 'text-[#EF9F27]'}>
                      {r.is_correct ? '✓ ' : '✗ '}學生答：
                      <span className="font-semibold">{r.student_answer ?? '(未作答)'}</span>
                    </span>
                    {!r.is_correct && correctAns && (
                      <span className="text-gray-500">
                        正確答案：<span className="font-semibold text-gray-700">{correctAns}</span>
                      </span>
                    )}
                    {r.time_spent_seconds != null && (
                      <span className="text-gray-400">{r.time_spent_seconds}秒</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
