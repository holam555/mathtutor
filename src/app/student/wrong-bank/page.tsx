import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import WrongBankClient from './WrongBankClient'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

type Bucket = {
  key: string
  label: string
  wrongCount: number
  kind: 'category' | 'topic'
  categoryId?: string
  unitId?: string
}

export default async function WrongBankPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('wrong_question_bank')
    .select('category_id, topic_id, wrong_count')
    .eq('student_id', user.id)
    .eq('is_resolved', false)
    .order('wrong_count', { ascending: false })

  const wrongRows = rows ?? []

  const categoryIds = Array.from(
    new Set(wrongRows.map((r) => r.category_id).filter((x): x is string => !!x))
  )
  const topicIds = Array.from(
    new Set(wrongRows.map((r) => r.topic_id).filter((x): x is string => !!x))
  )

  const service = createServiceClient()

  const { data: categories } = categoryIds.length
    ? await service
        .from('question_categories')
        .select('id, name, code')
        .in('id', categoryIds)
    : { data: [] as { id: string; name: string; code: string }[] }

  type TopicLookup = {
    id: string
    name: string
    unit_id: string
    curriculum_units:
      | { id: string; name: string; unit_number: number }
      | { id: string; name: string; unit_number: number }[]
      | null
  }
  const { data: topicRowsRaw } = topicIds.length
    ? await service
        .from('curriculum_topics')
        .select('id, name, unit_id, curriculum_units(id, name, unit_number)')
        .in('id', topicIds)
    : { data: [] as TopicLookup[] }

  const topicMap = new Map<string, TopicLookup>()
  for (const t of (topicRowsRaw ?? []) as TopicLookup[]) topicMap.set(t.id, t)

  const catMap = new Map<string, { name: string; code: string }>()
  for (const c of categories ?? []) catMap.set(c.id, { name: c.name, code: c.code })

  const buckets = new Map<string, Bucket>()

  for (const r of wrongRows) {
    if (r.topic_id) {
      const t = topicMap.get(r.topic_id)
      if (!t) continue
      const unitData = t.curriculum_units
      const unit = Array.isArray(unitData) ? unitData[0] : unitData
      if (!unit) continue
      const key = `unit:${unit.id}`
      const existing = buckets.get(key)
      const label = `${translate('單元', lang)} ${unit.unit_number}：${unit.name}`
      if (existing) existing.wrongCount += r.wrong_count
      else
        buckets.set(key, {
          key,
          label,
          wrongCount: r.wrong_count,
          kind: 'topic',
          unitId: unit.id,
        })
    } else if (r.category_id) {
      const cat = catMap.get(r.category_id)
      if (!cat) continue
      const key = `cat:${r.category_id}`
      const existing = buckets.get(key)
      const label = `${cat.code} ${cat.name}`
      if (existing) existing.wrongCount += r.wrong_count
      else
        buckets.set(key, {
          key,
          label,
          wrongCount: r.wrong_count,
          kind: 'category',
          categoryId: r.category_id,
        })
    }
  }

  const list = Array.from(buckets.values()).sort((a, b) => b.wrongCount - a.wrongCount)
  const totalWrong = list.reduce((s, b) => s + b.wrongCount, 0)

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/student" className="text-gray-400 hover:text-gray-600 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">{translate('錯題庫', lang)}</h1>
        {totalWrong > 0 && (
          <span className="ml-auto text-sm font-medium text-[#F44336] bg-red-50 px-3 py-1 rounded-full">
            {totalWrong} {translate('次錯誤', lang)}
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold text-gray-700">{translate('暫時沒有錯題', lang)}</p>
          <p className="text-sm text-gray-400 mt-1">{translate('繼續保持！', lang)}</p>
          <Link href="/student" className="mt-4 inline-block text-sm text-[#1D9E75] underline">
            {translate('返回主頁', lang)}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.key} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{b.label}</p>
                  <p className="text-xs text-[#F44336] mt-1">{b.wrongCount} {translate('次答錯', lang)}</p>
                </div>
                <WrongBankClient
                  studentId={user.id}
                  unitId={b.unitId}
                  categoryId={b.categoryId}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
