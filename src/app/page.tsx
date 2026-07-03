import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translate'

export default async function Home() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, send to role-specific home
  if (user) {
    const role = user.user_metadata?.role as string | undefined
    if (role === 'teacher') redirect('/admin')
    if (role === 'parent') redirect('/parent')
    if (role === 'student') redirect('/student')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-gradient-to-br from-[#F5F9FD] to-[#E8F0F7]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="霖楓學苑 LF Academy"
              width={160}
              height={52}
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <p className="text-sm text-gray-500">{t('小學數學升分專家', lang)}</p>
        </div>

        <p className="text-sm text-gray-600 text-center mb-5">{t('請選擇你的身份', lang)}</p>

        <div className="space-y-3">
          <Link
            href="/login/student"
            className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1D9E75]/10 flex items-center justify-center text-2xl">
                🎒
              </div>
              <div>
                <p className="font-semibold text-gray-800">{t('學生', lang)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('開始數學練習', lang)}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/login/parent"
            className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EF9F27]/10 flex items-center justify-center text-2xl">
                👨‍👩‍👧
              </div>
              <div>
                <p className="font-semibold text-gray-800">{t('家長', lang)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('查看子女進度、上載 Past Paper', lang)}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/login/teacher"
            className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4A90E2]/10 flex items-center justify-center text-2xl">
                🧑‍🏫
              </div>
              <div>
                <p className="font-semibold text-gray-800">{t('老師', lang)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('管理題庫、審核', lang)}</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href="/assessment"
            className="block bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <p className="font-semibold text-white">{t('學前評估', lang)}</p>
                <p className="text-xs text-white/80 mt-0.5">{t('免費評估數學程度，即時獲取診斷報告', lang)}</p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          {t('首次使用請聯絡老師開設帳戶', lang)}
        </p>
      </div>
    </main>
  )
}
