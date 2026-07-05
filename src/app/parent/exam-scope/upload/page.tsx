import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ExamScopePickerForm from './UploadExamScopeForm'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function ExamScopeUploadPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()
  const { data: links } = await service
    .from('parent_student_relationships')
    .select('student_id')
    .eq('parent_id', user.id)
    .eq('is_active', true)

  const studentIds = (links ?? []).map((l) => l.student_id)
  const { data: children } = studentIds.length
    ? await service
        .from('student_profiles')
        .select('id, name, grade')
        .in('id', studentIds)
        .order('name')
    : { data: [] }

  const grades = Array.from(new Set((children ?? []).map((c) => c.grade).filter(Boolean))) as number[]

  const { data: units } = grades.length
    ? await service
        .from('curriculum_units')
        .select('id, grade, unit_number, name, semester')
        .in('grade', grades)
        .neq('unit_number', 999)
        .order('grade')
        .order('display_order')
    : { data: [] }

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#F7FBF9] to-white">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parent" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-xl font-bold">{translate('設定考試範圍', lang)}</h1>
      </div>

      {!children?.length ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-400">{translate('尚未關聯任何學生，請聯絡老師設定', lang)}</p>
        </div>
      ) : (
        <ExamScopePickerForm
          linkedChildren={(children ?? []).map((c) => ({ id: c.id, name: c.name, grade: c.grade }))}
          allUnits={(units ?? []).map((u) => ({
            id: u.id,
            grade: u.grade,
            unit_number: u.unit_number,
            name: u.name,
            semester: u.semester as 'A' | 'B',
          }))}
        />
      )}
    </main>
  )
}
