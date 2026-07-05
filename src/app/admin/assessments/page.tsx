import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminAssessmentsClient from './AdminAssessmentsClient'
import type { AssessmentRow } from './AdminAssessmentsClient'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function AdminAssessmentsPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/')

  const service = createServiceClient()

  const { data: rows } = await service
    .from('assessment_sessions')
    .select('id, student_name, school_name, grade, grade_level, parent_phone, parent_email, created_at, report_data, answers')
    .order('created_at', { ascending: false })
    .limit(500)

  const sessions: AssessmentRow[] = (rows ?? []) as AssessmentRow[]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-teal-600 hover:underline">
            ← {translate('返回後台', lang)}
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{translate('學前評估記錄', lang)}</h1>
        <p className="text-sm text-gray-500 mb-6">{translate('所有通過公開評估頁面提交的學生資料', lang)}</p>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">{translate('尚未有評估記錄', lang)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {translate('學生完成學前評估後，記錄會顯示在這裡', lang)}
            </p>
          </div>
        ) : (
          <AdminAssessmentsClient sessions={sessions} />
        )}
      </div>
    </div>
  )
}
