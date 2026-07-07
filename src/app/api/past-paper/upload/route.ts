import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractQuestionsFromImages } from '@/lib/gemini'
import { detectFigures, pickDefaultCrop, type DetectResult } from '@/lib/figureDetect'

export const maxDuration = 60

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILES = 10
const MAX_FILE_SIZE_MB = 10

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }
  // Uploads award credits to the uploader's linked child — parent-only.
  if (user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: '只有家長可以上載 Past Paper' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const files = formData.getAll('images') as File[]
  const schoolName = (formData.get('school_name') as string | null) ?? ''
  const grade = parseInt((formData.get('grade') as string | null) ?? '')
  const examYear = parseInt((formData.get('exam_year') as string | null) ?? '')
  const examType = (formData.get('exam_type') as string | null) ?? ''

  if (!files.length || (files.length === 1 && files[0].size === 0)) {
    return NextResponse.json({ error: '請上傳至少一張圖片' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `最多上傳 ${MAX_FILES} 頁` }, { status: 400 })
  }

  const service = createServiceClient()
  const imagePaths: string[] = []
  const imageBuffers: { data: string; mimeType: string }[] = []

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `不支援的圖片格式：${file.type}` }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `圖片太大（最大 ${MAX_FILE_SIZE_MB}MB）` }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type

    // Upload to Supabase Storage. Derive ext from validated MIME type, not the
    // attacker-controlled filename, to avoid path-traversal / injection.
    const extFromMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    }
    const ext = extFromMime[mimeType] ?? 'jpg'
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await service.storage
      .from('past-papers')
      .upload(storagePath, buffer, { contentType: mimeType })

    if (uploadError) {
      return NextResponse.json(
        { error: `圖片上傳失敗：${uploadError.message}` },
        { status: 500 }
      )
    }

    imagePaths.push(storagePath)
    imageBuffers.push({ data: base64, mimeType })
  }

  // Analyze with Gemini Vision
  let extractedQuestions
  try {
    extractedQuestions = await extractQuestionsFromImages(imageBuffers, {
      school: schoolName || undefined,
      grade: isNaN(grade) ? undefined : grade,
      examType: examType || undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知錯誤'
    return NextResponse.json({ error: `AI 分析失敗：${message}` }, { status: 502 })
  }

  // ── CV figure detection per page ──────────────────────────────────────
  // Geometric detection replaces the old Gemini percent-bbox crop (which
  // guessed coordinates and was wrong more often than not — see
  // docs/figure_extraction_diagnosis.md). Nothing is cropped here: the
  // parent confirms/adjusts boxes on the next screen, and only confirmed
  // boxes become crop files.
  const rawBuffers = imageBuffers.map((img) => Buffer.from(img.data, 'base64'))
  const CV_MAX_WIDTH = 1500 // thresholds are calibrated for ~1000-1500px pages
  const cvFigures: Array<{
    page: number
    width: number
    height: number
    anchors: DetectResult['anchors']
    figures: DetectResult['figures']
  }> = []

  for (let pi = 0; pi < rawBuffers.length; pi++) {
    try {
      const meta = await sharp(rawBuffers[pi]).metadata()
      const origW = meta.width ?? CV_MAX_WIDTH
      const origH = meta.height ?? Math.round(origW * 1.4)
      const scale = origW > CV_MAX_WIDTH ? origW / CV_MAX_WIDTH : 1
      const cvBuffer = scale > 1
        ? await sharp(rawBuffers[pi]).resize({ width: CV_MAX_WIDTH }).toBuffer()
        : rawBuffers[pi]
      const det = await detectFigures(cvBuffer, { photoNormalise: true })
      // store boxes in ORIGINAL image coordinates so later cropping and
      // the review overlay never need to know about the CV downscale
      const up = (b: { x: number; y: number; w: number; h: number }) => ({
        x: Math.round(b.x * scale), y: Math.round(b.y * scale),
        w: Math.round(b.w * scale), h: Math.round(b.h * scale),
      })
      const scaled: DetectResult = {
        width: origW, height: origH,
        anchors: det.anchors.map((a) => ({ ...a, box: up(a.box) })),
        figures: det.figures.map((f) => ({ ...f, box: up(f.box) })),
      }
      cvFigures.push({ page: pi + 1, width: origW, height: origH,
        anchors: scaled.anchors, figures: scaled.figures })

      // ordinal binding suggestion: when the page's question count matches
      // its anchor count, question i gets band i+1's default crop
      const qsOnPage = extractedQuestions.filter((q) => (q.page_number ?? 1) === pi + 1)
      if (qsOnPage.length === scaled.anchors.length) {
        qsOnPage.forEach((q, qi2) => {
          const pick = pickDefaultCrop(scaled, qi2 + 1)
          if (q.has_image && pick) q.suggested_box = pick.box
        })
      }
    } catch {
      // CV failure is non-fatal — parent can still crop manually from the
      // full page in the review step
      cvFigures.push({ page: pi + 1, width: 0, height: 0, anchors: [], figures: [] })
    }
  }

  // Save record to DB
  const { data: record, error: insertError } = await service
    .from('past_paper_uploads')
    .insert({
      uploaded_by: user.id,
      school_name: schoolName || null,
      grade: isNaN(grade) ? null : grade,
      exam_year: isNaN(examYear) ? null : examYear,
      exam_type: examType || null,
      image_paths: imagePaths,
      ai_extracted_questions: extractedQuestions,
      cv_figures: cvFigures,
      review_status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: `儲存失敗：${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    id: record.id,
    extracted: extractedQuestions.length,
    // any figure question → send the parent to the crop-review step
    needsCropReview: extractedQuestions.some((q) => q.has_image),
  })
}
