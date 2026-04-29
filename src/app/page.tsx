import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1D9E75] mb-2">數學練習</h1>
          <p className="text-sm text-gray-500">小五小六升分保證</p>
        </div>

        <p className="text-sm text-gray-600 text-center mb-5">請選擇你的身份</p>

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
                <p className="font-semibold text-gray-800">學生</p>
                <p className="text-xs text-gray-400 mt-0.5">開始數學練習</p>
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
                <p className="font-semibold text-gray-800">家長</p>
                <p className="text-xs text-gray-400 mt-0.5">查看子女進度、上載 Past Paper</p>
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
                <p className="font-semibold text-gray-800">老師</p>
                <p className="text-xs text-gray-400 mt-0.5">管理題庫、審核</p>
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
                <p className="font-semibold text-white">學前評估</p>
                <p className="text-xs text-white/80 mt-0.5">免費評估數學程度，即時獲取診斷報告</p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          首次使用請聯絡老師開設帳戶
        </p>
      </div>
    </main>
  )
}
