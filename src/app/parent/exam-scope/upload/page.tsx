import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ExamScopePickerForm from './UploadExamScopeForm'

export default async function ExamScopeUploadPage() {
  const supabase = createClient()
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
        <h1 className="text-xl font-bold">設定考試範圍</h1>
      </div>

      <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-gray-700 leading-6 mb-3">
          請選擇子女本次考試涵蓋的數學單元。設定後，學生主頁將出現
          <span className="font-semibold text-[#1D9E75]">「模擬考試試卷」</span>。
        </p>
        <div className="bg-[#F7FBF9] border border-[#1D9E75]/15 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-[#1D9E75] mb-1.5">📝 一份完整模擬考試包含</p>
          <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
            <li>• <strong>多項選擇題</strong> + <strong>短答題</strong>：在 App 內作答，系統自動評分</li>
            <li>• <strong>長答題</strong>：以 PDF 提供，可列印或在 iPad 書寫</li>
            <li>• 全卷限時 <strong>50 分鐘</strong>，做完 App 部分計時暫停</li>
            <li>• 完成後家長拍照上載長答題答卷由老師批改</li>
          </ul>
        </div>
      </div>

      {!children?.length ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-400">尚未關聯任何學生，請聯絡老師設定</p>
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
