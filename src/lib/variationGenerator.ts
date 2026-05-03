// Shared variation-generation logic, callable from:
//   1) the public /api/variations/generate route (with teacher-only auth check)
//   2) the /api/practice/answer auto-trigger (server-internal, no auth needed)
//
// Centralising the logic here means the auto-trigger doesn't have to re-enter
// the HTTP route (which lets us put a strict teacher role check on the route
// without breaking the auto-trigger flow).

import { createServiceClient } from '@/lib/supabase/server'
import { generateVariations } from '@/lib/gemini'

const RATE_LIMIT_HOURS = 24

export type GenerateOutcome =
  | { ok: true; generated: number; category_id: string }
  | { ok: false; status: number; error: string; rate_limited?: boolean }

export async function generateVariationsForCategory(
  category_id: string,
  parent_question_id?: string | null,
): Promise<GenerateOutcome> {
  const service = createServiceClient()

  const { data: template } = await service
    .from('variation_templates')
    .select('id, template_prompt, last_generated_at')
    .eq('category_id', category_id)
    .single()

  if (!template) {
    return { ok: false, status: 404, error: '此分類尚未設定 variation 模板' }
  }

  if (template.last_generated_at) {
    const hoursSince =
      (Date.now() - new Date(template.last_generated_at).getTime()) / (1000 * 60 * 60)
    if (hoursSince < RATE_LIMIT_HOURS) {
      const hoursLeft = Math.ceil(RATE_LIMIT_HOURS - hoursSince)
      return {
        ok: false,
        status: 429,
        error: `此分類已於近期生成，請 ${hoursLeft} 小時後再試`,
        rate_limited: true,
      }
    }
  }

  let generatedQuestions
  try {
    generatedQuestions = await generateVariations(template.template_prompt, 5)
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知錯誤'
    return { ok: false, status: 502, error: `AI 生成失敗：${message}` }
  }

  if (!generatedQuestions.length) {
    return { ok: false, status: 502, error: 'AI 未生成任何題目' }
  }

  const rows = generatedQuestions.map((q) => ({
    category_id,
    parent_question_id: parent_question_id ?? null,
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

  if (insertError) {
    return { ok: false, status: 500, error: `儲存失敗：${insertError.message}` }
  }

  await service
    .from('variation_templates')
    .update({ last_generated_at: new Date().toISOString() })
    .eq('id', template.id)

  return { ok: true, generated: inserted?.length ?? generatedQuestions.length, category_id }
}
