import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import Link from 'next/link'
import { getInitial } from '@/lib/studentReport'

export default async function ParentHome() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()

  // Load linked children via parent_student_relationships
  const { data: links } = await service
    .from('parent_student_relationships')
    .select('student_id, is_active')
    .eq('parent_id', user.id)
    .eq('is_active', true)

  const studentIds = (links ?? []).map((l) => l.student_id)

  const { data: children } = studentIds.length
    ? await service
        .from('student_profiles')
        .select('id, name, grade, token_balance')
        .in('id', studentIds)
        .order('name')
    : { data: [] }

  // Pending past paper uploads by this parent
  const { data: uploads } = await service
    .from('past_paper_uploads')
    .select('id, school_name, grade, exam_type, review_status, created_at, ai_extracted_questions')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">家長中心</h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-gray-400 underline">登出</button>
        </form>
      </div>

      {/* Children list */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">我的子女</h2>
      {!children?.length ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm mb-6">
          <p className="text-sm text-gray-400">
            尚未關聯任何學生，請聯絡老師設定
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/parent/child/${c.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-full bg-[#EF9F27]/10 text-[#EF9F27] font-bold flex items-center justify-center shrink-0">
                {getInitial(c.name)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.grade === 3
                    ? '小三'
                    : c.grade === 4
                      ? '小四'
                      : c.grade === 5
                        ? '小五'
                        : c.grade === 6
                          ? '小六'
                          : '—'}{' '}
                  · 🎁 {c.token_balance ?? 0} Tokens
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Exam scope upload */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        考試衝刺
      </h2>
      <Link
        href="/parent/exam-scope/upload"
        className="flex items-center justify-between bg-[#1D9E75] rounded-2xl p-5 shadow-sm hover:opacity-90 transition mb-4"
      >
        <div>
          <h3 className="font-semibold text-white">🔥 上載考試範圍</h3>
          <p className="text-sm text-white/80 mt-0.5">
            AI 自動識別，小朋友主頁立即見到
          </p>
        </div>
        <span className="text-white/80 text-xl">+</span>
      </Link>

      {/* Past paper upload */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        上載 Past Paper
      </h2>
      <Link
        href="/parent/upload"
        className="flex items-center justify-between bg-[#EF9F27] rounded-2xl p-5 shadow-sm hover:opacity-90 transition mb-6"
      >
        <div>
          <h3 className="font-semibold text-white">📄 上載試卷</h3>
          <p className="text-sm text-white/80 mt-0.5">每頁獲 10 Tokens</p>
        </div>
        <span className="text-white/80 text-xl">+</span>
      </Link>

      {/* Recent upload status */}
      {uploads && uploads.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            近期上載
          </h2>
          <div className="space-y-2">
            {uploads.map((u) => {
              const count = Array.isArray(u.ai_extracted_questions)
                ? (u.ai_extracted_questions as unknown[]).length
                : 0
              const statusMeta =
                u.review_status === 'approved'
                  ? { text: '已批准', color: 'text-green-600 bg-green-50' }
                  : u.review_status === 'rejected'
                    ? { text: '已拒絕', color: 'text-gray-400 bg-gray-50' }
                    : { text: '待審核', color: 'text-amber-600 bg-amber-50' }
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-gray-700">
                      {u.school_name ?? '未知學校'}
                      {u.exam_type ? ` · ${u.exam_type}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {count} 題 ·{' '}
                      {new Date(u.created_at).toLocaleDateString('zh-HK')}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                    {statusMeta.text}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
