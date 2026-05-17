import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { matchScopeToUnits, type ScopeUnitCandidate, type ScopeTopicCandidate } from '@/lib/gemini'

export const maxDuration = 60

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
const MAX_FILES = 3
const MAX_FILE_SIZE_MB = 10

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: '未登入或無權上載' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const files = formData.getAll('images') as File[]
  const studentId = (formData.get('student_id') as string | null) ?? ''
  const examName = (formData.get('exam_name') as string | null) ?? ''
  const examDateRaw = (formData.get('exam_date') as string | null) ?? ''

  if (!studentId) {
    return NextResponse.json({ error: '請選擇子女' }, { status: 400 })
  }
  if (!files.length || (files.length === 1 && files[0].size === 0)) {
    return NextResponse.json({ error: '請上載至少一張相片' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `最多上載 ${MAX_FILES} 張相` }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify the parent is linked to this student + load grade
  const { data: link } = await service
    .from('parent_student_relationships')
    .select('student_id, is_active')
    .eq('parent_id', user.id)
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) {
    return NextResponse.json({ error: '此學生並未連結你的帳戶' }, { status: 403 })
  }

  const { data: child } = await service
    .from('student_profiles')
    .select('id, grade')
    .eq('id', studentId)
    .single()

  if (!child || !child.grade) {
    return NextResponse.json({ error: '找不到學生年級資料' }, { status: 404 })
  }

  // Load the authoritative curriculum lists for this grade.
  const { data: units } = await service
    .from('curriculum_units')
    .select('id, unit_number, name, semester')
    .eq('grade', child.grade)
    .neq('unit_number', 999) // exclude legacy bucket
    .order('display_order')

  if (!units || units.length === 0) {
    return NextResponse.json({ error: '尚未設定此年級的課程大綱' }, { status: 500 })
  }

  // For P3 we also surface lesson-level topics so the AI can pick more
  // precisely. For other grades each unit has only one placeholder topic
  // so we skip topics in the prompt.
  let topicCandidates: ScopeTopicCandidate[] = []
  if (child.grade === 3) {
    const { data: topics } = await service
      .from('curriculum_topics')
      .select('id, lesson_number, name, unit_id')
      .in('unit_id', units.map((u) => u.id))
      .order('display_order')
    topicCandidates = (topics ?? [])
      .filter((t) => t.lesson_number !== 999)
      .map((t) => ({
        topic_id: t.id,
        lesson_number: t.lesson_number,
        name: t.name,
        unit_id: t.unit_id,
      }))
  }

  const unitCandidates: ScopeUnitCandidate[] = units.map((u) => ({
    unit_id: u.id,
    unit_number: u.unit_number,
    name: u.name,
    semester: u.semester as 'A' | 'B',
  }))

  // Validate + upload images
  const imagePaths: string[] = []
  const imageBuffers: { data: string; mimeType: string }[] = []

  const extFromMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `不支援的圖片格式：${file.type}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `圖片太大（最大 ${MAX_FILE_SIZE_MB}MB）` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = extFromMime[file.type] ?? 'jpg'
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await service.storage
      .from('exam-scopes')
      .upload(storagePath, buffer, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json(
        { error: `相片上載失敗：${uploadError.message}` },
        { status: 500 }
      )
    }

    imagePaths.push(storagePath)
    imageBuffers.push({ data: buffer.toString('base64'), mimeType: file.type })
  }

  // Call Gemini Vision
  let match
  try {
    match = await matchScopeToUnits(
      imageBuffers,
      child.grade,
      unitCandidates,
      topicCandidates
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知錯誤'
    return NextResponse.json(
      { error: `AI 分析失敗：${message}` },
      { status: 502 }
    )
  }

  if (match.matched_unit_ids.length === 0 && match.matched_topic_ids.length === 0) {
    return NextResponse.json(
      { error: '相片入面認唔到任何單元，請試吓影清楚啲再上載' },
      { status: 422 }
    )
  }

  // If only topic_ids matched (P3 drill-down), derive the corresponding unit_ids
  let finalUnitIds = match.matched_unit_ids
  if (finalUnitIds.length === 0 && match.matched_topic_ids.length > 0) {
    const topicToUnit = new Map<string, string>(
      topicCandidates.map((t) => [t.topic_id, t.unit_id])
    )
    finalUnitIds = Array.from(
      new Set(
        match.matched_topic_ids
          .map((tid: string) => topicToUnit.get(tid))
          .filter((u: string | undefined): u is string => !!u)
      )
    )
  }

  if (finalUnitIds.length === 0) {
    return NextResponse.json(
      { error: '相片入面認唔到任何單元，請試吓影清楚啲再上載' },
      { status: 422 }
    )
  }

  // Auto-deactivate any prior active scope for this student so the home
  // card always reflects the latest exam scope.
  await service
    .from('exam_scopes')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('is_active', true)

  // Insert new scope
  const examDate = examDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(examDateRaw) ? examDateRaw : null

  const { data: scope, error: insertError } = await service
    .from('exam_scopes')
    .insert({
      student_id: studentId,
      uploaded_by: user.id,
      grade: child.grade,
      exam_name: examName || null,
      exam_date: examDate,
      image_paths: imagePaths,
      unit_ids: finalUnitIds,
      ai_raw: match as unknown as Record<string, unknown>,
      is_active: true,
    })
    .select('id')
    .single()

  if (insertError || !scope) {
    return NextResponse.json(
      { error: `儲存失敗：${insertError?.message ?? ''}` },
      { status: 500 }
    )
  }

  const matchedNames = units
    .filter((u) => finalUnitIds.includes(u.id))
    .map((u) => ({ unit_number: u.unit_number, name: u.name }))

  return NextResponse.json({
    success: true,
    scope_id: scope.id,
    matched_units: matchedNames,
  })
}
