import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RedemptionButtons } from './RedemptionActions'
import ManualAdjustForm from './ManualAdjustForm'
import OptionManager from './OptionManager'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function RedemptionsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const service = createServiceClient()
  const lang = getLang()
  const tab = searchParams.tab ?? 'pending'

  // Redemption requests
  const { data: redemptions } = await service
    .from('token_redemptions')
    .select(`
      id, tokens_used, reward_description, status, created_at,
      student_profiles!student_id(name)
    `)
    .eq('status', tab)
    .order('created_at', { ascending: false })

  const { count: pendingCount } = await service
    .from('token_redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // All students for manual adjust dropdown
  const { data: students } = await service
    .from('student_profiles')
    .select('id, name, token_balance')
    .order('name')

  // Redemption options for manager
  const { data: options } = await service
    .from('redemption_options')
    .select('id, reward_description, tokens_required, is_active')
    .order('tokens_required')

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold">{translate('Token 兌換管理', lang)}</h1>
        {(pendingCount ?? 0) > 0 && (
          <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingCount} {translate('待審批', lang)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/redemptions?tab=${t}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? 'bg-[#4A90E2] text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {translate(t === 'pending' ? '待審批' : t === 'approved' ? '已批准' : '已拒絕', lang)}
          </Link>
        ))}
      </div>

      {/* Redemption list */}
      {!redemptions?.length ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm text-sm mb-6">
          {lang === 'en'
            ? `No ${translate(tab === 'pending' ? '待審批' : tab === 'approved' ? '已批准' : '已拒絕', lang).toLowerCase()} requests`
            : `沒有${tab === 'pending' ? '待審批' : tab === 'approved' ? '已批准' : '已拒絕'}的申請`}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {redemptions.map((r) => {
            const studentName =
              (r.student_profiles as unknown as { name: string } | null)?.name ?? translate('未知學生', lang)
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gray-800">{r.reward_description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {studentName} · -{r.tokens_used} Tokens ·{' '}
                    {new Date(r.created_at).toLocaleDateString('zh-HK')}
                  </p>
                </div>
                <RedemptionButtons id={r.id} status={r.status} />
              </div>
            )
          })}
        </div>
      )}

      {/* Manual adjust + option manager */}
      <div className="space-y-4">
        <ManualAdjustForm students={(students ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          token_balance: s.token_balance ?? 0,
        }))} />
        <OptionManager options={(options ?? []).map((o) => ({
          id: o.id,
          reward_description: o.reward_description,
          tokens_required: o.tokens_required,
          is_active: o.is_active ?? true,
        }))} />
      </div>
    </main>
  )
}
