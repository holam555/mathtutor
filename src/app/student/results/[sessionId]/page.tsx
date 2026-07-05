import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DAILY_GOAL, TROPHIES, type StudentStats } from '@/lib/trophies'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function ResultsPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: session } = await supabase
    .from('practice_sessions')
    .select('id, correct_count, total_questions, student_id, session_type')
    .eq('id', params.sessionId)
    .eq('student_id', user.id)
    .single()

  if (!session) notFound()

  // Mock-exam sessions have their own results page (MC+SQ score + AI
  // comment + 繼續計時 button for the LQ portion).
  if (session.session_type === 'mock_exam') {
    const { data: paper } = await supabase
      .from('mock_exam_papers')
      .select('id')
      .eq('mc_sq_session_id', session.id)
      .maybeSingle()
    if (paper) redirect(`/student/mock-exam/${paper.id}/results`)
  }

  const starsEarned = session.correct_count ?? 0
  const sessionTotal = session.total_questions ?? 0

  // Fetch current (post-session) stats
  const [
    { data: todayCountData },
    { data: totalCorrectData },
    { data: totalAnsweredData },
    { data: streakData },
    { data: weekDots },
    { data: bestCat },
    { count: sessionCount },
  ] = await Promise.all([
    supabase.rpc('get_today_answer_count', { p_student_id: user.id }),
    supabase.rpc('get_student_total_correct', { p_student_id: user.id }),
    supabase.rpc('get_student_total_answered', { p_student_id: user.id }),
    supabase.rpc('get_student_streak', { p_student_id: user.id }),
    supabase.rpc('get_week_completion', { p_student_id: user.id }),
    supabase.rpc('get_student_best_category', { p_student_id: user.id }),
    supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .not('completed_at', 'is', null),
  ])

  const todayAnswered = (todayCountData as number) ?? 0
  const dailyGoalMet = todayAnswered >= DAILY_GOAL

  const totalCorrect = (totalCorrectData as number) ?? 0
  const totalAnswered = (totalAnsweredData as number) ?? 0
  const streak = (streakData as number) ?? 0
  const weekDotsArr = (weekDots as { day_offset: number; has_practice: boolean }[] | null) ?? []
  const weekCompletionCount = weekDotsArr.filter((d) => d.has_practice).length
  const best = (bestCat as { category_name: string; accuracy: number; attempts: number }[] | null)?.[0]

  const afterStats: StudentStats = {
    totalAnswered,
    totalCorrect,
    streak,
    weekCompletionCount,
    bestCategoryName: best?.category_name ?? null,
    bestCategoryAccuracy: Number(best?.accuracy ?? 0),
    bestCategoryAttempts: Number(best?.attempts ?? 0),
    sessionCount: sessionCount ?? 0,
  }

  // Approximate pre-session stats by subtracting this session's contribution
  const beforeStats: StudentStats = {
    ...afterStats,
    totalAnswered: Math.max(0, totalAnswered - sessionTotal),
    totalCorrect: Math.max(0, totalCorrect - starsEarned),
    sessionCount: Math.max(0, (sessionCount ?? 0) - 1),
  }

  // Detect newly unlocked trophies this session
  const newlyUnlocked = TROPHIES.filter((t) => {
    const before = t.check(beforeStats)
    const after = t.check(afterStats)
    return !before.unlocked && after.unlocked
  })

  return (
    <main className="min-h-screen px-5 py-10 max-w-md mx-auto bg-gradient-to-b from-[#F7FBF9] to-white flex flex-col items-center justify-center">
      {/* Headline */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{dailyGoalMet ? '🎉' : '💪'}</div>
        <h1 className="text-3xl font-bold text-[#1D9E75] mb-2">
          {translate(dailyGoalMet ? '今日任務完成！' : '做得好！繼續加油！', lang)}
        </h1>
        <p className="text-gray-500 text-sm">
          {dailyGoalMet
            ? translate('你已達成今日目標，太棒了！', lang)
            : lang === 'en' ? `${todayAnswered} / ${DAILY_GOAL} done today` : `今日已完成 ${todayAnswered} / ${DAILY_GOAL} 題`}
        </p>
      </div>

      {/* Stars earned */}
      <div className="bg-white rounded-3xl shadow-sm px-8 py-6 mb-6 text-center w-full">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{translate('今次獲得', lang)}</p>
        <p className="text-5xl font-bold text-[#EF9F27] flex items-center justify-center gap-1">
          <span>⭐</span>
          <span>×</span>
          <span>{starsEarned}</span>
        </p>
      </div>

      {/* New trophy banner */}
      {newlyUnlocked.length > 0 && (
        <div className="w-full bg-gradient-to-r from-[#FFE7B5] to-[#FFCC66] rounded-2xl px-5 py-4 mb-6 shadow-sm">
          <p className="text-sm font-bold text-[#8B6000] mb-2">🏅 {translate('新獎杯解鎖！', lang)}</p>
          <div className="flex flex-col gap-1.5">
            {newlyUnlocked.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[#5C3D00]">{t.title}</p>
                  <p className="text-xs text-[#7A5200]">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <Link
        href="/student"
        className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold text-center leading-[56px] active:scale-[0.98] transition shadow-md"
      >
        {translate('返回主頁', lang)}
      </Link>
    </main>
  )
}
