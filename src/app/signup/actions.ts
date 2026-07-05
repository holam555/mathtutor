'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type SignupState = {
  error?: string
  /** Set when signup succeeded but auto-login failed (user should log in manually). */
  goToLogin?: boolean
}

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

// Account creation uses the admin API (service role) instead of
// supabase.auth.signUp():
//   - signUp() sends a confirmation email through Supabase's shared SMTP,
//     which is capped at a handful of emails per hour — signups started
//     failing with over_email_send_rate_limit after 2-3 attempts.
//   - admin.createUser({ email_confirm: true }) creates a ready-to-use
//     account with no email involved, then we sign the user in directly.
// If the academy later configures custom SMTP and wants email
// verification, switch back to signUp() — the confirm-signup template in
// supabase/email_templates/ is ready for that.
type CreateResult =
  | { ok: true; userId: string }
  | { ok: false; error: string }

async function createConfirmedUser(
  email: string,
  password: string,
  metadata: Record<string, string>
): Promise<CreateResult> {
  const service = createServiceClient()
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (error) {
    console.error('signup createUser error', {
      status: error.status,
      code: error.code,
      message: error.message,
    })
    if (error.code === 'email_exists' || error.status === 422) {
      return { ok: false, error: '此電郵已註冊，請直接登入' }
    }
    if (error.code === 'email_address_invalid') {
      return { ok: false, error: '請輸入有效電郵' }
    }
    return { ok: false, error: '註冊失敗，請稍後再試' }
  }
  if (!data.user) return { ok: false, error: '註冊失敗，請稍後再試' }
  return { ok: true, userId: data.user.id }
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

  const created = await createConfirmedUser(email, password, { role: 'student', name })
  if (!created.ok) return { error: created.error }

  const service = createServiceClient()
  const { error: profileError } = await service
    .from('student_profiles')
    .upsert({ id: created.userId, name, grade }, { onConflict: 'id' })
  if (profileError) {
    console.error('signUpStudent: profile insert failed', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    })
    return { error: '帳戶已建立，但學生資料儲存失敗，請聯絡老師' }
  }

  // Log the new user in on their current browser session.
  const supabase = createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { goToLogin: true }

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

  const created = await createConfirmedUser(email, password, { role: 'parent', name })
  if (!created.ok) return { error: created.error }

  const service = createServiceClient()
  const { error: profileError } = await service
    .from('parent_profiles')
    .upsert({ id: created.userId, name, phone: phone || null }, { onConflict: 'id' })
  if (profileError) {
    console.error('signUpParent: profile insert failed', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    })
    return { error: '帳戶已建立，但家長資料儲存失敗，請聯絡老師' }
  }

  const supabase = createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { goToLogin: true }

  revalidatePath('/', 'layout')
  redirect('/parent')
}
