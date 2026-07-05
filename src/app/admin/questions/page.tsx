import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ToggleActiveButton from './ToggleActiveButton'
import ToggleLongActive from '../long-questions/ToggleLongActive'
import { getLang } from '@/lib/i18n/getLang'
import { signQuestionImage } from '@/lib/storage'
import { t as translate } from '@/lib/i18n/translate'

const GRADE_LABEL: Record<number, string> = { 3: 'P3', 4: 'P4', 5: 'P5', 6: 'P6' }
const TIER_LABEL: Record<string, string> = {
  basic: '易',
  enhancement: '中',
  advanced: '難',
}
const TIER_COLOR: Record<string, string> = {
  basic: 'bg-green-100 text-green-700',
  enhancement: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

type Cat = 'mc' | 'sq' | 'lq'
const CAT_LABEL: Record<Cat, string> = {
  mc: '多項選擇題',
  sq: '短答題',
  lq: '長答題',
}
const CAT_ORDER: Cat[] = ['mc', 'sq', 'lq']

type UnifiedRow = {
  kind: Cat
  id: string
  topic_id: string
  question_text: string
  correct_answer: string | null
  difficulty_tier: string | null
  is_active: boolean
  image_url: string | null
  // assessment_questions only
  question_type?: string
  options?: unknown
  group_id?: string | null
  sub_order?: number | null
}

function inferCat(question_type: string): Cat {
  if (question_type === 'multiple_choice') return 'mc'
  // fill_in_number / fill_in / calculation all fall under 短答題
  return 'sq'
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { grade?: string; unit_id?: string; active?: string; cat?: string }
}) {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const grade = parseInt(searchParams.grade ?? '5')
  const validGrade = [3, 4, 5, 6].includes(grade) ? grade : 5
  const selectedUnitId = searchParams.unit_id ?? null
  const showInactive = searchParams.active === 'all'
  const catFilter: Cat | null = (['mc', 'sq', 'lq'] as const).includes(searchParams.cat as Cat)
    ? (searchParams.cat as Cat)
    : null

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
  const safeTopicIds = topicIds.length ? topicIds : ['00000000-0000-0000-0000-000000000000']

  // Fetch assessment_questions + long_questions in parallel
  let aqQuery = service
    .from('assessment_questions')
    .select(
      'id, topic_id, question_text, question_type, correct_answer, difficulty_tier, is_active, options, image_url, group_id, sub_order'
    )
    .in('topic_id', safeTopicIds)
    .order('topic_id')
    .order('group_id', { nullsFirst: false })
    .order('sub_order')
    .order('difficulty_tier')

  let lqQuery = service
    .from('long_questions')
    .select('id, topic_id, question_text, difficulty_tier, is_active, image_url')
    .in('topic_id', safeTopicIds)
    .order('topic_id')
    .order('difficulty_tier')
    .order('created_at')

  if (!showInactive) {
    aqQuery = aqQuery.eq('is_active', true)
    lqQuery = lqQuery.eq('is_active', true)
  }

  const [aqRes, lqRes] = await Promise.all([aqQuery, lqQuery])

  type AqRow = {
    id: string
    topic_id: string
    question_text: string
    question_type: string
    correct_answer: string
    difficulty_tier: string
    is_active: boolean
    options: unknown
    image_url: string | null
    group_id: string | null
    sub_order: number | null
  }
  type LqRow = {
    id: string
    topic_id: string
    question_text: string
    difficulty_tier: string
    is_active: boolean
    image_url: string | null
  }

  const allRows: UnifiedRow[] = []
  for (const q of (aqRes.data ?? []) as AqRow[]) {
    allRows.push({
      kind: inferCat(q.question_type),
      id: q.id,
      topic_id: q.topic_id,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      difficulty_tier: q.difficulty_tier,
      is_active: q.is_active,
      image_url: q.image_url,
      question_type: q.question_type,
      options: q.options,
      group_id: q.group_id,
      sub_order: q.sub_order,
    })
  }
  for (const q of (lqRes.data ?? []) as LqRow[]) {
    allRows.push({
      kind: 'lq',
      id: q.id,
      topic_id: q.topic_id,
      question_text: q.question_text,
      correct_answer: null,
      difficulty_tier: q.difficulty_tier,
      is_active: q.is_active,
      image_url: q.image_url,
    })
  }

  // Sign storage-path images for display (raw paths are what's persisted).
  await Promise.all(
    allRows.map(async (r) => {
      r.image_url = await signQuestionImage(service, r.image_url)
    })
  )

  const filtered = catFilter ? allRows.filter((r) => r.kind === catFilter) : allRows

  // Group: unit_id → topic_id → kind → rows[]
  const topicToUnit = new Map((topics ?? []).map((t) => [t.id, t.unit_id]))
  const grouped = new Map<string, Map<string, Map<Cat, UnifiedRow[]>>>()
  for (const q of filtered) {
    const unitId = topicToUnit.get(q.topic_id) ?? ''
    if (!grouped.has(unitId)) grouped.set(unitId, new Map())
    const byTopic = grouped.get(unitId)!
    if (!byTopic.has(q.topic_id)) byTopic.set(q.topic_id, new Map())
    const byKind = byTopic.get(q.topic_id)!
    if (!byKind.has(q.kind)) byKind.set(q.kind, [])
    byKind.get(q.kind)!.push(q)
  }

  const displayedUnits = (units ?? []).filter((u) => grouped.has(u.id) || !selectedUnitId)
  const totalCount = filtered.length

  const baseQs = (extra: string = '') =>
    `grade=${validGrade}${selectedUnitId ? `&unit_id=${selectedUnitId}` : ''}${
      showInactive ? '&active=all' : ''
    }${extra}`

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <h1 className="text-xl font-bold">{translate('題目管理', lang)}</h1>
          <span className="text-sm text-gray-400">({totalCount} {translate('題', lang)})</span>
        </div>
        <Link
          href={
            catFilter === 'lq'
              ? `/admin/long-questions/new?grade=${validGrade}`
              : `/admin/questions/new?grade=${validGrade}`
          }
          className="px-4 py-2 bg-[#4A90E2] text-white text-sm font-medium rounded-xl hover:bg-[#3a80d2] transition"
        >
          {lang === 'en'
            ? `+ Add ${catFilter === 'lq' ? 'Long-Answer Question' : 'Question'}`
            : `+ 新增${catFilter === 'lq' ? '長答題' : '題目'}`}
        </Link>
      </div>

      {/* Grade tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {[3, 4, 5, 6].map((g) => (
          <Link
            key={g}
            href={`/admin/questions?grade=${g}`}
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
          href={`/admin/questions?${baseQs(showInactive ? '' : '&active=all').replace(/^&/, '')}${
            catFilter ? `&cat=${catFilter}` : ''
          }`}
          className="self-center text-xs text-gray-400 underline pb-2"
        >
          {translate(showInactive ? '只顯示啟用' : '顯示全部（含停用）', lang)}
        </Link>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <Link
          href={`/admin/questions?${baseQs()}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !catFilter
              ? 'bg-[#4A90E2] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          {translate('全部題型', lang)}
        </Link>
        {CAT_ORDER.map((c) => (
          <Link
            key={c}
            href={`/admin/questions?${baseQs()}&cat=${c}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              catFilter === c
                ? 'bg-[#4A90E2] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {translate(CAT_LABEL[c], lang)}
          </Link>
        ))}
      </div>

      {/* Unit filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Link
          href={`/admin/questions?grade=${validGrade}${showInactive ? '&active=all' : ''}${
            catFilter ? `&cat=${catFilter}` : ''
          }`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !selectedUnitId
              ? 'bg-[#4A90E2] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          {translate('全部單元', lang)}
        </Link>
        {(units ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/admin/questions?grade=${validGrade}&unit_id=${u.id}${
              showInactive ? '&active=all' : ''
            }${catFilter ? `&cat=${catFilter}` : ''}`}
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

      {/* Questions grouped by unit → topic → category */}
      {totalCount === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          <p>{translate('此', lang)}{translate(selectedUnitId ? '單元' : '年級', lang)}{translate('暫時沒有題目', lang)}</p>
          <Link
            href={`/admin/questions/new?grade=${validGrade}`}
            className="mt-3 inline-block text-sm text-[#4A90E2] underline"
          >
            {translate('新增第一條題目', lang)}
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
                    {translate(unit.semester === 'A' ? '上學期' : '下學期', lang)}
                  </span>
                </div>

                <div className="space-y-4 pl-9">
                  {unitTopics.map((topic) => {
                    const byKind = byTopic.get(topic.id)
                    if (!byKind) return null
                    const topicTotal = Array.from(byKind.values()).reduce(
                      (s, arr) => s + arr.length,
                      0
                    )
                    if (topicTotal === 0) return null
                    return (
                      <div key={topic.id}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {topic.lesson_number}. {topic.name}
                          <span className="ml-2 font-normal normal-case">（{topicTotal} {translate('題', lang)}）</span>
                        </p>
                        <div className="space-y-4">
                          {CAT_ORDER.map((cat) => {
                            const rows = byKind.get(cat)
                            if (!rows?.length) return null
                            return (
                              <div key={cat}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                      cat === 'mc'
                                        ? 'bg-blue-100 text-blue-700'
                                        : cat === 'sq'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-orange-100 text-orange-700'
                                    }`}
                                  >
                                    {translate(CAT_LABEL[cat], lang)}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {rows.length} {translate('題', lang)}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {rows.map((q, qIdx) => {
                                    const isGroupStart =
                                      q.kind !== 'lq' &&
                                      q.group_id &&
                                      (qIdx === 0 || rows[qIdx - 1].group_id !== q.group_id)
                                    const isGroupMember = q.kind !== 'lq' && !!q.group_id
                                    const editHref =
                                      q.kind === 'lq'
                                        ? `/admin/long-questions/${q.id}?grade=${validGrade}`
                                        : `/admin/questions/${q.id}?grade=${validGrade}`
                                    return (
                                      <div
                                        key={q.id}
                                        className={`bg-white rounded-xl shadow-sm border ${
                                          q.is_active
                                            ? 'border-transparent'
                                            : 'border-gray-200 opacity-60'
                                        } ${isGroupMember && !isGroupStart ? 'border-l-2 border-l-blue-200 rounded-tl-none' : ''}`}
                                      >
                                        {isGroupStart && q.image_url && (
                                          <div className="px-3.5 pt-3 pb-1">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={q.image_url}
                                              alt={translate('題目圖片', lang)}
                                              className="max-h-40 rounded-lg border border-gray-100 object-contain"
                                            />
                                          </div>
                                        )}
                                        <div className="flex items-start justify-between gap-3 p-3.5">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                              {isGroupMember && (
                                                <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">
                                                  ({q.sub_order})
                                                </span>
                                              )}
                                              {q.difficulty_tier && (
                                                <span
                                                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                                    TIER_COLOR[q.difficulty_tier] ??
                                                    'bg-gray-100 text-gray-500'
                                                  }`}
                                                >
                                                  {translate(TIER_LABEL[q.difficulty_tier], lang)}
                                                </span>
                                              )}
                                              {!q.is_active && (
                                                <span className="text-xs text-gray-400 italic">
                                                  {translate('已停用', lang)}
                                                </span>
                                              )}
                                              {!isGroupMember && q.image_url && (
                                                <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                                                  🖼 {translate('圖', lang)}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-800 line-clamp-2">
                                              {q.question_text}
                                            </p>
                                            {q.correct_answer && (
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                {translate('答案', lang)}：{q.correct_answer}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                              href={editHref}
                                              className="text-xs text-[#4A90E2] underline"
                                            >
                                              {translate('編輯', lang)}
                                            </Link>
                                            {q.kind === 'lq' ? (
                                              <ToggleLongActive
                                                questionId={q.id}
                                                isActive={q.is_active}
                                              />
                                            ) : (
                                              <ToggleActiveButton
                                                questionId={q.id}
                                                isActive={q.is_active}
                                                table="assessment_questions"
                                              />
                                            )}
                                          </div>
                                        </div>
                                        {q.kind !== 'lq' && !isGroupMember && q.image_url && (
                                          <div className="px-3.5 pb-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={q.image_url}
                                              alt={translate('題目圖片', lang)}
                                              className="max-h-48 rounded-lg border border-gray-100 object-contain"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
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
