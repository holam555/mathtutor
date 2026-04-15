'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VariationCard from './VariationCard'
import GenerateCategoryButton from './GenerateCategoryButton'

type PendingQuestion = {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  difficulty: number
  category: { name: string; code: string } | null
}

export default async function VariationsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const service = createServiceClient()

  // Load all categories that have variation templates
  const { data: categories } = await service
    .from('variation_templates')
    .select('category_id, question_categories(id, name, code)')
    .order('created_at')

  const categoryList = (categories ?? [])
    .map((row) => {
      const cat = row.question_categories as unknown as { id: string; name: string; code: string } | null
      return cat ? { id: cat.id, name: cat.name, code: cat.code } : null
    })
    .filter((c): c is { id: string; name: string; code: string } => c !== null)

  // Load pending questions (not approved, not rejected)
  let query = service
    .from('generated_questions')
    .select(`
      id,
      question_text,
      question_type,
      options,
      correct_answer,
      difficulty,
      question_categories!category_id(name, code)
    `)
    .eq('is_approved', false)
    .eq('is_rejected', false)
    .order('created_at', { ascending: false })

  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category)
  }

  const { data: pending } = await query

  const questions: PendingQuestion[] = (pending ?? []).map((row) => ({
    id: row.id,
    question_text: row.question_text,
    question_type: row.question_type,
    options: row.options as string[] | null,
    correct_answer: row.correct_answer,
    difficulty: row.difficulty ?? 1,
    category: (row.question_categories as unknown as { name: string; code: string } | null),
  }))

  // Count pending per category for sidebar badges
  const { data: counts } = await service
    .from('generated_questions')
    .select('category_id')
    .eq('is_approved', false)
    .eq('is_rejected', false)

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
  }

  const totalPending = questions.length

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</a>
        <h1 className="text-xl font-bold">AI 題目生成及審核</h1>
        {totalPending > 0 && (
          <span className="ml-auto bg-[#4A90E2] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {totalPending} 待審核
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Sidebar: category filter */}
        <aside className="hidden sm:block w-44 shrink-0">
          <p className="text-xs text-gray-400 font-medium mb-2 px-1">分類篩選</p>
          <div className="space-y-1">
            <a
              href="/admin/variations"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                !searchParams.category
                  ? 'bg-[#4A90E2] text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>全部</span>
              {Object.values(countMap).reduce((a, b) => a + b, 0) > 0 && (
                <span className={`text-xs font-bold ${!searchParams.category ? 'text-white/80' : 'text-[#4A90E2]'}`}>
                  {Object.values(countMap).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </a>
            {categoryList.map((cat) => (
              <a
                key={cat.id}
                href={`/admin/variations?category=${cat.id}`}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                  searchParams.category === cat.id
                    ? 'bg-[#4A90E2] text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate">{cat.code} {cat.name}</span>
                {countMap[cat.id] > 0 && (
                  <span className={`text-xs font-bold ml-1 shrink-0 ${searchParams.category === cat.id ? 'text-white/80' : 'text-[#4A90E2]'}`}>
                    {countMap[cat.id]}
                  </span>
                )}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile: category links */}
          <div className="sm:hidden mb-4 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              <a
                href="/admin/variations"
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  !searchParams.category ? 'bg-[#4A90E2] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                全部
              </a>
              {categoryList.map((cat) => (
                <a
                  key={cat.id}
                  href={`/admin/variations?category=${cat.id}`}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    searchParams.category === cat.id
                      ? 'bg-[#4A90E2] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat.code}
                  {countMap[cat.id] ? ` (${countMap[cat.id]})` : ''}
                </a>
              ))}
            </div>
          </div>

          {/* Generate button for selected category */}
          {searchParams.category && (
            <div className="mb-4">
              <GenerateCategoryButton categoryId={searchParams.category} />
            </div>
          )}

          {/* Question cards */}
          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">
                {searchParams.category ? '此分類暫無待審核題目' : '暫無待審核題目'}
              </p>
              {searchParams.category && (
                <div className="mt-4">
                  <GenerateCategoryButton categoryId={searchParams.category} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <VariationCard key={q.id} q={q} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
