import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditQuestionForm from './EditQuestionForm'

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { grade?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const { data: question } = await service
    .from('assessment_questions')
    .select('id, topic_id, question_text, question_type, options, correct_answer, difficulty_tier, is_active')
    .eq('id', params.id)
    .single()

  if (!question) notFound()

  // Resolve the topic → unit → grade so we can pre-select the right grade
  const { data: topic } = await service
    .from('curriculum_topics')
    .select('id, unit_id, lesson_number, name')
    .eq('id', question.topic_id)
    .single()

  const { data: unit } = topic
    ? await service
        .from('curriculum_units')
        .select('id, grade, unit_number, name, semester')
        .eq('id', topic.unit_id)
        .single()
    : { data: null }

  const grade = parseInt(searchParams.grade ?? '') || (unit?.grade ?? 5)

  // Fetch all units + topics for the cascading selectors
  const { data: units } = await service
    .from('curriculum_units')
    .select('id, grade, unit_number, name, semester, display_order')
    .neq('unit_number', 999)
    .order('grade')
    .order('display_order')

  const { data: topics } = await service
    .from('curriculum_topics')
    .select('id, unit_id, lesson_number, name, display_order')
    .order('display_order')

  const backGrade = unit?.grade ?? grade

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/questions?grade=${backGrade}`} className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">編輯題目</h1>
        {unit && (
          <span className="text-sm text-gray-400">
            P{unit.grade} · U{unit.unit_number} {unit.name}
          </span>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <EditQuestionForm
          question={{
            id: question.id,
            topic_id: question.topic_id,
            question_text: question.question_text,
            question_type: question.question_type as string,
            options: (question.options as string[] | null) ?? null,
            correct_answer: question.correct_answer,
            difficulty_tier: question.difficulty_tier ?? 'basic',
          }}
          currentGrade={unit?.grade ?? grade}
          currentUnitId={unit?.id ?? ''}
          units={units ?? []}
          topics={topics ?? []}
        />
      </div>
    </main>
  )
}
