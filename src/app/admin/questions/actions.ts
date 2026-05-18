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

export type QuestionFormState = {
  error?: string
  success?: boolean
}

export async function createQuestion(
  _prev: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  try {
    await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const topic_id = formData.get('topic_id') as string | null
  const question_text = (formData.get('question_text') as string | null)?.trim()
  const question_type = formData.get('question_type') as string | null
  const correct_answer = (formData.get('correct_answer') as string | null)?.trim()
  const difficulty_tier = formData.get('difficulty_tier') as string | null

  if (!topic_id || !question_text || !question_type || !correct_answer || !difficulty_tier) {
    return { error: '請填寫所有必填欄位' }
  }

  // Parse options for multiple_choice
  let options: string[] | null = null
  if (question_type === 'multiple_choice') {
    const opts = ['A', 'B', 'C', 'D'].map((letter) => {
      const val = (formData.get(`option_${letter}`) as string | null) ?? ''
      return `${letter}. ${val.trim()}`
    })
    if (opts.some((o) => o.replace(/^[A-D]\. /, '').trim() === '')) {
      return { error: '選擇題須填寫全部 4 個選項' }
    }
    options = opts
  }

  const service = createServiceClient()
  const { error } = await service.from('assessment_questions').insert({
    topic_id,
    question_text,
    question_type,
    options,
    correct_answer,
    difficulty_tier,
    is_active: true,
    source: 'manual',
  })

  if (error) return { error: `儲存失敗：${error.message}` }

  revalidatePath('/admin/questions')
  return { success: true }
}

export async function updateQuestion(
  questionId: string,
  _prev: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  try {
    await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const topic_id = formData.get('topic_id') as string | null
  const question_text = (formData.get('question_text') as string | null)?.trim()
  const question_type = formData.get('question_type') as string | null
  const correct_answer = (formData.get('correct_answer') as string | null)?.trim()
  const difficulty_tier = formData.get('difficulty_tier') as string | null

  if (!topic_id || !question_text || !question_type || !correct_answer || !difficulty_tier) {
    return { error: '請填寫所有必填欄位' }
  }

  let options: string[] | null = null
  if (question_type === 'multiple_choice') {
    const opts = ['A', 'B', 'C', 'D'].map((letter) => {
      const val = (formData.get(`option_${letter}`) as string | null) ?? ''
      return `${letter}. ${val.trim()}`
    })
    if (opts.some((o) => o.replace(/^[A-D]\. /, '').trim() === '')) {
      return { error: '選擇題須填寫全部 4 個選項' }
    }
    options = opts
  }

  const service = createServiceClient()
  const { error } = await service
    .from('assessment_questions')
    .update({ topic_id, question_text, question_type, options, correct_answer, difficulty_tier })
    .eq('id', questionId)

  if (error) return { error: `儲存失敗：${error.message}` }

  revalidatePath('/admin/questions')
  revalidatePath(`/admin/questions/${questionId}`)
  return { success: true }
}

export async function toggleQuestionActive(
  questionId: string,
  isActive: boolean,
  table: 'questions' | 'assessment_questions' = 'assessment_questions'
) {
  try {
    await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const service = createServiceClient()
  const { error } = await service
    .from(table)
    .update({ is_active: isActive })
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/questions')
  return { success: true }
}
