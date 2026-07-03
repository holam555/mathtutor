import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ProgressCircle from '@/components/ProgressCircle'
import UnitPracticeClient from './UnitPracticeClient'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

type UnitRow = {
  id: string
  name: string
  unit_number: number
  semester: 'A' | 'B'
  display_order: number
  question_count: number
}

type SemesterGroup = {
  label: string
  units: UnitRow[]
}

const GRADE_LABEL: Record<number, string> = {
  3: '小三',
  4: '小四',
  5: '小五',
  6: '小六',
}

export default async function SelectUnitPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('grade')
    .eq('id', user.id)
    .single()

  const grade = profile?.grade ?? null

  // Service client for service-only curriculum + assessment tables.
  const service = createServiceClient()

  const { data: units } = grade
    ? await service
        .from('curriculum_units')
        .select('id, name, unit_number, semester, display_order')
        .eq('grade', grade)
        .neq('unit_number', 999)
        .order('display_order')
    : { data: [] as UnitRow[] }

  const unitIds = (units ?? []).map((u) => u.id)

  // Topics → unit map + count active assessment_questions per unit.
  const { data: topics } = unitIds.length
    ? await service
        .from('curriculum_topics')
        .select('id, unit_id')
        .in('unit_id', unitIds)
    : { data: [] as { id: string; unit_id: string }[] }

  const topicToUnit = new Map<string, string>()
  for (const t of topics ?? []) topicToUnit.set(t.id, t.unit_id)

  const topicIds = (topics ?? []).map((t) => t.id)
  const { data: qs } = topicIds.length
    ? await service
        .from('assessment_questions')
        .select('topic_id')
        .in('topic_id', topicIds)
        .eq('is_active', true)
    : { data: [] as { topic_id: string }[] }

  const countByUnit = new Map<string, number>()
  for (const q of qs ?? []) {
    const u = topicToUnit.get(q.topic_id)
    if (!u) continue
    countByUnit.set(u, (countByUnit.get(u) ?? 0) + 1)
  }

  const rows: UnitRow[] = (units ?? [])
    .map((u) => ({
      id: u.id,
      name: u.name,
      unit_number: u.unit_number,
      semester: u.semester as 'A' | 'B',
      display_order: u.display_order,
      question_count: countByUnit.get(u.id) ?? 0,
    }))
    .filter((u) => u.question_count > 0)

  // Last 30 days per-unit accuracy via service client (RPC is SECURITY DEFINER)
  const { data: statsRaw } = await service.rpc('get_student_unit_stats', {
    p_student_id: user.id,
    p_days: 30,
  })
  type UnitStat = {
    unit_id: string
    total_attempts: number
    correct_count: number
  }
  const statsMap = new Map<string, UnitStat>(
    ((statsRaw as UnitStat[] | null) ?? []).map((s) => [s.unit_id, s])
  )

  // Group by grade + semester
  const groupMap = new Map<string, UnitRow[]>()
  for (const u of rows) {
    const gLabel = grade ? translate(GRADE_LABEL[grade] ?? `小${grade}`, lang) : ''
    const semLabel = translate(u.semester === 'A' ? '上學期' : '下學期', lang)
    const key = `${gLabel}${semLabel}`
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(u)
  }
  const groups: SemesterGroup[] = Array.from(groupMap.entries()).map(([label, list]) => ({
    label,
    units: list,
  }))

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">{translate('按單元練習', lang)}</h1>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-400">{translate('暫時沒有題目，請聯絡老師', lang)}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.units.map((u) => {
                  const stat = statsMap.get(u.id)
                  const total = stat ? Number(stat.total_attempts) : 0
                  const correct = stat ? Number(stat.correct_count) : 0
                  const accuracy = total > 0 ? Math.round((correct / total) * 100) : null

                  return (
                    <div
                      key={u.id}
                      className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                    >
                      <div className="shrink-0">
                        {accuracy !== null ? (
                          <ProgressCircle pct={accuracy} size={48} />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-300">{translate('新', lang)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {translate('單元', lang)} {u.unit_number}：{u.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {u.question_count} {translate('題', lang)}
                          {total > 0 && ` · ${translate('練習', lang)} ${total} ${translate('次', lang)}`}
                        </p>
                      </div>

                      <UnitPracticeClient unitId={u.id} studentId={user.id} />
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
