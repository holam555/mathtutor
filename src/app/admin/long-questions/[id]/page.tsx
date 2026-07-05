import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LongQuestionForm from '../LongQuestionForm'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function EditLongQuestionPage({
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
    .from('long_questions')
    .select('id, topic_id, question_text, model_answer, difficulty_tier, notes, image_url, is_active')
    .eq('id', params.id)
    .single()

  if (!question) notFound()

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

  // Sign image URL if stored as a private storage path
  let signedImageUrl: string | null = question.image_url ?? null
  if (signedImageUrl) {
    if (!signedImageUrl.startsWith('https://')) {
      const { data } = await service.storage.from('past-papers').createSignedUrl(signedImageUrl, 3600)
      signedImageUrl = data?.signedUrl ?? null
    } else if (signedImageUrl.includes('/object/public/past-papers/') && !signedImageUrl.includes('token=')) {
      const marker = '/object/public/past-papers/'
      const path = decodeURIComponent(signedImageUrl.slice(signedImageUrl.indexOf(marker) + marker.length))
      const { data } = await service.storage.from('past-papers').createSignedUrl(path, 3600)
      signedImageUrl = data?.signedUrl ?? null
    }
  }

  const backGrade = unit?.grade ?? grade

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/long-questions?grade=${backGrade}`} className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">{translate('編輯長答題', getLang())}</h1>
        {unit && (
          <span className="text-sm text-gray-400">
            P{unit.grade} · U{unit.unit_number} {unit.name}
          </span>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <LongQuestionForm
          question={{
            id: question.id,
            topic_id: question.topic_id,
            question_text: question.question_text,
            model_answer: question.model_answer,
            difficulty_tier: question.difficulty_tier,
            notes: question.notes ?? null,
            image_url: signedImageUrl,
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
