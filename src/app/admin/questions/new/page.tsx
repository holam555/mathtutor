import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewQuestionForm from './NewQuestionForm'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: { grade?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const defaultGrade = parseInt(searchParams.grade ?? '5')
  const validGrade = [3, 4, 5, 6].includes(defaultGrade) ? defaultGrade : 5

  const service = createServiceClient()

  // Fetch all grades' units + topics so the client can cascade without a server round-trip
  const { data: units } = await service
    .from('curriculum_units')
    .select('id, grade, unit_number, name, semester, display_order')
    .neq('unit_number', 999)
    .order('grade')
    .order('display_order')

  const { data: topics } = await service
    .from('curriculum_topics')
    .select('id, unit_id, lesson_number, name, display_order')
    .order('display_order')

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/questions?grade=${validGrade}`} className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">{translate('新增題目', getLang())}</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <NewQuestionForm
          units={units ?? []}
          topics={topics ?? []}
          defaultGrade={validGrade}
        />
      </div>
    </main>
  )
}
