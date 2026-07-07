import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ExtractedQuestion } from '@/lib/gemini'

export const maxDuration = 60

type CropChoice = {
  /** index into ai_extracted_questions */
  index: number
  /** original-page pixel coords; null = 呢題無圖 */
  box: { x: number; y: number; w: number; h: number } | null
}

/**
 * Path B step 2: the parent confirmed/adjusted figure boxes on the crop
 * review screen. Cut the confirmed boxes from the stored page images and
 * attach them to the extracted questions, then hand over to teacher review.
 * Only the uploader can do this, and only while the upload is pending.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  let body: { uploadId?: string; crops?: CropChoice[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }
  const { uploadId, crops } = body
  if (!uploadId || !Array.isArray(crops)) {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: upload } = await service
    .from('past_paper_uploads')
    .select('id, uploaded_by, review_status, image_paths, ai_extracted_questions')
    .eq('id', uploadId)
    .single()

  if (!upload) return NextResponse.json({ error: '找不到上載記錄' }, { status: 404 })
  if (upload.uploaded_by !== user.id) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }
  if (upload.review_status !== 'pending') {
    return NextResponse.json({ error: '此上載已完成審核，不能再修改' }, { status: 409 })
  }

  const questions = (upload.ai_extracted_questions ?? []) as ExtractedQuestion[]
  const imagePaths = (upload.image_paths ?? []) as string[]

  // download each page at most once
  const pageCache = new Map<number, Buffer>()
  async function pageBuffer(pageIdx: number): Promise<Buffer | null> {
    if (pageCache.has(pageIdx)) return pageCache.get(pageIdx)!
    const path = imagePaths[pageIdx]
    if (!path) return null
    const { data, error } = await service.storage.from('past-papers').download(path)
    if (error || !data) return null
    const buf = Buffer.from(await data.arrayBuffer())
    pageCache.set(pageIdx, buf)
    return buf
  }

  let cropped = 0
  for (const c of crops) {
    const q = questions[c.index]
    if (!q) continue
    if (!c.box) {
      // 家長剔咗「無圖」— clear any previous crop
      q.image_path = null
      q.image_url = null
      continue
    }
    const pageIdx = (q.page_number ?? 1) - 1
    const buf = await pageBuffer(pageIdx)
    if (!buf) continue
    try {
      const meta = await sharp(buf).metadata()
      const pw = meta.width ?? 0, ph = meta.height ?? 0
      const left = Math.max(0, Math.min(Math.round(c.box.x), pw - 10))
      const top = Math.max(0, Math.min(Math.round(c.box.y), ph - 10))
      const width = Math.max(10, Math.min(pw - left, Math.round(c.box.w)))
      const height = Math.max(10, Math.min(ph - top, Math.round(c.box.h)))
      const out = await sharp(buf)
        .extract({ left, top, width, height })
        .jpeg({ quality: 90 })
        .toBuffer()
      const cropPath = `${user.id}/crops/${Date.now()}-q${c.index}.jpg`
      const { error: upErr } = await service.storage
        .from('past-papers')
        .upload(cropPath, out, { contentType: 'image/jpeg' })
      if (!upErr) {
        q.image_path = cropPath
        q.image_url = null
        cropped++
      }
    } catch {
      // one bad box shouldn't sink the rest; the teacher can still fix it
    }
  }

  const { error: updErr } = await service
    .from('past_paper_uploads')
    .update({ ai_extracted_questions: questions, crops_confirmed: true })
    .eq('id', uploadId)

  if (updErr) return NextResponse.json({ error: `儲存失敗：${updErr.message}` }, { status: 500 })

  return NextResponse.json({ success: true, cropped })
}
