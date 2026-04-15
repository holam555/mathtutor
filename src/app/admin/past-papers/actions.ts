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

export type ApprovedQuestion = {
  question_text: string
  question_type: 'multiple_choice' | 'fill_in' | 'calculation'
  options: string[] | null
  correct_answer: string
  category_id: string
  difficulty: number
  school_name: string | null
  exam_year: number | null
}

export async function approveUpload(uploadId: string, questions: ApprovedQuestion[]) {
  const user = await assertTeacher()
  const service = createServiceClient()

  if (questions.length > 0) {
    const rows = questions.map((q) => ({
      category_id: q.category_id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options && q.options.length > 0 ? q.options : null,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty,
      source: 'past_paper' as const,
      school_name: q.school_name,
      exam_year: q.exam_year,
      is_active: true,
    }))

    const { error } = await service.from('questions').insert(rows)
    if (error) return { error: error.message }
  }

  // Fetch upload to get uploader + page count for token award
  const { data: upload } = await service
    .from('past_paper_uploads')
    .select('uploaded_by, image_paths')
    .eq('id', uploadId)
    .single()

  await service
    .from('past_paper_uploads')
    .update({ review_status: 'approved', reviewed_by: user.id })
    .eq('id', uploadId)

  // Award tokens: 10 per page.
  // If uploader is a parent, route tokens to the first linked active student.
  // If uploader is themselves a student (legacy), award directly.
  if (upload?.uploaded_by) {
    const pageCount = Array.isArray(upload.image_paths) ? upload.image_paths.length : 0
    const tokenAmount = pageCount * 10
    if (tokenAmount > 0) {
      // Try: is uploader a student directly?
      const { data: studentProfile } = await service
        .from('student_profiles')
        .select('id')
        .eq('id', upload.uploaded_by)
        .maybeSingle()

      let targetStudentId: string | null = studentProfile?.id ?? null

      if (!targetStudentId) {
        // Parent uploader: find first linked active student
        const { data: link } = await service
          .from('parent_student_relationships')
          .select('student_id')
          .eq('parent_id', upload.uploaded_by)
          .eq('is_active', true)
          .order('created_at')
          .limit(1)
          .maybeSingle()
        targetStudentId = link?.student_id ?? null
      }

      if (targetStudentId) {
        await service.from('token_transactions').insert({
          student_id: targetStudentId,
          amount: tokenAmount,
          reason: 'past_paper_upload',
          reference_id: uploadId,
          created_by: user.id,
        })
        await service.rpc('increment_token_balance', {
          p_student_id: targetStudentId,
          p_amount: tokenAmount,
        })
      }
    }
  }

  revalidatePath('/admin/past-papers')
  return { success: true, saved: questions.length }
}

export async function rejectUpload(uploadId: string) {
  const user = await assertTeacher()
  const service = createServiceClient()

  await service
    .from('past_paper_uploads')
    .update({ review_status: 'rejected', reviewed_by: user.id })
    .eq('id', uploadId)

  revalidatePath('/admin/past-papers')
  return { success: true }
}
