import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '../LoginForm'
import { signInStudent } from '../actions'

export default async function StudentLoginPage() {
  const supabase = createClient()
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
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-gradient-to-br from-[#F5FBF8] to-[#E6F4EE]">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block text-sm text-gray-400 mb-6">← 返回</Link>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-[#1D9E75]/10 flex items-center justify-center text-4xl mx-auto mb-3">
            🎒
          </div>
          <h1 className="text-2xl font-bold text-gray-800">學生登入</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <LoginForm action={signInStudent} color="#1D9E75" />
        </div>
      </div>
    </main>
  )
}
