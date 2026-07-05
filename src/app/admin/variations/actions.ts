'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { intToTier } from '@/lib/difficulty'

async function assertTeacher() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') {
    throw new Error('權限不足')
  }
  return user
}

export async function approveVariation(
  id: string,
  topicId: string,
  overrides?: {
    question_text?: string
    correct_answer?: string
    options?: string[] | null
    difficulty?: number
  }
) {
  const user = await assertTeacher()
  const service = createServiceClient()

  if (!topicId) return { error: '請先選擇小單元' }

  // Load the generated question
  const { data: gq } = await service
    .from('generated_questions')
    .select('*')
    .eq('id', id)
    .single()

  if (!gq) return { error: '找不到題目' }

  // Approved variations join the live bank (assessment_questions). The old
  // insert into the legacy `questions` table was a dead end — nothing has
  // served that table since practice moved to assessment_questions.
  const { error: insertError } = await service.from('assessment_questions').insert({
    topic_id: topicId,
    question_text: overrides?.question_text ?? gq.question_text,
    question_type: gq.question_type,
    options: overrides?.options !== undefined ? overrides.options : gq.options,
    correct_answer: overrides?.correct_answer ?? gq.correct_answer,
    difficulty_tier: intToTier(overrides?.difficulty ?? gq.difficulty ?? 2),
    source_paper: 'ai_variation',
    source_question: `gq:${id.slice(0, 8)}`,
    is_active: true,
  })

  if (insertError) return { error: insertError.message }

  // Mark as approved
  await service
    .from('generated_questions')
    .update({ is_approved: true, reviewed_by: user.id })
    .eq('id', id)

  revalidatePath('/admin/variations')
  revalidatePath('/admin/questions')
  return { success: true }
}

export async function rejectVariation(id: string) {
  const user = await assertTeacher()
  const service = createServiceClient()

  await service
    .from('generated_questions')
    .update({ is_rejected: true, reviewed_by: user.id })
    .eq('id', id)

  revalidatePath('/admin/variations')
  return { success: true }
}

export async function generateForCategory(categoryId: string) {
  await assertTeacher()

  const service = createServiceClient()
  const RATE_LIMIT_HOURS = 24

  // Load variation template
  const { data: template } = await service
    .from('variation_templates')
    .select('id, template_prompt, last_generated_at')
    .eq('category_id', categoryId)
    .single()

  if (!template) return { error: '此分類尚未設定 variation 模板' }

  // Rate limiting: same category max once per 24 hours
  if (template.last_generated_at) {
    const hoursSince =
      (Date.now() - new Date(template.last_generated_at).getTime()) / (1000 * 60 * 60)
    if (hoursSince < RATE_LIMIT_HOURS) {
      const hoursLeft = Math.ceil(RATE_LIMIT_HOURS - hoursSince)
      return { error: `此分類已於近期生成，請 ${hoursLeft} 小時後再試` }
    }
  }

  // Call Gemini directly (no HTTP round-trip, no cookie forwarding needed)
  const { generateVariations } = await import('@/lib/gemini')
  let generatedQuestions
  try {
    generatedQuestions = await generateVariations(template.template_prompt, 5)
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知錯誤'
    return { error: `AI 生成失敗：${message}` }
  }

  if (!generatedQuestions.length) return { error: 'AI 未生成任何題目' }

  // Save to generated_questions
  const rows = generatedQuestions.map((q) => ({
    category_id: categoryId,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options && q.options.length > 0 ? q.options : null,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty ?? 1,
    is_approved: false,
    is_rejected: false,
  }))

  const { data: inserted, error: insertError } = await service
    .from('generated_questions')
    .insert(rows)
    .select('id')

  if (insertError) return { error: `儲存失敗：${insertError.message}` }

  // Update last_generated_at for rate limiting
  await service
    .from('variation_templates')
    .update({ last_generated_at: new Date().toISOString() })
    .eq('id', template.id)

  revalidatePath('/admin/variations')
  return { success: true, generated: inserted?.length ?? generatedQuestions.length }
}
