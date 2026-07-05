import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchExamPaper } from '@/lib/examPaper'
import ExamPaperSheet from '@/components/ExamPaperSheet'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function StudentPrintExamPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('student_profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const paper = await fetchExamPaper(user.id)

  if (!paper) redirect('/student/practice/exam-sprint')

  if (paper.questions.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-2xl">📋</p>
        <p className="font-semibold text-gray-700">{translate('此考試範圍暫時沒有題目', lang)}</p>
        <Link href="/student/practice/exam-sprint" className="text-sm text-[#1D9E75] underline">
          {translate('返回', lang)}
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      {/* Back link (screen only) */}
      <div className="print:hidden px-6 pt-4">
        <Link href="/student/practice/exam-sprint" className="text-sm text-gray-400 hover:text-gray-600">
          ← {translate('返回衝刺練習', lang)}
        </Link>
      </div>
      <ExamPaperSheet studentName={profile?.name} paper={paper} />
    </main>
  )
}
