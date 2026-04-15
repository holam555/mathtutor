'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type QuestionFormState = {
  error?: string
  success?: boolean
}

export async function createQuestion(
  _prev: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: '權限不足' }
  }

  const category_id = formData.get('category_id')
  const question_text = formData.get('question_text')
  const question_type = formData.get('question_type')
  const correct_answer = formData.get('correct_answer')
  const difficulty = formData.get('difficulty')

  if (
    typeof category_id !== 'string' ||
    typeof question_text !== 'string' ||
    typeof question_type !== 'string' ||
    typeof correct_answer !== 'string' ||
    typeof difficulty !== 'string'
  ) {
    return { error: '請填寫所有必填欄位' }
  }

  if (!category_id || !question_text.trim() || !correct_answer.trim()) {
    return { error: '請填寫所有必填欄位' }
  }

  // Parse options for multiple_choice
  let options: string[] | null = null
  if (question_type === 'multiple_choice') {
    const opts = ['A', 'B', 'C', 'D'].map((letter) => {
      const val = formData.get(`option_${letter}`)
      return typeof val === 'string' ? `${letter}. ${val.trim()}` : ''
    })
    if (opts.some((o) => !o.replace(/^[A-D]\. /, '').trim())) {
      return { error: '選擇題須填寫全部4個選項' }
    }
    options = opts
  }

  const { error } = await supabase.from('questions').insert({
    category_id,
    question_text: question_text.trim(),
    question_type,
    options,
    correct_answer: correct_answer.trim(),
    difficulty: parseInt(difficulty, 10),
    source: 'manual',
    is_active: true,
  })

  if (error) {
    return { error: `儲存失敗：${error.message}` }
  }

  revalidatePath('/admin/questions')
  return { success: true }
}

export async function toggleQuestionActive(questionId: string, isActive: boolean) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: '權限不足' }
  }

  const { error } = await supabase
    .from('questions')
    .update({ is_active: isActive })
    .eq('id', questionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/questions')
  return { success: true }
}
