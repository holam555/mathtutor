import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractQuestionsFromImages } from '@/lib/gemini'

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
  })
}
