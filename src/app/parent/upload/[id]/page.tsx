import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ExtractedQuestion } from '@/lib/gemini'
import CropReview from './CropReview'

export const dynamic = 'force-dynamic'

/**
 * Path B crop-review screen: after upload + AI extraction, the parent
 * confirms which figure belongs to each 圖題 (default boxes come from CV
 * detection), adjusts boxes that are off, or marks 無圖. Only after this
 * do crops exist — the teacher then reviews as usual.
 */
export default async function CropReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()
  const { data: upload } = await service
    .from('past_paper_uploads')
    .select('id, uploaded_by, review_status, image_paths, ai_extracted_questions, cv_figures, crops_confirmed')
    .eq('id', params.id)
    .single()

  if (!upload || upload.uploaded_by !== user.id) redirect('/parent')

  const imagePaths = (upload.image_paths ?? []) as string[]
  const signedUrls: string[] = []
  for (const path of imagePaths) {
    const { data } = await service.storage
      .from('past-papers')
      .createSignedUrl(path, 3600)
    signedUrls.push(data?.signedUrl ?? '')
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <CropReview
        uploadId={upload.id}
        reviewStatus={upload.review_status}
        cropsConfirmed={!!upload.crops_confirmed}
        pageUrls={signedUrls}
        questions={(upload.ai_extracted_questions ?? []) as ExtractedQuestion[]}
        cvFigures={upload.cv_figures ?? []}
      />
    </main>
  )
}
