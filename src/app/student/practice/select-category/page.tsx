import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAccuracy, type CategoryStat } from '@/lib/statsUtils'
import ProgressCircle from '@/components/ProgressCircle'
import CategoryPracticeClient from './CategoryPracticeClient'

type CategoryWithCount = {
  id: string
  name: string
  code: string
  grade: number
  semester: string
  question_count: number
}

type SemesterGroup = {
  label: string
  categories: CategoryWithCount[]
}

export default async function SelectCategoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Categories with active question counts
  const { data: allCategories } = await supabase
    .from('question_categories')
    .select('id, name, code, grade, semester')
    .order('grade')
    .order('semester')
    .order('code')

  // Count active questions per category
  const { data: questionCounts } = await supabase
    .from('questions')
    .select('category_id')
    .eq('is_active', true)

  const countMap = new Map<string, number>()
  for (const q of questionCounts ?? []) {
    countMap.set(q.category_id, (countMap.get(q.category_id) ?? 0) + 1)
  }

  const categories: CategoryWithCount[] = (allCategories ?? [])
    .map((c) => ({ ...c, question_count: countMap.get(c.id) ?? 0 }))
    .filter((c) => c.question_count > 0)

  // 30-day category accuracy stats
  const { data: statsRaw } = await supabase.rpc('get_student_category_stats', {
    p_student_id: user.id,
    p_days: 30,
  })

  const statsMap = new Map<string, CategoryStat>(
    ((statsRaw as CategoryStat[] | null) ?? []).map((s) => [
      s.category_id,
      { ...s, accuracy: computeAccuracy(Number(s.correct_count), Number(s.total_attempts)) },
    ])
  )

  // Group by grade + semester
  const groupMap = new Map<string, CategoryWithCount[]>()
  for (const cat of categories) {
    const key = `小${cat.grade === 5 ? '五' : '六'}${cat.semester}學期`
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(cat)
  }

  const groups: SemesterGroup[] = Array.from(groupMap.entries()).map(([label, cats]) => ({
    label,
    categories: cats,
  }))

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">按題型練習</h1>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-400">暫時沒有題目，請等老師上傳</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.categories.map((cat) => {
                  const stat = statsMap.get(cat.id)
                  const accuracy = stat?.accuracy ?? null
                  const attempts = stat ? Number(stat.total_attempts) : 0

                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                    >
                      {/* Circle */}
                      <div className="shrink-0">
                        {accuracy !== null ? (
                          <ProgressCircle pct={accuracy} size={48} />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-300">新</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {cat.code} {cat.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cat.question_count} 題
                          {attempts > 0 && ` · 練習 ${attempts} 次`}
                        </p>
                      </div>

                      {/* Start button */}
                      <CategoryPracticeClient
                        categoryId={cat.id}
                        studentId={user.id}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
