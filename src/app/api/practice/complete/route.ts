import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: { session_id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { session_id } = body

  // Recompute correct_count server-side — never trust the client.
  const { count: correct_count } = await supabase
    .from('answer_records')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session_id)
    .eq('student_id', user.id)
    .eq('is_correct', true)

  const { error } = await supabase
    .from('practice_sessions')
    .update({
      completed_at: new Date().toISOString(),
      correct_count: correct_count ?? 0,
    })
    .eq('id', session_id)
    .eq('student_id', user.id)

  if (error) {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
