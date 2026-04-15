'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
}

type Role = 'student' | 'parent' | 'teacher'

const ROLE_HOME: Record<Role, string> = {
  student: '/student',
  parent: '/parent',
  teacher: '/admin',
}

const ROLE_LABEL: Record<Role, string> = {
  student: '學生',
  parent: '家長',
  teacher: '老師',
}

function makeSignIn(expectedRole: Role) {
  return async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
    const email = formData.get('email')
    const password = formData.get('password')

    if (typeof email !== 'string' || typeof password !== 'string') {
      return { error: '請輸入電郵和密碼' }
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: '電郵或密碼錯誤' }
    }

    const actualRole = data.user?.user_metadata?.role as string | undefined

    // Must match the login page's expected role
    if (actualRole !== expectedRole) {
      await supabase.auth.signOut()
      return {
        error: `此帳戶不是${ROLE_LABEL[expectedRole]}帳戶，請使用正確的登入入口`,
      }
    }

    revalidatePath('/', 'layout')
    redirect(ROLE_HOME[expectedRole])
  }
}

export const signInStudent = makeSignIn('student')
export const signInParent = makeSignIn('parent')
export const signInTeacher = makeSignIn('teacher')

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
