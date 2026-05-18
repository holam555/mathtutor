import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 15

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: '未登入或無權操作' }, { status: 401 })
  }

  let body: { student_id?: string; unit_ids?: string[]; exam_name?: string | null; exam_date?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { student_id: studentId, unit_ids: unitIds, exam_name: examName, exam_date: examDateRaw } = body

  if (!studentId) return NextResponse.json({ error: '請選擇子女' }, { status: 400 })
  if (!unitIds?.length) return NextResponse.json({ error: '請最少選擇一個考試單元' }, { status: 400 })

  const service = createServiceClient()

  // Verify parent-child link
  const { data: link } = await service
    .from('parent_student_relationships')
    .select('student_id')
    .eq('parent_id', user.id)
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) return NextResponse.json({ error: '此學生並未連結你的帳戶' }, { status: 403 })

  // Load child's grade
  const { data: child } = await service
    .from('student_profiles')
    .select('id, grade')
    .eq('id', studentId)
    .single()

  if (!child?.grade) return NextResponse.json({ error: '找不到學生年級資料' }, { status: 404 })

  // Validate every submitted unit_id belongs to this grade
  const { data: validUnits } = await service
    .from('curriculum_units')
    .select('id, unit_number, name')
    .eq('grade', child.grade)
    .neq('unit_number', 999)
    .in('id', unitIds)

  if (!validUnits?.length) {
    return NextResponse.json({ error: '所選單元不屬於該學生的年級' }, { status: 400 })
  }

  // Only keep IDs that passed validation (drop any client-supplied garbage)
  const safeUnitIds = validUnits.map((u) => u.id)

  // Deactivate any prior active scope for this student
  await service
    .from('exam_scopes')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('is_active', true)

  const examDate =
    examDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(examDateRaw) ? examDateRaw : null

  const { error: insertError } = await service
    .from('exam_scopes')
    .insert({
      student_id: studentId,
      uploaded_by: user.id,
      grade: child.grade,
      exam_name: examName || null,
      exam_date: examDate,
      image_paths: [],
      unit_ids: safeUnitIds,
      ai_raw: null,
      is_active: true,
    })

  if (insertError) {
    return NextResponse.json({ error: `儲存失敗：${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
