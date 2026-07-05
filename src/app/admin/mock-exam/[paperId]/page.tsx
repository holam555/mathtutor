import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LqReviewCard from './LqReviewCard'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function MockExamReviewPage({
  params,
}: {
  params: { paperId: string }
}) {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const { data: paper } = await service
    .from('mock_exam_papers')
    .select('id, student_id, lq_question_ids, status, created_at, ai_comment')
    .eq('id', params.paperId)
    .single()

  if (!paper) notFound()

  const [{ data: student }, { data: lqs }, { data: subs }] = await Promise.all([
    service.from('student_profiles').select('id, name, grade').eq('id', paper.student_id).single(),
    paper.lq_question_ids?.length
      ? service
          .from('long_questions')
          .select('id, question_text, model_answer, image_url')
          .in('id', paper.lq_question_ids)
      : Promise.resolve({ data: [] as Array<{ id: string; question_text: string; model_answer: string; image_url: string | null }> }),
    service
      .from('mock_exam_lq_submissions')
      .select(
        'id, long_question_id, image_urls, ai_extracted_answer, teacher_corrected_answer, teacher_comment, reviewed_at'
      )
      .eq('paper_id', paper.id),
  ])

  type Lq = { id: string; question_text: string; model_answer: string; image_url: string | null }
  type Sub = {
    id: string
    long_question_id: string
    image_urls: string[] | null
    ai_extracted_answer: string | null
    teacher_corrected_answer: string | null
    teacher_comment: string | null
    reviewed_at: string | null
  }

  // Sign LQ image URLs and submission image URLs
  const signedLqs: Lq[] = await Promise.all(
    ((lqs ?? []) as Lq[]).map(async (q: Lq): Promise<Lq> => {
      const original = q.image_url
      if (!original) return q
      if (!original.startsWith('https://')) {
        const { data } = await service.storage.from('past-papers').createSignedUrl(original, 3600)
        return { ...q, image_url: data?.signedUrl ?? null }
      }
      return q
    })
  )

  const signedSubs = await Promise.all(
    ((subs ?? []) as Sub[]).map(async (s: Sub) => {
      const signed: string[] = await Promise.all(
        (s.image_urls ?? []).map(async (path: string): Promise<string> => {
          if (path.startsWith('https://')) return path
          const { data } = await service.storage.from('mock-exam-lq').createSignedUrl(path, 3600)
          return data?.signedUrl ?? path
        })
      )
      return { ...s, signed_image_urls: signed }
    })
  )

  type SignedSub = Sub & { signed_image_urls: string[] }
  const lqById = new Map<string, Lq>(signedLqs.map((q: Lq): [string, Lq] => [q.id, q]))
  const subByQ = new Map<string, SignedSub>(
    signedSubs.map((s: SignedSub): [string, SignedSub] => [s.long_question_id, s])
  )

  const ordered: Lq[] = (paper.lq_question_ids ?? [])
    .map((id: string) => lqById.get(id))
    .filter((q: Lq | undefined): q is Lq => q != null)

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/mock-exam" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">{translate('批改長答題', lang)}</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
        <p className="text-sm">
          <strong>{student?.name ?? ''}</strong>
          <span className="text-xs text-gray-500 ml-2">
            {translate(`小${['', '', '', '三', '四', '五', '六'][student?.grade ?? 0]}`, lang)} · {translate('試卷日期', lang)}{' '}
            {new Date(paper.created_at).toLocaleDateString('zh-Hant-HK')}
          </span>
        </p>
        {paper.ai_comment && (
          <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
            <span className="font-semibold">{translate('AI 評語：', lang)}</span>
            {paper.ai_comment}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {ordered.map((q: Lq, idx: number) => {
          const sub = subByQ.get(q.id)
          return (
            <LqReviewCard
              key={q.id}
              paperId={paper.id}
              submissionId={sub?.id ?? null}
              index={idx + 1}
              questionText={q.question_text}
              modelAnswer={q.model_answer}
              questionImageUrl={q.image_url}
              submissionImageUrls={sub?.signed_image_urls ?? []}
              aiExtractedAnswer={sub?.ai_extracted_answer ?? null}
              initialCorrectedAnswer={sub?.teacher_corrected_answer ?? null}
              initialComment={sub?.teacher_comment ?? null}
              isReviewed={!!sub?.reviewed_at}
            />
          )
        })}
      </div>

      {ordered.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">{translate('此試卷沒有長答題', lang)}</p>
      )}
    </main>
  )
}
