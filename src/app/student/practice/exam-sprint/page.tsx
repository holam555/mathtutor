import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ExamSprintClient from './ExamSprintClient'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function ExamSprintPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const service = createServiceClient()

  const { data: scope } = await service
    .from('exam_scopes')
    .select('id, exam_name, exam_date, unit_ids')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!scope || !scope.unit_ids?.length) {
    redirect('/student')
  }

  const { data: units } = await service
    .from('curriculum_units')
    .select('id, name, unit_number, display_order')
    .in('id', scope.unit_ids)
    .order('display_order')

  const unitIds = (units ?? []).map((u) => u.id)

  // Count active questions per unit
  const { data: topics } = unitIds.length
    ? await service
        .from('curriculum_topics')
        .select('id, unit_id')
        .in('unit_id', unitIds)
    : { data: [] as { id: string; unit_id: string }[] }

  const topicToUnit = new Map<string, string>()
  for (const t of topics ?? []) topicToUnit.set(t.id, t.unit_id)

  const { data: qs } = (topics ?? []).length
    ? await service
        .from('assessment_questions')
        .select('topic_id')
        .in('topic_id', (topics ?? []).map((t) => t.id))
        .eq('is_active', true)
    : { data: [] as { topic_id: string }[] }

  const countByUnit = new Map<string, number>()
  for (const q of qs ?? []) {
    const u = topicToUnit.get(q.topic_id)
    if (!u) continue
    countByUnit.set(u, (countByUnit.get(u) ?? 0) + 1)
  }

  const totalQuestions = Array.from(countByUnit.values()).reduce((s, v) => s + v, 0)

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto paper-grid-light">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold text-[#1F4D36]">🔥 {translate('考試衝刺練習', lang)}</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-900/5 shadow-[0_1px_3px_rgba(16,24,40,0.08)] mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {translate('考試範圍', lang)}
        </p>
        {scope.exam_name && (
          <p className="text-base font-semibold text-gray-800 mb-1">{scope.exam_name}</p>
        )}
        {scope.exam_date && (
          <p className="text-xs text-gray-400 mb-2">{translate('考試日期：', lang)}{scope.exam_date}</p>
        )}
        <p className="text-xs text-gray-500">
          {lang === 'en' ? `${units?.length ?? 0} units · ${totalQuestions} questions available` : `共 ${units?.length ?? 0} 個單元 · ${totalQuestions} 條題目可練`}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 ring-1 ring-gray-900/5 shadow-[0_1px_3px_rgba(16,24,40,0.08)] mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {translate('範圍單元', lang)}
        </p>
        <div className="space-y-2">
          {(units ?? []).map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between border-b last:border-b-0 border-gray-50 py-2"
            >
              <p className="text-sm text-gray-800">
                {translate('單元', lang)} {u.unit_number}：{u.name}
              </p>
              <span className="text-xs text-gray-400">{countByUnit.get(u.id) ?? 0} {translate('題', lang)}</span>
            </div>
          ))}
        </div>
      </div>

      <ExamSprintClient studentId={user.id} />

      <p className="text-center text-xs text-gray-400 mt-4">
        {translate('每次抽 15 題，涵蓋上面所有範圍', lang)}
      </p>

      <div className="mt-5 text-center">
        <Link
          href="/student/practice/exam-sprint/print"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          🖨 {translate('列印練習卷', lang)}
        </Link>
      </div>
    </main>
  )
}
