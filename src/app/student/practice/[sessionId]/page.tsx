import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PracticeFlow from './PracticeFlow'
import type { Question } from '@/types/database'

const isNumericAnswer = (s: string | null | undefined) =>
  !!s && /^-?\d+(\.\d+)?(又\d+\/\d+|\/\d+)?$/.test(s.trim())

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

  const { data: session } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('student_id', user.id)
    .single()

  if (!session) notFound()

  if (session.completed_at) {
    redirect(`/student/results/${params.sessionId}`)
  }

  const questionIds: string[] = session.question_ids ?? []
  if (!questionIds.length) notFound()

  // Load from both pools (assessment_questions for new sessions, questions
  // for legacy retry_wrong entries). Service client bypasses the
  // service-only RLS on the curriculum tables.
  const service = createServiceClient()

  const [aqRes, legacyRes] = await Promise.all([
    service
      .from('assessment_questions')
      .select(
        'id, question_text, question_type, options, correct_answer, image_url, image_alt_text, difficulty_tier, topic_id',
      )
      .in('id', questionIds),
    service
      .from('questions')
      .select('*, category:question_categories(id, name, code)')
      .in('id', questionIds),
  ])

  type Row = Question & { numeric_answer?: boolean }
  const byId = new Map<string, Row>()

  type AqRow = {
    id: string
    question_text: string
    question_type: Row['question_type']
    options: unknown
    correct_answer: string
    image_url: string | null
    image_alt_text: string | null
    difficulty_tier: 'basic' | 'enhancement' | 'advanced'
    topic_id: string
  }

  for (const q of (aqRes.data ?? []) as AqRow[]) {
    byId.set(q.id, {
      id: q.id,
      category_id: '',
      question_text: q.question_text,
      question_image_url: q.image_url,
      image_alt_text: q.image_alt_text,
      question_type: q.question_type,
      options: (q.options as string[] | null) ?? null,
      correct_answer: '',
      difficulty:
        q.difficulty_tier === 'basic' ? 1 : q.difficulty_tier === 'enhancement' ? 2 : 3,
      source: 'assessment_questions',
      school_name: null,
      exam_year: null,
      is_active: true,
      created_at: new Date().toISOString(),
      numeric_answer: isNumericAnswer(q.correct_answer),
    })
  }

  for (const q of (legacyRes.data ?? []) as Question[]) {
    if (byId.has(q.id)) continue
    byId.set(q.id, {
      ...q,
      correct_answer: '',
      numeric_answer: isNumericAnswer(q.correct_answer),
    })
  }

  const questions = questionIds
    .map((id) => byId.get(id))
    .filter((q): q is Row => !!q)

  if (!questions.length) notFound()

  return <PracticeFlow sessionId={params.sessionId} questions={questions} />
}
