'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type SignupState = {
  error?: string
  /** Set when signup succeeded but email confirmation is required. */
  confirmEmail?: boolean
}

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function signUpStudent(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = String(formData.get('name') ?? '').trim()
  const gradeRaw = String(formData.get('grade') ?? '')
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const grade = parseInt(gradeRaw)
  if (!name) return { error: '請輸入姓名' }
  if (![3, 4, 5, 6].includes(grade)) return { error: '請選擇年級' }
  if (!validEmail(email)) return { error: '請輸入有效電郵' }
  if (password.length < 6) return { error: '密碼最少 6 個字元' }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'student', name } },
  })

  if (error) {
    console.error('signUp error', { status: error.status, code: error.code, message: error.message })
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: '此電郵已註冊，請直接登入' }
    }
    return { error: '註冊失敗，請稍後再試' }
  }
  if (!data.user) return { error: '註冊失敗，請稍後再試' }

  // Profile row via service client — works whether or not the email is
  // confirmed yet (no session exists before confirmation, so RLS-based
  // self-insert wouldn't).
  const service = createServiceClient()
  const { error: profileError } = await service
    .from('student_profiles')
    .upsert({ id: data.user.id, name, grade }, { onConflict: 'id' })
  if (profileError) {
    console.error('signUpStudent: profile insert failed', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    })
    return { error: '帳戶已建立，但學生資料儲存失敗，請聯絡老師' }
  }

  // Supabase returns no session when "Confirm email" is enabled.
  if (!data.session) return { confirmEmail: true }

  revalidatePath('/', 'layout')
  redirect('/student')
}

export async function signUpParent(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!name) return { error: '請輸入姓名' }
  if (!validEmail(email)) return { error: '請輸入有效電郵' }
  if (password.length < 6) return { error: '密碼最少 6 個字元' }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'parent', name } },
  })

  if (error) {
    console.error('signUp error', { status: error.status, code: error.code, message: error.message })
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: '此電郵已註冊，請直接登入' }
    }
    return { error: '註冊失敗，請稍後再試' }
  }
  if (!data.user) return { error: '註冊失敗，請稍後再試' }

  const service = createServiceClient()
  const { error: profileError } = await service
    .from('parent_profiles')
    .upsert({ id: data.user.id, name, phone: phone || null }, { onConflict: 'id' })
  if (profileError) {
    console.error('signUpParent: profile insert failed', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    })
    return { error: '帳戶已建立，但家長資料儲存失敗，請聯絡老師' }
  }

  if (!data.session) return { confirmEmail: true }

  revalidatePath('/', 'layout')
  redirect('/parent')
}
