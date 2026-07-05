import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  in_progress: { label: '進行中', color: 'bg-gray-100 text-gray-600' },
  mc_sq_done: { label: '已完成 MC/SQ', color: 'bg-blue-100 text-blue-700' },
  lq_uploaded: { label: '已上載 LQ', color: 'bg-amber-100 text-amber-800' },
  reviewed: { label: '已批改', color: 'bg-green-100 text-green-700' },
}

export default async function MockExamAdminPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const statusFilter = searchParams.status ?? 'lq_uploaded'

  const { data: papers } = await service
    .from('mock_exam_papers')
    .select('id, student_id, status, lq_count, created_at')
    .eq('status', statusFilter)
    .order('created_at', { ascending: false })
    .limit(50)

  const studentIds = Array.from(new Set((papers ?? []).map((p) => p.student_id)))
  const { data: students } = studentIds.length
    ? await service.from('student_profiles').select('id, name, grade').in('id', studentIds)
    : { data: [] as Array<{ id: string; name: string; grade: number }> }
  const studentById = new Map((students ?? []).map((s) => [s.id, s]))

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold">{translate('模擬考試 LQ 批改', lang)}</h1>
      </div>

      <div className="flex gap-2 mb-5">
        {(['lq_uploaded', 'reviewed', 'mc_sq_done'] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/mock-exam?status=${s}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-[#4A90E2] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {translate(STATUS_LABEL[s]?.label ?? s, lang)}
          </Link>
        ))}
      </div>

      {(papers ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          {translate('暫無試卷', lang)}
        </div>
      ) : (
        <div className="space-y-2">
          {(papers ?? []).map((p) => {
            const student = studentById.get(p.student_id)
            const meta = STATUS_LABEL[p.status]
            return (
              <Link
                key={p.id}
                href={`/admin/mock-exam/${p.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {student?.name ?? translate('未知', lang)}（{translate(`小${['', '', '', '三', '四', '五', '六'][student?.grade ?? 0]}`, lang)}）
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.lq_count} {translate('條長答題', lang)} · {new Date(p.created_at).toLocaleDateString('zh-Hant-HK')}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta?.color ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {translate(meta?.label ?? p.status, lang)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
