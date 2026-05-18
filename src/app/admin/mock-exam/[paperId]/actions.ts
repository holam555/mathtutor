'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertTeacher() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') {
    throw new Error('權限不足')
  }
  return user
}

export async function saveLqReview(
  submissionId: string,
  paperId: string,
  formData: FormData
) {
  let user
  try {
    user = await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const teacher_corrected_answer = (formData.get('teacher_corrected_answer') as string | null)?.trim() ?? null
  const teacher_comment = (formData.get('teacher_comment') as string | null)?.trim() ?? null

  const service = createServiceClient()
  const { error } = await service
    .from('mock_exam_lq_submissions')
    .update({
      teacher_corrected_answer: teacher_corrected_answer || null,
      teacher_comment: teacher_comment || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  // If every LQ submission for this paper is reviewed, flip status
  const { data: subs } = await service
    .from('mock_exam_lq_submissions')
    .select('reviewed_at')
    .eq('paper_id', paperId)

  const allReviewed = (subs?.length ?? 0) > 0 && (subs ?? []).every((s) => s.reviewed_at)
  if (allReviewed) {
    await service.from('mock_exam_papers').update({ status: 'reviewed' }).eq('id', paperId)
  }

  revalidatePath(`/admin/mock-exam/${paperId}`)
  revalidatePath('/admin/mock-exam')
  return { success: true }
}
