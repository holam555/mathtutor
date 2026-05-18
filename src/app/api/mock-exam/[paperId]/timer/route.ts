import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { computeElapsedSeconds, type TimerStatus } from '@/lib/mockExamTimer'

// POST /api/mock-exam/[paperId]/timer
// body: { action: 'start' | 'pause_for_lq' | 'resume' | 'finish' }

type Action = 'start' | 'pause_for_lq' | 'resume' | 'finish'
const VALID: Action[] = ['start', 'pause_for_lq', 'resume', 'finish']

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  let body: { action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  if (!body.action || !VALID.includes(body.action as Action)) {
    return NextResponse.json({ error: '無效的計時動作' }, { status: 400 })
  }
  const action = body.action as Action

  const service = createServiceClient()

  const { data: paper, error } = await service
    .from('mock_exam_papers')
    .select(
      'id, student_id, timer_started_at, timer_paused_at, timer_elapsed_seconds, timer_status, status'
    )
    .eq('id', params.paperId)
    .single()

  if (error || !paper) return NextResponse.json({ error: '試卷不存在' }, { status: 404 })
  if (paper.student_id !== user.id)
    return NextResponse.json({ error: '無權操作此試卷' }, { status: 403 })

  const now = new Date()
  const nowIso = now.toISOString()

  let nextStatus: TimerStatus = paper.timer_status
  let nextStartedAt: string | null = paper.timer_started_at
  let nextPausedAt: string | null = paper.timer_paused_at
  let nextElapsed: number = paper.timer_elapsed_seconds ?? 0

  if (action === 'start') {
    if (paper.timer_status !== 'not_started') {
      return NextResponse.json({ error: '計時已開始' }, { status: 400 })
    }
    nextStatus = 'running'
    nextStartedAt = nowIso
    nextPausedAt = null
    nextElapsed = 0
  } else if (action === 'pause_for_lq') {
    if (paper.timer_status !== 'running') {
      return NextResponse.json({ error: '計時不在運行中' }, { status: 400 })
    }
    nextElapsed = computeElapsedSeconds({
      timer_started_at: paper.timer_started_at,
      timer_paused_at: paper.timer_paused_at,
      timer_elapsed_seconds: paper.timer_elapsed_seconds ?? 0,
      timer_status: 'running',
    }, now)
    nextStatus = 'paused_for_lq'
    nextStartedAt = null
    nextPausedAt = nowIso
  } else if (action === 'resume') {
    if (paper.timer_status !== 'paused_for_lq') {
      return NextResponse.json({ error: '計時未暫停' }, { status: 400 })
    }
    nextStatus = 'running'
    nextStartedAt = nowIso
    nextPausedAt = null
  } else if (action === 'finish') {
    if (paper.timer_status === 'running' && paper.timer_started_at) {
      nextElapsed = computeElapsedSeconds({
        timer_started_at: paper.timer_started_at,
        timer_paused_at: paper.timer_paused_at,
        timer_elapsed_seconds: paper.timer_elapsed_seconds ?? 0,
        timer_status: 'running',
      }, now)
    }
    nextStatus = 'finished'
    nextStartedAt = null
    nextPausedAt = null
  }

  const { error: updateErr } = await service
    .from('mock_exam_papers')
    .update({
      timer_status: nextStatus,
      timer_started_at: nextStartedAt,
      timer_paused_at: nextPausedAt,
      timer_elapsed_seconds: nextElapsed,
    })
    .eq('id', params.paperId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({
    timer_status: nextStatus,
    timer_started_at: nextStartedAt,
    timer_paused_at: nextPausedAt,
    timer_elapsed_seconds: nextElapsed,
  })
}
