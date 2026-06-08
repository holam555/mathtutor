import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import StudentHomeClient from './StudentHomeClient'
import MockExamLauncher from './MockExamLauncher'

const GRADE_LABEL: Record<number, string> = {
  3: '小三',
  4: '小四',
  5: '小五',
  6: '小六',
}
import {
  DAILY_GOAL,
  TROPHIES,
  nextTrophyToUnlock,
  getGreeting,
  type StudentStats,
} from '@/lib/trophies'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export default async function StudentHome() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('name, grade')
    .eq('id', user.id)
    .single()

  // Gamification stats via RPCs (all read-only, RLS-safe for self)
  const [
    { data: streakData },
    { data: todayAnsweredData },
    { data: weekDots },
    { data: totalCorrectData },
    { data: totalAnsweredData },
    { data: bestCat },
    { count: sessionCount },
    { count: wrongCount },
  ] = await Promise.all([
    supabase.rpc('get_student_streak', { p_student_id: user.id }),
    supabase.rpc('get_today_answer_count', { p_student_id: user.id }),
    supabase.rpc('get_week_completion', { p_student_id: user.id }),
    supabase.rpc('get_student_total_correct', { p_student_id: user.id }),
    supabase.rpc('get_student_total_answered', { p_student_id: user.id }),
    supabase.rpc('get_student_best_category', { p_student_id: user.id }),
    supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .not('completed_at', 'is', null),
    supabase
      .from('wrong_question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('is_resolved', false),
  ])

  const streak = (streakData as number) ?? 0
  const todayAnswered = (todayAnsweredData as number) ?? 0
  const weekDotsArr = (weekDots as { day_offset: number; has_practice: boolean }[] | null) ?? []
  const totalCorrect = (totalCorrectData as number) ?? 0
  const totalAnswered = (totalAnsweredData as number) ?? 0
  const best = (bestCat as { category_name: string; accuracy: number; attempts: number }[] | null)?.[0]

  const studentStats: StudentStats = {
    totalAnswered,
    totalCorrect,
    streak,
    weekCompletionCount: weekDotsArr.filter((d) => d.has_practice).length,
    bestCategoryName: best?.category_name ?? null,
    bestCategoryAccuracy: Number(best?.accuracy ?? 0),
    bestCategoryAttempts: Number(best?.attempts ?? 0),
    sessionCount: sessionCount ?? 0,
  }

  const dailyProgress = Math.min(100, Math.round((todayAnswered / DAILY_GOAL) * 100))
  const dailyDone = todayAnswered >= DAILY_GOAL

  const unlockedTrophies = TROPHIES.map((t) => ({ def: t, status: t.check(studentStats) }))
  const unlockedCount = unlockedTrophies.filter((t) => t.status.unlocked).length
  const next = nextTrophyToUnlock(studentStats)

  const greeting = getGreeting()
  const todayIdx = (new Date().getDay() + 6) % 7 // Monday=0

  // Active exam scope (latest) — drives the 考試衝刺練習 card.
  const service = createServiceClient()
  const { data: examScope } = await service
    .from('exam_scopes')
    .select('id, exam_name, exam_date, unit_ids')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // SVG circle maths
  const size = 180
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progressOffset = circumference * (1 - dailyProgress / 100)

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto bg-gradient-to-b from-[#F7FBF9] to-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {greeting}，{profile?.name ?? '同學'} 👋
          </h1>
          {profile?.grade && (
            <p className="text-sm text-gray-400 mt-0.5">
              {GRADE_LABEL[profile.grade] ?? `小${profile.grade}`}
            </p>
          )}
        </div>
        <form action={signOut}>
          <button className="text-sm text-gray-400 underline">登出</button>
        </form>
      </div>

      {/* Daily goal ring */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#E8F4EF"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#1D9E75"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-[#1D9E75]">
                {todayAnswered}
                <span className="text-xl text-gray-400">/{DAILY_GOAL}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">今日目標</p>
            </div>
          </div>
          <p className={`mt-4 text-base font-semibold ${dailyDone ? 'text-[#1D9E75]' : 'text-gray-700'}`}>
            {dailyDone
              ? '🎉 今日任務完成！'
              : `再做 ${DAILY_GOAL - todayAnswered} 題完成今日目標！`}
          </p>
        </div>
      </div>

      {/* Weekly streak dots */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">本週練習</p>
          <p className="text-sm">
            <span className="font-bold text-[#EF9F27]">{streak}</span>
            <span className="text-xs text-gray-400 ml-1">連續天數 🔥</span>
          </p>
        </div>
        <div className="flex justify-between">
          {WEEKDAY_LABELS.map((label, i) => {
            const done = weekDotsArr.find((d) => d.day_offset === i)?.has_practice ?? false
            const isToday = i === todayIdx
            const bg = done
              ? isToday
                ? 'bg-[#1D9E75]'
                : 'bg-[#EF9F27]'
              : 'bg-gray-100'
            const textColor = done ? 'text-white' : 'text-gray-400'
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${bg} ${textColor} ${
                    isToday ? 'ring-2 ring-offset-2 ring-[#1D9E75]' : ''
                  }`}
                >
                  {done ? '✓' : label}
                </div>
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trophy shelf */}
      <Link href="/student/trophies" className="block bg-white rounded-3xl p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">我的獎杯</p>
          <p className="text-xs text-gray-400">
            {unlockedCount} / {TROPHIES.length} 解鎖
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {unlockedTrophies.slice(0, 6).map(({ def, status }) => (
            <div
              key={def.id}
              className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                status.unlocked
                  ? 'bg-gradient-to-br from-[#FFE7B5] to-[#FFCC66]'
                  : 'bg-gray-100 opacity-50 grayscale'
              }`}
              title={`${def.title} — ${status.progressText}`}
            >
              {def.emoji}
            </div>
          ))}
        </div>
      </Link>

      {/* Next trophy progress */}
      {next && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">下一個獎杯</p>
            <p className="text-xs font-semibold text-gray-700">
              {next.trophy.emoji} {next.trophy.title}
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1D9E75] to-[#4DC49C] rounded-full transition-all"
              style={{ width: `${next.status.progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{next.status.progressText}</p>
        </div>
      )}

      {/* Mock exam paper CTA (only if active exam_scope exists) */}
      {examScope && (
        <MockExamLauncher />
      )}

      {/* Start practice CTA */}
      <StudentHomeClient wrongCount={wrongCount ?? 0} studentId={user.id} />

      {/* Sub navigation */}
      <div className="mt-5 flex justify-center gap-5 text-xs">
        <Link href="/student/trophies" className="text-gray-400 underline">
          所有獎杯
        </Link>
        <Link href="/student/practice/select-category" className="text-gray-400 underline">
          按單元練習
        </Link>
      </div>
    </main>
  )
}
