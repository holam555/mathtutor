import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { CurriculumUnit } from '@/types/assessment'

// GET /api/assessment/curriculum?grade=3
// Returns the unit/topic tree for the assessment unit-selection UI.
export async function GET(request: NextRequest) {
  const grade = parseInt(new URL(request.url).searchParams.get('grade') ?? '', 10)
  if (!grade) return NextResponse.json({ error: '請提供年級' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: units, error: uErr } = await supabase
    .from('curriculum_units')
    .select('id, name, textbook_ref, unit_number, semester, display_order')
    .eq('grade', grade)
    .order('display_order')

  if (uErr || !units) {
    console.error('Failed to load curriculum units:', uErr)
    return NextResponse.json({ error: '載入課程大綱失敗' }, { status: 500 })
  }

  if (units.length === 0) {
    return NextResponse.json({ units: [] satisfies CurriculumUnit[] })
  }

  const unitIds = units.map((u) => u.id)
  const { data: topics, error: tErr } = await supabase
    .from('curriculum_topics')
    .select('id, unit_id, name, lesson_number, display_order')
    .in('unit_id', unitIds)
    .order('display_order')

  if (tErr || !topics) {
    console.error('Failed to load curriculum topics:', tErr)
    return NextResponse.json({ error: '載入課程大綱失敗' }, { status: 500 })
  }

  // Group topics by unit_id
  const topicsByUnit = new Map<string, CurriculumUnit['topics']>()
  for (const t of topics) {
    if (!topicsByUnit.has(t.unit_id)) topicsByUnit.set(t.unit_id, [])
    topicsByUnit.get(t.unit_id)!.push({
      id: t.id,
      name: t.name,
      lesson_number: t.lesson_number,
      display_order: t.display_order,
    })
  }

  const tree: CurriculumUnit[] = units.map((u) => ({
    id: u.id,
    name: u.name,
    textbook_ref: u.textbook_ref,
    unit_number: u.unit_number,
    semester: u.semester as 'A' | 'B',
    display_order: u.display_order,
    topics: topicsByUnit.get(u.id) ?? [],
  }))

  return NextResponse.json({ units: tree })
}
