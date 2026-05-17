import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import UploadExamScopeForm from './UploadExamScopeForm'

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

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#F7FBF9] to-white">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parent" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">上載考試範圍</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6 bg-white rounded-2xl p-4 shadow-sm leading-6">
        影低學校發嘅考試通告、或者課本目錄（喺要考嘅課題旁邊
        <span className="font-semibold text-[#1D9E75]">用筆剔起 ✓</span>
        ），AI 會自動識別涵蓋嘅單元，小朋友主頁就會出現
        <span className="font-semibold text-[#1D9E75]">「考試衝刺練習」</span>
        ，集中操練嗰啲範圍。
      </p>

      {!children?.length ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-400">
            尚未關聯任何學生，請聯絡老師設定
          </p>
        </div>
      ) : (
        <UploadExamScopeForm
          linkedChildren={children.map((c) => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
          }))}
        />
      )}
    </main>
  )
}
