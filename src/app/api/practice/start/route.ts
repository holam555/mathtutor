import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Question } from '@/types/database'

const SESSION_SIZE = 10

/** Fisher-Yates shuffle — returns a new shuffled array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: { mode: string; category_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { mode, category_id } = body

  if (!['new', 'retry_wrong', 'category'].includes(mode)) {
    return NextResponse.json({ error: '無效的練習模式' }, { status: 400 })
  }

  let questions: Question[] = []

  // ── retry_wrong ──────────────────────────────────────────
  if (mode === 'retry_wrong') {
    const { data: wrongEntries } = await supabase
      .from('wrong_question_bank')
      .select('question_id, question_source')
      .eq('student_id', user.id)
      .eq('is_resolved', false)
      .order('wrong_count', { ascending: false })
      .limit(SESSION_SIZE)

    if (!wrongEntries?.length) {
      return NextResponse.json({ error: '沒有待重練的錯題' }, { status: 400 })
    }

    const questionIds = wrongEntries.map((e) => e.question_id)
    const { data: qs } = await supabase
      .from('questions')
      .select('*, category:question_categories(id, name, code)')
      .in('id', questionIds)
      .eq('is_active', true)

    questions = (qs ?? []) as Question[]

  // ── category ─────────────────────────────────────────────
  } else if (mode === 'category' && category_id) {
    // Fetch up to 50, shuffle in JS so every session is different
    const { data: qs } = await supabase
      .from('questions')
      .select('*, category:question_categories(id, name, code)')
      .eq('category_id', category_id)
      .eq('is_active', true)
      .limit(50)

    questions = shuffle((qs ?? []) as Question[]).slice(0, SESSION_SIZE)

  // ── new: mix weak categories + random ────────────────────
  } else {
    // Get category accuracy stats (last 30 days)
    const { data: statsRaw } = await supabase.rpc('get_student_category_stats', {
      p_student_id: user.id,
      p_days: 30,
    })

    type StatRow = { category_id: string; total_attempts: number; correct_count: number }
    const stats: StatRow[] = ((statsRaw as StatRow[] | null) ?? [])
      .map((s) => ({
        category_id: s.category_id,
        total_attempts: Number(s.total_attempts),
        correct_count: Number(s.correct_count),
      }))
      .sort((a, b) => {
        const accA = a.total_attempts > 0 ? a.correct_count / a.total_attempts : 1
        const accB = b.total_attempts > 0 ? b.correct_count / b.total_attempts : 1
        return accA - accB
      })

    const weakCategoryIds = stats.slice(0, 5).map((s) => s.category_id)

    // At most 30% of session from weak categories — the rest come from the full
    // random pool so the student always sees a variety of categories
    const WEAK_QUOTA = Math.floor(SESSION_SIZE * 0.3) // 3 out of 10

    // Fetch pool from weak categories
    let weakQuestions: Question[] = []
    if (weakCategoryIds.length > 0) {
      const { data: weakQs } = await supabase
        .from('questions')
        .select('*, category:question_categories(id, name, code)')
        .in('category_id', weakCategoryIds)
        .eq('is_active', true)
        .limit(40)
      weakQuestions = shuffle((weakQs ?? []) as Question[]).slice(0, WEAK_QUOTA)
    }

    // Fetch a large pool from ALL active questions, exclude already selected
    const weakIds = new Set(weakQuestions.map((q) => q.id))
    const { data: allQs } = await supabase
      .from('questions')
      .select('*, category:question_categories(id, name, code)')
      .eq('is_active', true)
      .limit(100)

    const randomPool = shuffle(
      ((allQs ?? []) as Question[]).filter((q) => !weakIds.has(q.id))
    )

    // Combine: a few from weak + rest random → gives variety across all categories
    questions = [...weakQuestions, ...randomPool].slice(0, SESSION_SIZE)
  }

  if (!questions.length) {
    return NextResponse.json({ error: '找不到題目，請老師先上傳題目' }, { status: 404 })
  }

  // Final shuffle (retry_wrong mode also benefits from shuffle)
  questions = shuffle(questions)

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('practice_sessions')
    .insert({
      student_id: user.id,
      session_type: mode,
      category_id: category_id ?? null,
      total_questions: questions.length,
      question_ids: questions.map((q) => q.id),
    })
    .select()
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: '無法建立練習記錄' }, { status: 500 })
  }

  return NextResponse.json({ session_id: session.id, questions })
}
