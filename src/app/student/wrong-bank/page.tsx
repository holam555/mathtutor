import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAccuracy, type CategoryStat } from '@/lib/statsUtils'
import ProgressCircle from '@/components/ProgressCircle'
import WrongBankClient from './WrongBankClient'

export default async function WrongBankPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Unresolved wrong questions grouped by category
  const { data: wrongEntries } = await supabase
    .from('wrong_question_bank')
    .select('category_id, wrong_count, category:question_categories(name, code)')
    .eq('student_id', user.id)
    .eq('is_resolved', false)
    .order('wrong_count', { ascending: false })

  // 30-day category accuracy stats from answer_records
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

  // Aggregate wrong entries by category
  const categoryMap = new Map<
    string,
    { name: string; code: string; wrongCount: number }
  >()

  for (const entry of wrongEntries ?? []) {
    const cat = entry.category as unknown as { name: string; code: string } | null
    if (!cat || !entry.category_id) continue
    const existing = categoryMap.get(entry.category_id)
    if (existing) {
      existing.wrongCount += entry.wrong_count
    } else {
      categoryMap.set(entry.category_id, {
        name: cat.name,
        code: cat.code,
        wrongCount: entry.wrong_count,
      })
    }
  }

  const categories = Array.from(categoryMap.entries()).sort(
    (a, b) => b[1].wrongCount - a[1].wrongCount
  )

  // Total stats
  const totalWrong = categories.reduce((sum, [, c]) => sum + c.wrongCount, 0)

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">錯題庫</h1>
        {totalWrong > 0 && (
          <span className="ml-auto text-sm font-medium text-[#F44336] bg-red-50 px-3 py-1 rounded-full">
            {totalWrong} 次錯誤
          </span>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold text-gray-700">暫時沒有錯題</p>
          <p className="text-sm text-gray-400 mt-1">繼續保持！</p>
          <Link href="/student" className="mt-4 inline-block text-sm text-[#4A90E2] underline">
            返回主頁
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(([categoryId, info]) => {
            const stat = statsMap.get(categoryId)
            const accuracy = stat?.accuracy ?? null
            const totalAttempts = stat ? Number(stat.total_attempts) : 0

            return (
              <div key={categoryId} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Progress circle */}
                  <div className="shrink-0">
                    {accuracy !== null ? (
                      <ProgressCircle pct={accuracy} size={56} />
                    ) : (
                      <div className="w-14 h-14 rounded-full border-4 border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">未做</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {info.code} {info.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-[#F44336]">
                        {info.wrongCount} 次答錯
                      </span>
                      {totalAttempts > 0 && (
                        <span className="text-xs text-gray-400">
                          共 {totalAttempts} 次練習（30天）
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <WrongBankClient categoryId={categoryId} studentId={user.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
