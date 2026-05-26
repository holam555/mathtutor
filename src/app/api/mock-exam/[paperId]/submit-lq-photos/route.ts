import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/mock-exam/[paperId]/submit-lq-photos
// body: { image_paths: string[] }
//
// Parent-facing endpoint for the simplified LQ-answer-sheet upload flow:
// instead of one photo per long question, the parent uploads 1–N pages
// (typically 1 or 2 phone photos) that together cover every LQ on the
// paper. We replicate the same image_urls into one row per LQ in
// mock_exam_lq_submissions — that way the existing teacher review UI
// (which reads per-LQ submissions) keeps working without changes.
//
// The previous per-LQ AI extraction step is skipped in this flow because
// the photos aren't 1:1 with questions. Teachers grade visually from
// the bundled photos.

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  let body: { image_paths?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const paths = body.image_paths
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: '請至少上載 1 張圖片' }, { status: 400 })
  }
  if (paths.length > 10) {
    return NextResponse.json({ error: '最多上載 10 張圖片' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: paper } = await service
    .from('mock_exam_papers')
    .select('id, student_id, lq_question_ids, status')
    .eq('id', params.paperId)
    .single()

  if (!paper) return NextResponse.json({ error: '試卷不存在' }, { status: 404 })

  // Auth: student themselves, or a linked parent
  if (paper.student_id !== user.id) {
    const { data: link } = await service
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', paper.student_id)
      .eq('is_active', true)
      .maybeSingle()
    if (!link) {
      return NextResponse.json({ error: '無權上載此試卷' }, { status: 403 })
    }
  }

  const lqIds = (paper.lq_question_ids ?? []) as string[]
  if (lqIds.length === 0) {
    return NextResponse.json({ error: '此試卷沒有長答題' }, { status: 400 })
  }

  // Mirror the bundled image_paths into every per-LQ submission row so
  // the teacher review UI (which iterates per long_question_id) sees the
  // same photos under each LQ. Upsert keeps re-uploads idempotent.
  const rows = lqIds.map((lqId) => ({
    paper_id: paper.id,
    long_question_id: lqId,
    image_urls: paths,
    // Wipe any stale AI transcript from the previous per-Q flow
    ai_extracted_answer: null,
  }))

  const { error: upsertErr } = await service
    .from('mock_exam_lq_submissions')
    .upsert(rows, { onConflict: 'paper_id,long_question_id' })

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  await service
    .from('mock_exam_papers')
    .update({ status: 'lq_uploaded' })
    .eq('id', paper.id)

  return NextResponse.json({
    ok: true,
    pages_uploaded: paths.length,
    lqs_covered: lqIds.length,
  })
}
