import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DAILY_GOAL } from '@/lib/trophies'

export default async function ResultsPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: session } = await supabase
    .from('practice_sessions')
    .select('id, correct_count, student_id')
    .eq('id', params.sessionId)
    .eq('student_id', user.id)
    .single()

  if (!session) notFound()

  const starsEarned = session.correct_count ?? 0

  // Today's answer count to decide if daily goal was just hit
  const { data: todayCountData } = await supabase.rpc('get_today_answer_count', {
    p_student_id: user.id,
  })
  const todayAnswered = (todayCountData as number) ?? 0
  const dailyGoalMet = todayAnswered >= DAILY_GOAL

  return (
    <main className="min-h-screen px-5 py-10 max-w-md mx-auto bg-gradient-to-b from-[#F7FBF9] to-white flex flex-col items-center justify-center">
      {/* Headline */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{dailyGoalMet ? '🎉' : '💪'}</div>
        <h1 className="text-3xl font-bold text-[#1D9E75] mb-2">
          {dailyGoalMet ? '今日任務完成！' : '做得好！繼續加油！'}
        </h1>
        <p className="text-gray-500 text-sm">
          {dailyGoalMet
            ? '你已達成今日目標，太棒了！'
            : `今日已完成 ${todayAnswered} / ${DAILY_GOAL} 題`}
        </p>
      </div>

      {/* Stars earned */}
      <div className="bg-white rounded-3xl shadow-sm px-8 py-6 mb-8 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">今次獲得</p>
        <p className="text-5xl font-bold text-[#EF9F27] flex items-center justify-center gap-1">
          <span>⭐</span>
          <span>×</span>
          <span>{starsEarned}</span>
        </p>
      </div>

      {/* Action */}
      <Link
        href="/student"
        className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold text-center leading-[56px] active:scale-[0.98] transition shadow-md"
      >
        返回主頁
      </Link>
    </main>
  )
}
