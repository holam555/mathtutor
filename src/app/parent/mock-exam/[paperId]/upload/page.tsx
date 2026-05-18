import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import LqUploadForm from './LqUploadForm'

export default async function ParentLqUploadPage({
  params,
}: {
  params: { paperId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const service = createServiceClient()

  const { data: paper } = await service
    .from('mock_exam_papers')
    .select('id, student_id, lq_question_ids, created_at')
    .eq('id', params.paperId)
    .single()

  if (!paper) notFound()

  const { data: link } = await service
    .from('parent_student_relationships')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', paper.student_id)
    .eq('is_active', true)
    .maybeSingle()
  if (!link) redirect('/parent')

  const [{ data: student }, { data: lqs }, { data: existing }] = await Promise.all([
    service.from('student_profiles').select('name').eq('id', paper.student_id).single(),
    paper.lq_question_ids?.length
      ? service
          .from('long_questions')
          .select('id, question_text, total_marks')
          .in('id', paper.lq_question_ids)
      : Promise.resolve({ data: [] as Array<{ id: string; question_text: string; total_marks: number }> }),
    service
      .from('mock_exam_lq_submissions')
      .select('long_question_id, image_urls, ai_extracted_answer')
      .eq('paper_id', paper.id),
  ])

  type Lq = { id: string; question_text: string; total_marks: number }
  type Sub = { long_question_id: string; image_urls: string[] | null; ai_extracted_answer: string | null }

  const lqById = new Map<string, Lq>(((lqs ?? []) as Lq[]).map((q: Lq): [string, Lq] => [q.id, q]))
  const ordered: Lq[] = (paper.lq_question_ids ?? [])
    .map((id: string) => lqById.get(id))
    .filter((q: Lq | undefined): q is Lq => q != null)

  const existingByQ = new Map<string, Sub>(
    ((existing ?? []) as Sub[]).map((s: Sub): [string, Sub] => [s.long_question_id, s])
  )

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parent" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">📝 上載長答題答卷</h1>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 mb-5">
        <p className="text-sm text-gray-700">
          學生：<strong>{student?.name ?? ''}</strong>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          請逐題拍照上載學生嘅手寫答卷。每張圖片清晰可辨即可，AI 會自動辨識手寫內容。
        </p>
      </div>

      <div className="space-y-5">
        {ordered.map((q: Lq, idx: number) => (
          <LqUploadForm
            key={q.id}
            paperId={paper.id}
            longQuestionId={q.id}
            index={idx + 1}
            questionText={q.question_text}
            totalMarks={q.total_marks}
            existingImageCount={existingByQ.get(q.id)?.image_urls?.length ?? 0}
            existingTranscript={existingByQ.get(q.id)?.ai_extracted_answer ?? null}
          />
        ))}
      </div>

      {ordered.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">此試卷暫無長答題</p>
      )}
    </main>
  )
}
