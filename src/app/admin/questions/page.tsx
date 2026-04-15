import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ToggleActiveButton from './ToggleActiveButton'

const DIFFICULTY_LABEL: Record<number, string> = { 1: '易', 2: '中', 3: '難' }
const TYPE_LABEL: Record<string, string> = {
  multiple_choice: '選擇題',
  fill_in: '填充題',
  calculation: '計算題',
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { category_id?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('question_categories')
    .select('id, name, code, grade, semester')
    .order('code')

  let query = supabase
    .from('questions')
    .select(`*, category:question_categories(name, code)`)
    .order('created_at', { ascending: false })

  if (searchParams.category_id) {
    query = query.eq('category_id', searchParams.category_id)
  }

  const { data: questions } = await query

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <h1 className="text-xl font-bold">題目管理</h1>
          <span className="text-sm text-gray-400">({questions?.length ?? 0} 題)</span>
        </div>
        <Link
          href="/admin/questions/new"
          className="px-4 py-2 bg-[#4A90E2] text-white text-sm font-medium rounded-xl hover:bg-[#3a80d2] transition"
        >
          + 新增題目
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        <Link
          href="/admin/questions"
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !searchParams.category_id
              ? 'bg-[#4A90E2] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          全部
        </Link>
        {categories?.map((cat) => (
          <Link
            key={cat.id}
            href={`/admin/questions?category_id=${cat.id}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
              searchParams.category_id === cat.id
                ? 'bg-[#4A90E2] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat.code}
          </Link>
        ))}
      </div>

      {/* Questions list */}
      {!questions?.length ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          <p>暫時沒有題目</p>
          <Link
            href="/admin/questions/new"
            className="mt-3 inline-block text-sm text-[#4A90E2] underline"
          >
            新增第一條題目
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-[#4A90E2] bg-[#4A90E2]/10 px-2 py-0.5 rounded-full">
                      {(q.category as { code: string; name: string } | null)?.code}{' '}
                      {(q.category as { code: string; name: string } | null)?.name}
                    </span>
                    <span className="text-xs text-gray-400">{TYPE_LABEL[q.question_type]}</span>
                    <span className="text-xs text-gray-400">
                      難度：{DIFFICULTY_LABEL[q.difficulty]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.question_text}</p>
                  <p className="text-xs text-gray-500 mt-1">答案：{q.correct_answer}</p>
                </div>
                <ToggleActiveButton questionId={q.id} isActive={q.is_active} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
