import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PracticeFlow from './PracticeFlow'
import type { Question } from '@/types/database'

export default async function PracticePage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Load session
  const { data: session } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('student_id', user.id)
    .single()

  if (!session) notFound()

  // Already completed → go to results
  if (session.completed_at) {
    redirect(`/student/results/${params.sessionId}`)
  }

  const questionIds: string[] = session.question_ids ?? []

  if (!questionIds.length) notFound()

  // Load questions in order
  const { data: questionsRaw } = await supabase
    .from('questions')
    .select('*, category:question_categories(id, name, code)')
    .in('id', questionIds)

  // Re-sort to match original session order
  const questionMap = new Map(
    (questionsRaw ?? []).map((q) => [q.id, q as Question])
  )
  const questions = questionIds
    .map((id) => questionMap.get(id))
    .filter((q): q is Question => !!q)

  if (!questions.length) notFound()

  return (
    <PracticeFlow
      sessionId={params.sessionId}
      questions={questions}
    />
  )
}
