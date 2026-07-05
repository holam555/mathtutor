import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchExamPaper } from '@/lib/examPaper'
import ExamPaperSheet from '@/components/ExamPaperSheet'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function ParentPrintExamPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()

  // Verify parent-student link
  const { data: link } = await service
    .from('parent_student_relationships')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', params.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) redirect('/parent')

  const { data: profile } = await service
    .from('student_profiles')
    .select('name')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const paper = await fetchExamPaper(params.id)

  if (!paper) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-2xl">📋</p>
        <p className="font-semibold text-gray-700">{translate('尚未設定考試範圍，無法生成練習卷', lang)}</p>
        <Link
          href={`/parent/child/${params.id}?tab=scope`}
          className="text-sm text-[#1D9E75] underline"
        >
          {translate('設定考試範圍', lang)}
        </Link>
      </main>
    )
  }

  if (paper.questions.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-2xl">📋</p>
        <p className="font-semibold text-gray-700">{translate('此考試範圍暫時沒有題目', lang)}</p>
        <Link
          href={`/parent/child/${params.id}?tab=scope`}
          className="text-sm text-[#1D9E75] underline"
        >
          {translate('返回', lang)}
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      {/* Back link (screen only) */}
      <div className="print:hidden px-6 pt-4">
        <Link
          href={`/parent/child/${params.id}?tab=scope`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← {translate('返回考試範圍', lang)}
        </Link>
      </div>
      <ExamPaperSheet studentName={profile.name} paper={paper} />
    </main>
  )
}
