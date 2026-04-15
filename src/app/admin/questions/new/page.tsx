import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewQuestionForm from './NewQuestionForm'

export default async function NewQuestionPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('question_categories')
    .select('*')
    .order('grade')
    .order('semester')
    .order('code')

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/questions" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">新增題目</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <NewQuestionForm categories={categories ?? []} />
      </div>
    </main>
  )
}
