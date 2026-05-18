import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ToggleLongActive from './ToggleLongActive'

const GRADE_LABEL: Record<number, string> = { 3: 'P3', 4: 'P4', 5: 'P5', 6: 'P6' }
const TIER_LABEL: Record<string, string> = { basic: '易', enhancement: '中', advanced: '難' }
const TIER_COLOR: Record<string, string> = {
  basic: 'bg-green-100 text-green-700',
  enhancement: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

export default async function LongQuestionsPage({
  searchParams,
}: {
  searchParams: { grade?: string; unit_id?: string; active?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const grade = parseInt(searchParams.grade ?? '5')
  const validGrade = [3, 4, 5, 6].includes(grade) ? grade : 5
  const selectedUnitId = searchParams.unit_id ?? null
  const showInactive = searchParams.active === 'all'

  const { data: units } = await service
    .from('curriculum_units')
    .select('id, unit_number, name, semester, display_order')
    .eq('grade', validGrade)
    .neq('unit_number', 999)
    .order('display_order')

  const unitIds = selectedUnitId
    ? [selectedUnitId]
    : (units ?? []).map((u) => u.id)

  const { data: topics } = await service
    .from('curriculum_topics')
    .select('id, unit_id, lesson_number, name, display_order')
    .in('unit_id', unitIds)
    .order('display_order')

  const topicIds = (topics ?? []).map((t) => t.id)

  let qQuery = service
    .from('long_questions')
    .select('id, topic_id, question_text, total_marks, difficulty_tier, is_active, image_url, source_paper, notes')
    .in('topic_id', topicIds.length ? topicIds : ['00000000-0000-0000-0000-000000000000'])
    .order('topic_id')
    .order('difficulty_tier')
    .order('created_at')

  if (!showInactive) qQuery = qQuery.eq('is_active', true)

  const { data: questions } = await qQuery

  const topicToUnit = new Map((topics ?? []).map((t) => [t.id, t.unit_id]))
  type QRow = NonNullable<typeof questions>[number]
  const grouped = new Map<string, Map<string, QRow[]>>()
  for (const q of questions ?? []) {
    const unitId = topicToUnit.get(q.topic_id) ?? ''
    if (!grouped.has(unitId)) grouped.set(unitId, new Map())
    const byTopic = grouped.get(unitId)!
    if (!byTopic.has(q.topic_id)) byTopic.set(q.topic_id, [])
    byTopic.get(q.topic_id)!.push(q)
  }

  const displayedUnits = (units ?? []).filter((u) => grouped.has(u.id) || !selectedUnitId)
  const totalCount = (questions ?? []).length

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <h1 className="text-xl font-bold">長答題管理</h1>
          <span className="text-sm text-gray-400">({totalCount} 題)</span>
        </div>
        <Link
          href={`/admin/long-questions/new?grade=${validGrade}`}
          className="px-4 py-2 bg-[#4A90E2] text-white text-sm font-medium rounded-xl hover:bg-[#3a80d2] transition"
        >
          + 新增長答題
        </Link>
      </div>

      <p className="text-xs text-gray-500 bg-blue-50 rounded-xl px-4 py-3 mb-5">
        💡 長答題僅用於 <strong>模擬考試試卷</strong>，會以可列印的 PDF 形式提供畀學生，家長拍照上載學生答卷後 AI 會自動辨識手寫答案。
      </p>

      {/* Grade tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {[3, 4, 5, 6].map((g) => (
          <Link
            key={g}
            href={`/admin/long-questions?grade=${g}`}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition ${
              validGrade === g
                ? 'border-[#4A90E2] text-[#4A90E2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {GRADE_LABEL[g]}
          </Link>
        ))}
        <div className="flex-1" />
        <Link
          href={`/admin/long-questions?grade=${validGrade}${showInactive ? '' : '&active=all'}`}
          className="self-center text-xs text-gray-400 underline pb-2"
        >
          {showInactive ? '只顯示啟用' : '顯示全部（含停用）'}
        </Link>
      </div>

      {/* Unit chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Link
          href={`/admin/long-questions?grade=${validGrade}${showInactive ? '&active=all' : ''}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !selectedUnitId
              ? 'bg-[#4A90E2] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          全部單元
        </Link>
        {(units ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/admin/long-questions?grade=${validGrade}&unit_id=${u.id}${
              showInactive ? '&active=all' : ''
            }`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              selectedUnitId === u.id
                ? 'bg-[#4A90E2] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {u.unit_number}. {u.name}
          </Link>
        ))}
      </div>

      {totalCount === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          <p>此{selectedUnitId ? '單元' : '年級'}暫時沒有長答題</p>
          <Link
            href={`/admin/long-questions/new?grade=${validGrade}`}
            className="mt-3 inline-block text-sm text-[#4A90E2] underline"
          >
            新增第一條長答題
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedUnits.map((unit) => {
            const byTopic = grouped.get(unit.id)
            if (!byTopic) return null
            const unitTopics = (topics ?? []).filter((t) => t.unit_id === unit.id)
            return (
              <div key={unit.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-[#4A90E2] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {unit.unit_number}
                  </span>
                  <h2 className="font-semibold text-gray-800">{unit.name}</h2>
                  <span className="text-xs text-gray-400 ml-1">
                    {unit.semester === 'A' ? '上學期' : '下學期'}
                  </span>
                </div>

                <div className="space-y-4 pl-9">
                  {unitTopics.map((topic) => {
                    const qs = byTopic.get(topic.id)
                    if (!qs?.length) return null
                    return (
                      <div key={topic.id}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {topic.lesson_number}. {topic.name}
                          <span className="ml-2 font-normal normal-case">（{qs.length} 題）</span>
                        </p>
                        <div className="space-y-2">
                          {qs.map((q) => (
                            <div
                              key={q.id}
                              className={`bg-white rounded-xl shadow-sm border ${
                                q.is_active ? 'border-transparent' : 'border-gray-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 p-3.5">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                    <span className="text-xs text-gray-400">長答題</span>
                                    <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                      {q.total_marks} 分
                                    </span>
                                    {q.difficulty_tier && (
                                      <span
                                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                          TIER_COLOR[q.difficulty_tier] ?? 'bg-gray-100 text-gray-500'
                                        }`}
                                      >
                                        {TIER_LABEL[q.difficulty_tier]}
                                      </span>
                                    )}
                                    {q.image_url && (
                                      <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                                        🖼 圖
                                      </span>
                                    )}
                                    {!q.is_active && (
                                      <span className="text-xs text-gray-400 italic">已停用</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-800 line-clamp-2">{q.question_text}</p>
                                  {q.notes && (
                                    <p className="text-xs text-gray-400 mt-0.5">{q.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Link
                                    href={`/admin/long-questions/${q.id}?grade=${validGrade}`}
                                    className="text-xs text-[#4A90E2] underline"
                                  >
                                    編輯
                                  </Link>
                                  <ToggleLongActive questionId={q.id} isActive={q.is_active} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
