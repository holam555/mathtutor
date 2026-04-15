export const DAILY_GOAL = 10

export type TrophyDef = {
  id: string
  emoji: string
  title: string
  description: string
  /** Compute whether unlocked given student stats. Returns { unlocked, progressPct, progressText } */
  check: (s: StudentStats) => TrophyStatus
}

export type StudentStats = {
  totalAnswered: number
  totalCorrect: number
  streak: number
  weekCompletionCount: number
  bestCategoryName: string | null
  bestCategoryAccuracy: number // 0..100
  bestCategoryAttempts: number
  sessionCount: number
}

export type TrophyStatus = {
  unlocked: boolean
  progressPct: number
  progressText: string
}

export const TROPHIES: TrophyDef[] = [
  {
    id: 'first_practice',
    emoji: '🏅',
    title: '初出茅廬',
    description: '完成第一次練習',
    check: (s) => ({
      unlocked: s.sessionCount >= 1,
      progressPct: s.sessionCount >= 1 ? 100 : 0,
      progressText: s.sessionCount >= 1 ? '已解鎖' : '完成 1 次練習',
    }),
  },
  {
    id: 'correct_10',
    emoji: '⭐',
    title: '答題新星',
    description: '累積答對 10 題',
    check: (s) => ({
      unlocked: s.totalCorrect >= 10,
      progressPct: Math.min(100, Math.round((s.totalCorrect / 10) * 100)),
      progressText: s.totalCorrect >= 10 ? '已解鎖' : `${s.totalCorrect} / 10`,
    }),
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    title: '火焰勳章',
    description: '連續 3 天完成練習',
    check: (s) => ({
      unlocked: s.streak >= 3,
      progressPct: Math.min(100, Math.round((s.streak / 3) * 100)),
      progressText: s.streak >= 3 ? '已解鎖' : `${s.streak} / 3 天`,
    }),
  },
  {
    id: 'total_50',
    emoji: '🌟',
    title: '進步之星',
    description: '累積完成 50 題',
    check: (s) => ({
      unlocked: s.totalAnswered >= 50,
      progressPct: Math.min(100, Math.round((s.totalAnswered / 50) * 100)),
      progressText: s.totalAnswered >= 50 ? '已解鎖' : `${s.totalAnswered} / 50`,
    }),
  },
  {
    id: 'streak_7',
    emoji: '💎',
    title: '鑽石之心',
    description: '連續 7 天完成練習',
    check: (s) => ({
      unlocked: s.streak >= 7,
      progressPct: Math.min(100, Math.round((s.streak / 7) * 100)),
      progressText: s.streak >= 7 ? '已解鎖' : `${s.streak} / 7 天`,
    }),
  },
  {
    id: 'total_100',
    emoji: '🏆',
    title: '百題達人',
    description: '累積完成 100 題',
    check: (s) => ({
      unlocked: s.totalAnswered >= 100,
      progressPct: Math.min(100, Math.round((s.totalAnswered / 100) * 100)),
      progressText: s.totalAnswered >= 100 ? '已解鎖' : `${s.totalAnswered} / 100`,
    }),
  },
  {
    id: 'best_category',
    emoji: '🎖️',
    title: '題型大師',
    description: '某題型表現非常出色',
    check: (s) => ({
      unlocked: s.bestCategoryAccuracy >= 80 && s.bestCategoryAttempts >= 10,
      progressPct: Math.min(100, Math.round(s.bestCategoryAccuracy)),
      progressText:
        s.bestCategoryAccuracy >= 80 && s.bestCategoryAttempts >= 10
          ? `已解鎖：${s.bestCategoryName ?? ''}`
          : '某題型表現穩定後解鎖',
    }),
  },
  {
    id: 'total_300',
    emoji: '👑',
    title: '練習冠軍',
    description: '累積完成 300 題',
    check: (s) => ({
      unlocked: s.totalAnswered >= 300,
      progressPct: Math.min(100, Math.round((s.totalAnswered / 300) * 100)),
      progressText: s.totalAnswered >= 300 ? '已解鎖' : `${s.totalAnswered} / 300`,
    }),
  },
]

/** Returns the first trophy that is not yet unlocked, for "next goal" hint */
export function nextTrophyToUnlock(s: StudentStats): { trophy: TrophyDef; status: TrophyStatus } | null {
  for (const t of TROPHIES) {
    const status = t.check(s)
    if (!status.unlocked) return { trophy: t, status }
  }
  return null
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return '早晨'
  if (hour < 18) return '下午好'
  return '晚上好'
}
