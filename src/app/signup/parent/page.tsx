import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignupForm from '../SignupForm'
import { signUpParent } from '../actions'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export default async function ParentSignupPage() {
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
    <main className="min-h-screen flex items-center justify-center px-5 py-10 paper-grid-light">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-sm text-gray-400 mb-6">← {translate('返回', lang)}</Link>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-[#EF9F27]/10 flex items-center justify-center text-4xl mx-auto mb-3">
            👨‍👩‍👧
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{translate('家長註冊', lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">{translate('建立帳戶後，聯絡老師連結子女', lang)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <SignupForm role="parent" action={signUpParent} color="#EF9F27" />
        </div>
      </div>
    </main>
  )
}
