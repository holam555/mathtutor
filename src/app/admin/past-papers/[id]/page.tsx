import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ReviewForm from './ReviewForm'
import type { ExtractedQuestion } from '@/lib/gemini'

export default async function PastPaperReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
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

  // Load categories for dropdown
  const { data: categories } = await service
    .from('question_categories')
    .select('id, name, code, grade, semester')
    .order('code')

  const extractedQuestions = (upload.ai_extracted_questions ?? []) as ExtractedQuestion[]

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/past-papers" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold">
            {upload.school_name ?? '未知學校'}
            {upload.grade ? ` · 小${upload.grade === 5 ? '五' : '六'}` : ''}
            {upload.exam_type ? ` · ${upload.exam_type}` : ''}
          </h1>
          <p className="text-sm text-gray-400">
            {upload.exam_year ? `${upload.exam_year} · ` : ''}
            {extractedQuestions.length} 條 AI 提取題目 ·{' '}
            {new Date(upload.created_at).toLocaleDateString('zh-HK')}
          </p>
        </div>
        {upload.review_status !== 'pending' && (
          <span className={`ml-auto text-sm font-medium px-3 py-1 rounded-full ${
            upload.review_status === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {upload.review_status === 'approved' ? '已批准' : '已拒絕'}
          </span>
        )}
      </div>

      <ReviewForm
        uploadId={params.id}
        uploadStatus={upload.review_status}
        signedUrls={signedUrls}
        extractedQuestions={extractedQuestions}
        categories={(categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          grade: c.grade,
          semester: c.semester,
        }))}
        uploadMeta={{
          school_name: upload.school_name,
          exam_year: upload.exam_year,
        }}
      />
    </main>
  )
}
