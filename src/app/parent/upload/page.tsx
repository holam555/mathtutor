import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UploadForm from './UploadForm'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function UploadPage() {
  const supabase = createClient()
  const lang = getLang()
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
          ← {translate('返回', lang)}
        </Link>
        <h1 className="text-xl font-bold">{translate('上載 Past Paper', lang)}</h1>
      </div>

      <div className="bg-[#4A90E2]/5 border border-[#4A90E2]/20 rounded-2xl p-4 mb-6 text-sm text-[#4A90E2]">
        {translate('上載試卷圖片後，AI 會自動提取題目，老師審核後加入題庫，子女練習時可以做到這些題目。', lang)}
      </div>

      <UploadForm />
    </main>
  )
}
