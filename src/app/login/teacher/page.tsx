import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '../LoginForm'
import { signInTeacher } from '../actions'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translate'

export default async function TeacherLoginPage() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const role = user.user_metadata?.role as string | undefined
    if (role === 'student') redirect('/student')
    if (role === 'parent') redirect('/parent')
    if (role === 'teacher') redirect('/admin')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-gradient-to-br from-[#F1F6FC] to-[#DCE8F6]">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-sm text-gray-400 mb-6">← {t('返回', lang)}</Link>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-[#4A90E2]/10 flex items-center justify-center text-4xl mx-auto mb-3">
            🧑‍🏫
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('老師登入', lang)}</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <LoginForm action={signInTeacher} color="#4A90E2" />
        </div>
      </div>
    </main>
  )
}
