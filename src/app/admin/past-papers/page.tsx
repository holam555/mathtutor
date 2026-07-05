import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  pending: { text: '待審核', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  approved: { text: '已批准', color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { text: '已拒絕', color: 'text-gray-400 bg-gray-50 border-gray-200' },
}

export default async function PastPapersPage({
  searchParams,
}: {
  searchParams: { status?: string }
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
  const statusFilter = searchParams.status ?? 'pending'

  const { data: uploads } = await service
    .from('past_paper_uploads')
    .select('id, school_name, grade, exam_year, exam_type, review_status, created_at, ai_extracted_questions, image_paths')
    .eq('review_status', statusFilter)
    .order('created_at', { ascending: false })

  const { count: pendingCount } = await service
    .from('past_paper_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'pending')

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold">{translate('Past Paper 審核', lang)}</h1>
        {(pendingCount ?? 0) > 0 && (
          <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingCount} {translate('待審核', lang)}
          </span>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/past-papers?status=${s}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-[#4A90E2] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {translate(STATUS_CONFIG[s].text, lang)}
          </Link>
        ))}
      </div>

      {!uploads?.length ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm text-sm">
          {lang === 'en'
            ? `No ${translate(STATUS_CONFIG[statusFilter]?.text, lang).toLowerCase()} records`
            : `沒有${STATUS_CONFIG[statusFilter]?.text}的記錄`}
        </div>
      ) : (
        <div className="space-y-3">
          {uploads.map((u) => {
            const qCount = Array.isArray(u.ai_extracted_questions)
              ? (u.ai_extracted_questions as unknown[]).length
              : 0
            const imgCount = Array.isArray(u.image_paths) ? u.image_paths.length : 0
            const status = STATUS_CONFIG[u.review_status] ?? STATUS_CONFIG.pending
            return (
              <Link
                key={u.id}
                href={`/admin/past-papers/${u.id}`}
                className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {u.school_name ?? translate('未知學校', lang)}
                    {u.grade ? ` · ${translate(u.grade === 5 ? '小五' : '小六', lang)}` : ''}
                    {u.exam_type ? ` · ${u.exam_type}` : ''}
                    {u.exam_year ? ` (${u.exam_year})` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {imgCount} {translate('頁圖片', lang)} · {translate('提取', lang)} {qCount} {translate('題', lang)} ·{' '}
                    {new Date(u.created_at).toLocaleDateString('zh-HK')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                    {translate(status.text, lang)}
                  </span>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
