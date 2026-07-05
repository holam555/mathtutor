import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { computeAccuracy } from '@/lib/statsUtils'
import { statusBadge, getInitial } from '@/lib/studentReport'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

type StudentRow = {
  student_id: string
  student_name: string
  grade: number | null
  session_count: number
  total_answers: number
  correct_answers: number
  wrong_unresolved: number
}

type WeakCategory = {
  category_id: string
  category_code: string
  category_name: string
  total_attempts: number
  accuracy: number
}

export default async function AdminStudentsPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  // All students with aggregate stats
  const { data: studentsRaw } = await service.rpc('get_all_students_stats')
  const students: StudentRow[] = ((studentsRaw as StudentRow[] | null) ?? []).map((s) => ({
    ...s,
    session_count: Number(s.session_count),
    total_answers: Number(s.total_answers),
    correct_answers: Number(s.correct_answers),
    wrong_unresolved: Number(s.wrong_unresolved),
  }))

  // Class weakest categories (7 days)
  const { data: weakRaw } = await service.rpc('get_class_weakest_categories', { p_days: 7 })
  const weakCategories: WeakCategory[] = ((weakRaw as WeakCategory[] | null) ?? []).map((w) => ({
    ...w,
    total_attempts: Number(w.total_attempts),
    accuracy: Number(w.accuracy),
  }))

  // Class averages
  const totalAnswers = students.reduce((s, x) => s + x.total_answers, 0)
  const totalCorrect = students.reduce((s, x) => s + x.correct_answers, 0)
  const classAvgAccuracy = computeAccuracy(totalCorrect, totalAnswers)
  const needFollowUp = students.filter((s) => {
    const acc = computeAccuracy(s.correct_answers, s.total_answers)
    return s.session_count < 3 || acc < 50
  }).length

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold">{translate('班級總覽', lang)}</h1>
        <span className="text-sm text-gray-400">({students.length} {translate('位學生', lang)})</span>
      </div>

      {/* Class metrics */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#4A90E2]">{classAvgAccuracy}%</p>
          <p className="text-xs text-gray-400 mt-1">{translate('全班平均正確率', lang)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-600">{needFollowUp}</p>
          <p className="text-xs text-gray-400 mt-1">{translate('需跟進學生', lang)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
          <p className="text-xs text-gray-400 mt-1">{translate('總學生數', lang)}</p>
        </div>
      </div>

      {/* Weakest categories */}
      {weakCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {translate('本週最弱題型 Top 3', lang)}
          </p>
          <div className="space-y-2">
            {weakCategories.map((w) => (
              <div key={w.category_id} className="flex items-center gap-3">
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                  {w.category_code}
                </span>
                <span className="text-sm text-gray-700 flex-1 truncate">{w.category_name}</span>
                <span className="text-sm font-semibold text-red-600 shrink-0">
                  {w.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student list */}
      {students.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm text-gray-400">
          {translate('暫時沒有學生數據', lang)}
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const accuracy = computeAccuracy(s.correct_answers, s.total_answers)
            const badge = statusBadge(accuracy, s.session_count)
            return (
              <Link
                key={s.student_id}
                href={`/admin/students/${s.student_id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#4A90E2]/10 text-[#4A90E2] font-bold flex items-center justify-center shrink-0">
                  {getInitial(s.student_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.student_name}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                      {translate(s.grade === 5 ? '小五' : s.grade === 6 ? '小六' : '小—', lang)}
                    </span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {s.session_count} {translate('次練習', lang)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {s.total_answers} {translate('題', lang)}
                    </span>
                    {s.total_answers > 0 && (
                      <span className="text-xs text-gray-500">
                        {translate('正確', lang)} {accuracy}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${badge.color}`}>
                  {translate(badge.label, lang)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
