import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchExamPaper } from '@/lib/examPaper'
import ExamPaperSheet from '@/components/ExamPaperSheet'

export default async function StudentPrintExamPage() {
  const supabase = createClient()
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
        <p className="font-semibold text-gray-700">此考試範圍暫時沒有題目</p>
        <Link href="/student/practice/exam-sprint" className="text-sm text-[#1D9E75] underline">
          返回
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      {/* Back link (screen only) */}
      <div className="print:hidden px-6 pt-4">
        <Link href="/student/practice/exam-sprint" className="text-sm text-gray-400 hover:text-gray-600">
          ← 返回衝刺練習
        </Link>
      </div>
      <ExamPaperSheet studentName={profile?.name} paper={paper} />
    </main>
  )
}
