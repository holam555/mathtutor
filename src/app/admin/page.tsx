import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import Link from 'next/link'

export default async function AdminHome() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const { count: questionCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: pendingVariations } = await supabase
    .from('generated_questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)
    .eq('is_rejected', false)

  const { count: pendingPapers } = await supabase
    .from('past_paper_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'pending')

  const { count: pendingRedemptions } = await supabase
    .from('token_redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">老師後台</h1>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-gray-500 underline">登出</button>
        </form>
      </div>

      <div className="grid gap-3">
        <Link
          href="/admin/questions"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">題目管理</h2>
            <p className="text-sm text-gray-500 mt-0.5">現有 {questionCount ?? 0} 條啟用題目</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/admin/questions/new"
          className="flex items-center justify-between bg-[#4A90E2] rounded-2xl p-5 shadow-sm hover:bg-[#3a80d2] transition"
        >
          <div>
            <h2 className="font-semibold text-white">新增題目</h2>
            <p className="text-sm text-white/75 mt-0.5">手動加入新題目</p>
          </div>
          <span className="text-white/75">+</span>
        </Link>

        <Link
          href="/admin/long-questions"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">長答題管理</h2>
            <p className="text-sm text-gray-500 mt-0.5">模擬考試試卷用嘅 LQ 題庫</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/admin/mock-exam"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">模擬考試 LQ 批改</h2>
            <p className="text-sm text-gray-500 mt-0.5">審核學生長答題上載圖片及 AI 辨識答案</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/admin/variations"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">AI 題目生成及審核</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {(pendingVariations ?? 0) > 0
                ? `${pendingVariations} 條 AI 生成題目待審核`
                : '生成及審核 AI variation 題目'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(pendingVariations ?? 0) > 0 && (
              <span className="bg-[#4A90E2] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingVariations}
              </span>
            )}
            <span className="text-gray-400">→</span>
          </div>
        </Link>

        <Link
          href="/admin/past-papers"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">Past Paper 審核</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {(pendingPapers ?? 0) > 0
                ? `${pendingPapers} 份試卷待審核`
                : '審核家長上載的 Past Paper'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(pendingPapers ?? 0) > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingPapers}
              </span>
            )}
            <span className="text-gray-400">→</span>
          </div>
        </Link>

        <Link
          href="/admin/redemptions"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">Token 兌換管理</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {(pendingRedemptions ?? 0) > 0
                ? `${pendingRedemptions} 個兌換申請待審批`
                : '審批兌換申請，手動調整 Token'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(pendingRedemptions ?? 0) > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRedemptions}
              </span>
            )}
            <span className="text-gray-400">→</span>
          </div>
        </Link>

        <Link
          href="/admin/students"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">學生數據</h2>
            <p className="text-sm text-gray-500 mt-0.5">查看各學生練習進度和正確率</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          href="/admin/assessments"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <div>
            <h2 className="font-semibold">學前評估記錄</h2>
            <p className="text-sm text-gray-500 mt-0.5">查看公開評估提交的學生聯絡資料</p>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>
    </main>
  )
}
