import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateVariations } from '@/lib/gemini'

const RATE_LIMIT_HOURS = 24

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: { category_id: string; parent_question_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { category_id, parent_question_id } = body
  if (!category_id) {
    return NextResponse.json({ error: '缺少 category_id' }, { status: 400 })
  }

  // Use service client for writes (bypasses RLS cleanly)
  const service = createServiceClient()

  // 1. Load variation template
  const { data: template } = await service
    .from('variation_templates')
    .select('id, template_prompt, last_generated_at')
    .eq('category_id', category_id)
    .single()

  if (!template) {
    return NextResponse.json({ error: '此分類尚未設定 variation 模板' }, { status: 404 })
  }

  // 2. Rate limiting: same category max once per 24 hours
  if (template.last_generated_at) {
    const hoursSince =
      (Date.now() - new Date(template.last_generated_at).getTime()) / (1000 * 60 * 60)
    if (hoursSince < RATE_LIMIT_HOURS) {
      const hoursLeft = Math.ceil(RATE_LIMIT_HOURS - hoursSince)
      return NextResponse.json(
        { error: `此分類已於近期生成，請 ${hoursLeft} 小時後再試`, rate_limited: true },
        { status: 429 }
      )
    }
  }

  // 3. Call Gemini
  let generatedQuestions
  try {
    generatedQuestions = await generateVariations(template.template_prompt, 5)
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知錯誤'
    return NextResponse.json({ error: `AI 生成失敗：${message}` }, { status: 502 })
  }

  if (!generatedQuestions.length) {
    return NextResponse.json({ error: 'AI 未生成任何題目' }, { status: 502 })
  }

  // 4. Save to generated_questions
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
    return NextResponse.json({ error: `儲存失敗：${insertError.message}` }, { status: 500 })
  }

  // 5. Update last_generated_at for rate limiting
  await service
    .from('variation_templates')
    .update({ last_generated_at: new Date().toISOString() })
    .eq('id', template.id)

  return NextResponse.json({
    success: true,
    generated: inserted?.length ?? generatedQuestions.length,
    category_id,
  })
}
