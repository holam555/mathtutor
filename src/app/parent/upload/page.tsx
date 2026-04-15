import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UploadForm from './UploadForm'

export default async function UploadPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') {
    redirect('/')
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parent" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 返回
        </Link>
        <h1 className="text-xl font-bold">上載 Past Paper</h1>
      </div>

      <div className="bg-[#4A90E2]/5 border border-[#4A90E2]/20 rounded-2xl p-4 mb-6 text-sm text-[#4A90E2]">
        上載試卷圖片後，AI 會自動提取題目，老師審核後加入題庫，子女練習時可以做到這些題目。
      </div>

      <UploadForm />
    </main>
  )
}
