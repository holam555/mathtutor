import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractLqHandwriting } from '@/lib/gemini'

// POST /api/mock-exam/[paperId]/extract
// body: { long_question_id: string, image_paths: string[] }
//
// Triggered by the parent upload page after a student's LQ answer photo(s)
// for a single long question are uploaded to the `mock-exam-lq` bucket.
// Downloads the photo(s), runs Gemini handwriting OCR, and writes the
// transcribed answer into mock_exam_lq_submissions.

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  let body: { long_question_id?: string; image_paths?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  if (!body.long_question_id || !Array.isArray(body.image_paths) || body.image_paths.length === 0) {
    return NextResponse.json({ error: '缺少 long_question_id 或 image_paths' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify the parent owns this paper through parent_student_relationships
  const { data: paper } = await service
    .from('mock_exam_papers')
    .select('id, student_id, lq_question_ids')
    .eq('id', params.paperId)
    .single()

  if (!paper) return NextResponse.json({ error: '試卷不存在' }, { status: 404 })

  if (paper.student_id !== user.id) {
    const { data: link } = await service
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', paper.student_id)
      .eq('is_active', true)
      .maybeSingle()
    if (!link) return NextResponse.json({ error: '無權上載此試卷' }, { status: 403 })
  }

  if (!paper.lq_question_ids?.includes(body.long_question_id)) {
    return NextResponse.json({ error: '此長答題不屬於此試卷' }, { status: 400 })
  }

  // Upsert the submission row first so we have something even if Gemini fails
  await service
    .from('mock_exam_lq_submissions')
    .upsert(
      {
        paper_id: paper.id,
        long_question_id: body.long_question_id,
        image_urls: body.image_paths,
      },
      { onConflict: 'paper_id,long_question_id' }
    )

  // Download images from private bucket → base64
  const images: { data: string; mimeType: string }[] = []
  for (const path of body.image_paths) {
    const { data: blob } = await service.storage.from('mock-exam-lq').download(path)
    if (!blob) continue
    const buf = Buffer.from(await blob.arrayBuffer())
    const mimeType = blob.type || 'image/jpeg'
    images.push({ data: buf.toString('base64'), mimeType })
  }

  let transcript = ''
  try {
    transcript = await extractLqHandwriting(images)
  } catch (e) {
    console.error('Gemini LQ extract failed:', e)
    return NextResponse.json({ error: '手寫辨識失敗，請稍後重試' }, { status: 500 })
  }

  await service
    .from('mock_exam_lq_submissions')
    .update({ ai_extracted_answer: transcript })
    .eq('paper_id', paper.id)
    .eq('long_question_id', body.long_question_id)

  // Flip paper status if all LQ submissions present
  const { data: submissions } = await service
    .from('mock_exam_lq_submissions')
    .select('long_question_id')
    .eq('paper_id', paper.id)

  const allUploaded =
    (submissions?.length ?? 0) >= (paper.lq_question_ids?.length ?? 0)
  if (allUploaded) {
    await service
      .from('mock_exam_papers')
      .update({ status: 'lq_uploaded' })
      .eq('id', paper.id)
  }

  return NextResponse.json({ ai_extracted_answer: transcript })
}
