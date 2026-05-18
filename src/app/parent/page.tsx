import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import Link from 'next/link'
import { getInitial } from '@/lib/studentReport'
import RedeemButton from './tokens/RedeemButton'

const GRADE_LABEL: Record<number, string> = {
  3: '小三',
  4: '小四',
  5: '小五',
  6: '小六',
}

export default async function ParentHome() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'parent') redirect('/')

  const service = createServiceClient()

  // Linked children
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

  const childList = (children ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    balance: c.token_balance ?? 0,
  }))
  const totalBalance = childList.reduce((s, c) => s + c.balance, 0)

  // Active redemption options
  const { data: options } = await service
    .from('redemption_options')
    .select('id, reward_description, tokens_required, is_active')
    .eq('is_active', true)
    .order('tokens_required', { ascending: true })

  // Recent past paper uploads + redemption history (parent's own)
  const [uploadsRes, redemptionsRes] = await Promise.all([
    service
      .from('past_paper_uploads')
      .select('id, school_name, grade, exam_type, review_status, created_at, ai_extracted_questions')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    studentIds.length
      ? service
          .from('token_redemptions')
          .select('id, student_id, tokens_used, reward_description, status, created_at')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as Array<{
          id: string
          student_id: string
          tokens_used: number
          reward_description: string
          status: string
          created_at: string
        }> }),
  ])
  const uploads = uploadsRes.data
  const redemptions = redemptionsRes.data ?? []
  const childById = new Map(childList.map((c) => [c.id, c.name]))

  // Mock exam papers whose LQ part needs upload (status in mc_sq_done or lq_uploaded but not reviewed)
  const { data: lqPending } = studentIds.length
    ? await service
        .from('mock_exam_papers')
        .select('id, student_id, lq_count, status')
        .in('student_id', studentIds)
        .in('status', ['mc_sq_done'])
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] as Array<{ id: string; student_id: string; lq_count: number; status: string }> }

  const pendingLqPapers = (lqPending ?? []).map((p) => ({
    id: p.id,
    lq_count: p.lq_count,
    studentName: childById.get(p.student_id) ?? '學生',
  }))

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
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        我的子女
      </h2>
      {!childList.length ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm mb-6">
          <p className="text-sm text-gray-400">尚未關聯任何學生，請聯絡老師設定</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {(children ?? []).map((c) => (
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
                  {(c.grade && GRADE_LABEL[c.grade]) ?? '—'} ·{' '}
                  🪙 {c.token_balance ?? 0} 代幣
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Exam scope */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        模擬考試
      </h2>
      <Link
        href="/parent/exam-scope/upload"
        className="flex items-center justify-between bg-[#1D9E75] rounded-2xl p-5 shadow-sm hover:opacity-90 transition mb-4"
      >
        <div>
          <h3 className="font-semibold text-white">🔥 設定考試範圍</h3>
          <p className="text-sm text-white/80 mt-0.5">
            揀選考試單元，學生主頁立即見到模擬考試試卷
          </p>
        </div>
        <span className="text-white/80 text-xl">+</span>
      </Link>

      {pendingLqPapers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            待上載長答題答卷
          </h3>
          <div className="space-y-2">
            {pendingLqPapers.map((p) => (
              <Link
                key={p.id}
                href={`/parent/mock-exam/${p.id}/upload`}
                className="block bg-amber-50 border border-amber-200 rounded-xl p-3 hover:bg-amber-100 transition"
              >
                <p className="text-sm font-semibold text-amber-900">
                  📝 {p.studentName} 嘅模擬考試
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {p.lq_count} 題長答題 · 點擊上載手寫答卷
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

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
          <p className="text-sm text-white/80 mt-0.5">每頁可獲 10 代幣</p>
        </div>
        <span className="text-white/80 text-xl">+</span>
      </Link>

      {/* Redemption section */}
      {childList.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            代幣獎賞
          </h2>
          <details className="group shadow-sm rounded-2xl overflow-hidden mb-0">
            {/* Collapsed card — styled like 模擬考試 / 上載 Past Paper */}
            <summary className="flex items-center justify-between bg-[#EF9F27] p-5 cursor-pointer list-none select-none">
              <div>
                <h3 className="font-semibold text-white">🪙 用代幣換獎賞</h3>
                <p className="text-sm text-white/80 mt-0.5">
                  合共 {totalBalance} 代幣 · 點擊查看獎賞
                </p>
              </div>
              <span className="text-white/80 text-xl transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>

            {/* Expanded content */}
            <div className="bg-gray-50 px-4 pt-4 pb-5 space-y-3">
              {/* What can tokens do */}
              <details className="bg-white border border-[#EF9F27]/20 rounded-2xl group/info">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none">
                  <p className="text-sm font-semibold text-gray-800">代幣有什麼用？</p>
                  <span className="text-[#EF9F27] text-xs transition-transform group-open/info:rotate-180">▼</span>
                </summary>
                <ul className="text-xs text-gray-600 space-y-1 leading-5 px-4 pb-3">
                  <li>· 每上載一頁 Past Paper，可賺取 10 個代幣</li>
                  <li>· 代幣累積後，可用來換取課程折扣或免費試堂</li>
                  <li>· 兌換後老師會聯絡你領取獎賞</li>
                </ul>
              </details>

              {/* Redemption options */}
              {!options?.length ? (
                <div className="bg-white rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-400">暫時冇可兌換嘅獎賞</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className="bg-white rounded-2xl p-4 flex items-center gap-3 relative"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EF9F27]/10 text-[#EF9F27] flex items-center justify-center shrink-0">
                        🎁
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {opt.reward_description}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          🪙 {opt.tokens_required} 代幣
                        </p>
                      </div>
                      <RedeemButton
                        optionId={opt.id}
                        tokensRequired={opt.tokens_required}
                        rewardDescription={opt.reward_description}
                        childCandidates={childList}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Redemption history */}
              {redemptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    兌換紀錄
                  </p>
                  <div className="space-y-2">
                    {redemptions.map((r) => {
                      const statusMeta =
                        r.status === 'approved'
                          ? { text: '已批准', color: 'text-green-600 bg-green-50' }
                          : r.status === 'rejected'
                            ? { text: '已拒絕', color: 'text-gray-400 bg-gray-50' }
                            : { text: '審批中', color: 'text-amber-600 bg-amber-50' }
                      return (
                        <div
                          key={r.id}
                          className="bg-white rounded-xl p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm text-gray-700 truncate">
                              {r.reward_description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {childById.get(r.student_id) ?? '—'} · 🪙 {r.tokens_used} ·{' '}
                              {new Date(r.created_at).toLocaleDateString('zh-HK')}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.color}`}
                          >
                            {statusMeta.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Recent past paper upload status */}
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
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.color}`}
                  >
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
