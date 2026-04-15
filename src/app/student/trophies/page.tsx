import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TROPHIES, type StudentStats } from '@/lib/trophies'

export default async function TrophiesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [
    { data: streakData },
    { data: totalCorrectData },
    { data: totalAnsweredData },
    { data: bestCat },
    { count: sessionCount },
    { data: weekDots },
  ] = await Promise.all([
    supabase.rpc('get_student_streak', { p_student_id: user.id }),
    supabase.rpc('get_student_total_correct', { p_student_id: user.id }),
    supabase.rpc('get_student_total_answered', { p_student_id: user.id }),
    supabase.rpc('get_student_best_category', { p_student_id: user.id }),
    supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .not('completed_at', 'is', null),
    supabase.rpc('get_week_completion', { p_student_id: user.id }),
  ])

  const best = (bestCat as { category_name: string; accuracy: number; attempts: number }[] | null)?.[0]
  const weekArr = (weekDots as { day_offset: number; has_practice: boolean }[] | null) ?? []

  const stats: StudentStats = {
    totalAnswered: (totalAnsweredData as number) ?? 0,
    totalCorrect: (totalCorrectData as number) ?? 0,
    streak: (streakData as number) ?? 0,
    weekCompletionCount: weekArr.filter((d) => d.has_practice).length,
    bestCategoryName: best?.category_name ?? null,
    bestCategoryAccuracy: Number(best?.accuracy ?? 0),
    bestCategoryAttempts: Number(best?.attempts ?? 0),
    sessionCount: sessionCount ?? 0,
  }

  const items = TROPHIES.map((t) => ({ def: t, status: t.check(stats) }))
  const unlockedCount = items.filter((i) => i.status.unlocked).length

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#F7FBF9] to-white">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 text-sm">← 返回</Link>
        <h1 className="text-xl font-bold">我的獎杯</h1>
        <span className="ml-auto text-sm text-gray-400">
          {unlockedCount} / {TROPHIES.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(({ def, status }) => (
          <div
            key={def.id}
            className={`rounded-2xl p-4 text-center transition ${
              status.unlocked
                ? 'bg-gradient-to-br from-[#FFE7B5] to-[#FFCC66] shadow-md'
                : 'bg-white shadow-sm'
            }`}
          >
            <div
              className={`text-5xl mb-2 ${status.unlocked ? '' : 'opacity-30 grayscale'}`}
            >
              {def.emoji}
            </div>
            <p
              className={`text-sm font-semibold ${
                status.unlocked ? 'text-gray-800' : 'text-gray-500'
              }`}
            >
              {def.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
            {!status.unlocked && (
              <>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D9E75] rounded-full"
                    style={{ width: `${status.progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{status.progressText}</p>
              </>
            )}
            {status.unlocked && (
              <p className="text-xs text-[#C87E10] mt-2 font-semibold">✓ 已解鎖</p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
