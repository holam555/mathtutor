import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ReviewForm from './ReviewForm'
import type { ExtractedQuestion } from '@/lib/gemini'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function PastPaperReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const service = createServiceClient()

  const { data: upload } = await service
    .from('past_paper_uploads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!upload) notFound()

  // Generate signed URLs for each image (1 hour expiry)
  const imagePaths: string[] = Array.isArray(upload.image_paths) ? upload.image_paths : []
  const signedUrls: string[] = []

  for (const path of imagePaths) {
    const { data } = await service.storage
      .from('past-papers')
      .createSignedUrl(path, 3600)
    if (data?.signedUrl) signedUrls.push(data.signedUrl)
  }

  // Load curriculum units + topics for the per-question topic picker.
  // (Approved questions now land in assessment_questions, which is keyed by
  // topic_id — the legacy question_categories dropdown is gone.)
  const [{ data: units }, { data: topics }] = await Promise.all([
    service
      .from('curriculum_units')
      .select('id, grade, unit_number, name, semester, display_order')
      .neq('unit_number', 999)
      .order('grade')
      .order('display_order'),
    service
      .from('curriculum_topics')
      .select('id, unit_id, lesson_number, name, display_order')
      .order('display_order'),
  ])

  const extractedQuestions = (upload.ai_extracted_questions ?? []) as ExtractedQuestion[]

  // Sign crop image URLs/paths — bucket is private so public URLs don't work.
  // Handles: (a) storage paths, (b) old broken public URLs already in the DB.
  const BUCKET_PUBLIC_PREFIX = '/object/public/past-papers/'
  function toCropPath(url: string): string | null {
    if (!url.startsWith('https://')) return url // already a plain path
    if (url.includes('token=')) return null      // already a valid signed URL
    const idx = url.indexOf(BUCKET_PUBLIC_PREFIX)
    if (idx !== -1) return decodeURIComponent(url.slice(idx + BUCKET_PUBLIC_PREFIX.length))
    return null
  }

  const signedExtractedQuestions = await Promise.all(
    extractedQuestions.map(async (q) => {
      if (!q.image_url) return q
      const path = toCropPath(q.image_url)
      if (!path) {
        // Already a signed URL — recover the raw path from the object key if possible.
        return { ...q, image_path: null }
      }
      const { data } = await service.storage
        .from('past-papers')
        .createSignedUrl(path, 3600)
      // image_url: signed, display only. image_path: raw, safe to persist.
      return { ...q, image_url: data?.signedUrl ?? null, image_path: path }
    })
  )

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/past-papers" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold">
            {upload.school_name ?? translate('未知學校', lang)}
            {upload.grade ? ` · ${translate(`小${{ 3: '三', 4: '四', 5: '五', 6: '六' }[upload.grade as 3|4|5|6] ?? upload.grade}`, lang)}` : ''}
            {upload.exam_type ? ` · ${upload.exam_type}` : ''}
          </h1>
          <p className="text-sm text-gray-400">
            {upload.exam_year ? `${upload.exam_year} · ` : ''}
            {extractedQuestions.length} {translate('條 AI 提取題目', lang)} ·{' '}
            {new Date(upload.created_at).toLocaleDateString('zh-HK')}
          </p>
        </div>
        {upload.review_status !== 'pending' && (
          <span className={`ml-auto text-sm font-medium px-3 py-1 rounded-full ${
            upload.review_status === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {translate(upload.review_status === 'approved' ? '已批准' : '已拒絕', lang)}
          </span>
        )}
      </div>

      <ReviewForm
        uploadId={params.id}
        uploadStatus={upload.review_status}
        signedUrls={signedUrls}
        extractedQuestions={signedExtractedQuestions}
        units={(units ?? []).map((u) => ({
          id: u.id,
          grade: u.grade,
          unit_number: u.unit_number,
          name: u.name,
          semester: u.semester as 'A' | 'B',
        }))}
        topics={(topics ?? []).map((tp) => ({
          id: tp.id,
          unit_id: tp.unit_id,
          lesson_number: tp.lesson_number,
          name: tp.name,
        }))}
        defaultGrade={typeof upload.grade === 'number' ? upload.grade : null}
        uploadMeta={{
          school_name: upload.school_name,
          exam_year: upload.exam_year,
        }}
      />
    </main>
  )
}
