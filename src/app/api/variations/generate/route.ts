import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVariationsForCategory } from '@/lib/variationGenerator'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  // SECURITY: only teachers can hit this endpoint directly. The auto-trigger
  // from /api/practice/answer calls generateVariationsForCategory() in-process
  // (server-side, no HTTP) so it does not need to satisfy this check.
  if (user.user_metadata?.role !== 'teacher') {
    return NextResponse.json({ error: '只有老師可以生成 variation' }, { status: 403 })
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

  const result = await generateVariationsForCategory(category_id, parent_question_id)

  if (!result.ok) {
    const payload: Record<string, unknown> = { error: result.error }
    if (result.rate_limited) payload.rate_limited = true
    return NextResponse.json(payload, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    generated: result.generated,
    category_id: result.category_id,
  })
}
