import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import LqUploadForm from './LqUploadForm'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function ParentLqUploadPage({
  params,
}: {
  params: { paperId: string }
}) {
  const supabase = createClient()
  const lang = getLang()
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

  // Fetch the LQ texts for an at-a-glance reminder, and any existing
  // submission images so the parent can see what's already been uploaded.
  const [{ data: student }, { data: lqs }, { data: existing }] = await Promise.all([
    service.from('student_profiles').select('name').eq('id', paper.student_id).single(),
    paper.lq_question_ids?.length
      ? service
          .from('long_questions')
          .select('id, question_text')
          .in('id', paper.lq_question_ids)
      : Promise.resolve({ data: [] as Array<{ id: string; question_text: string }> }),
    service
      .from('mock_exam_lq_submissions')
      .select('image_urls')
      .eq('paper_id', paper.id)
      .limit(1),
  ])

  type Lq = { id: string; question_text: string }
  const lqById = new Map<string, Lq>(((lqs ?? []) as Lq[]).map((q): [string, Lq] => [q.id, q]))
  const ordered: Lq[] = (paper.lq_question_ids ?? [])
    .map((id: string) => lqById.get(id))
    .filter((q: Lq | undefined): q is Lq => q != null)

  // Every per-LQ submission row carries the same bundled image_paths in the
  // new flow, so it's enough to read one row to learn what's been uploaded.
  const existingPaths: string[] = (existing?.[0]?.image_urls ?? []) as string[]
  const signedExisting: string[] = await Promise.all(
    existingPaths.map(async (p: string): Promise<string> => {
      if (p.startsWith('https://')) return p
      const { data } = await service.storage.from('mock-exam-lq').createSignedUrl(p, 3600)
      return data?.signedUrl ?? p
    })
  )

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto paper-grid-light">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parent" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">📝 {translate('上載長答題答卷', lang)}</h1>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 mb-5">
        <p className="text-sm text-gray-700">
          {translate('學生：', lang)}<strong>{student?.name ?? ''}</strong>
        </p>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          {lang === 'en' ? (
            <>Photograph the answers to <strong>all {ordered.length} long-answer questions</strong> clearly — 1–2 photos uploaded together is fine. As long as each photo is legible, the teacher will grade from it.</>
          ) : (
            <>請拍清楚 <strong>所有 {ordered.length} 題長答題</strong> 的作答內容，可以分 1–2
            張相一次過上載。每張相清晰可辨即可，老師會根據相片批改。</>
          )}
        </p>
      </div>

      <LqUploadForm paperId={paper.id} existingPageUrls={signedExisting} />

      {ordered.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {lang === 'en'
              ? `Long-Answer Questions on the Paper (${ordered.length} total)`
              : `試卷上的長答題（共 ${ordered.length} 題）`}
          </p>
          <ol className="space-y-2 list-decimal list-inside">
            {ordered.map((q: Lq) => (
              <li key={q.id} className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-3 shadow-sm">
                {q.question_text.length > 80
                  ? q.question_text.slice(0, 80) + '…'
                  : q.question_text}
              </li>
            ))}
          </ol>
        </div>
      )}

      {ordered.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">{translate('此試卷暫無長答題', lang)}</p>
      )}
    </main>
  )
}
