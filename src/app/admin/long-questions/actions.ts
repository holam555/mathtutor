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

export type LongQuestionFormState = {
  error?: string
  success?: boolean
  newId?: string
}

async function handleImage(
  service: ReturnType<typeof createServiceClient>,
  formData: FormData,
  id: string
): Promise<{ image_url: string | null } | null> {
  const clearImage = formData.get('clear_image') === '1'
  const imageFile = formData.get('image_file') as File | null

  if (clearImage) return { image_url: null }
  if (!imageFile || imageFile.size === 0) return null

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(imageFile.type)) throw new Error('不支援的圖片格式（只接受 JPG、PNG、WEBP）')
  if (imageFile.size > 5 * 1024 * 1024) throw new Error('圖片太大（最大 5MB）')

  const ext = imageFile.type === 'image/png' ? 'png' : imageFile.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `long-question-images/${id}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const { error: uploadErr } = await service.storage
    .from('past-papers')
    .upload(path, buffer, { contentType: imageFile.type, upsert: true })
  if (uploadErr) throw new Error(`圖片上傳失敗：${uploadErr.message}`)

  return { image_url: path }
}

function parseFields(formData: FormData) {
  const topic_id = formData.get('topic_id') as string | null
  const question_text = (formData.get('question_text') as string | null)?.trim()
  const model_answer = (formData.get('model_answer') as string | null)?.trim()
  const total_marks_raw = formData.get('total_marks') as string | null
  const difficulty_tier = formData.get('difficulty_tier') as string | null
  const notes = ((formData.get('notes') as string | null) ?? '').trim() || null

  if (!topic_id || !question_text || !model_answer || !total_marks_raw || !difficulty_tier) {
    return { error: '請填寫所有必填欄位' } as const
  }

  const total_marks = parseInt(total_marks_raw, 10)
  if (!Number.isFinite(total_marks) || total_marks <= 0) {
    return { error: '分數必須是大於 0 的整數' } as const
  }

  return { topic_id, question_text, model_answer, total_marks, difficulty_tier, notes }
}

export async function createLongQuestion(
  _prev: LongQuestionFormState,
  formData: FormData
): Promise<LongQuestionFormState> {
  try {
    await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const parsed = parseFields(formData)
  if ('error' in parsed) return parsed

  const service = createServiceClient()

  const { data: inserted, error } = await service
    .from('long_questions')
    .insert({
      topic_id: parsed.topic_id,
      question_text: parsed.question_text,
      model_answer: parsed.model_answer,
      total_marks: parsed.total_marks,
      difficulty_tier: parsed.difficulty_tier,
      notes: parsed.notes,
      is_active: true,
      source_paper: 'manual',
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: `儲存失敗：${error?.message ?? '未知錯誤'}` }

  // Optional image upload (only on create when file present)
  try {
    const img = await handleImage(service, formData, inserted.id)
    if (img) {
      await service.from('long_questions').update(img).eq('id', inserted.id)
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : '圖片上傳失敗' }
  }

  revalidatePath('/admin/long-questions')
  return { success: true, newId: inserted.id }
}

export async function updateLongQuestion(
  questionId: string,
  _prev: LongQuestionFormState,
  formData: FormData
): Promise<LongQuestionFormState> {
  try {
    await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const parsed = parseFields(formData)
  if ('error' in parsed) return parsed

  const service = createServiceClient()

  let imagePatch: { image_url: string | null } | null = null
  try {
    imagePatch = await handleImage(service, formData, questionId)
  } catch (e) {
    return { error: e instanceof Error ? e.message : '圖片上傳失敗' }
  }

  const { error } = await service
    .from('long_questions')
    .update({
      topic_id: parsed.topic_id,
      question_text: parsed.question_text,
      model_answer: parsed.model_answer,
      total_marks: parsed.total_marks,
      difficulty_tier: parsed.difficulty_tier,
      notes: parsed.notes,
      ...(imagePatch ?? {}),
    })
    .eq('id', questionId)

  if (error) return { error: `儲存失敗：${error.message}` }

  revalidatePath('/admin/long-questions')
  revalidatePath(`/admin/long-questions/${questionId}`)
  return { success: true }
}

export async function toggleLongQuestionActive(questionId: string, isActive: boolean) {
  try {
    await assertTeacher()
  } catch {
    return { error: '權限不足' }
  }

  const service = createServiceClient()
  const { error } = await service
    .from('long_questions')
    .update({ is_active: isActive })
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/long-questions')
  return { success: true }
}
