'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertTeacher() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') throw new Error('權限不足')
  return user
}

export async function approveRedemption(redemptionId: string) {
  const user = await assertTeacher()
  const service = createServiceClient()

  await service
    .from('token_redemptions')
    .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', redemptionId)

  revalidatePath('/admin/redemptions')
  return { success: true }
}

export async function rejectRedemption(redemptionId: string) {
  const user = await assertTeacher()
  const service = createServiceClient()

  // Load redemption to get refund amount
  const { data: redemption } = await service
    .from('token_redemptions')
    .select('student_id, tokens_used, status')
    .eq('id', redemptionId)
    .single()

  if (!redemption || redemption.status !== 'pending') return { error: '只能拒絕待審批的申請' }

  await service
    .from('token_redemptions')
    .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', redemptionId)

  // Refund tokens
  await service.from('token_transactions').insert({
    student_id: redemption.student_id,
    amount: redemption.tokens_used,
    reason: 'manual_adjustment',
    reference_id: redemptionId,
    note: '兌換申請被拒絕，Token 退還',
    created_by: user.id,
  })
  await service.rpc('increment_token_balance', {
    p_student_id: redemption.student_id,
    p_amount: redemption.tokens_used,
  })

  revalidatePath('/admin/redemptions')
  return { success: true }
}

export async function manualAdjustTokens(studentId: string, amount: number, note: string) {
  const user = await assertTeacher()
  if (amount === 0) return { error: '金額不能為零' }

  const service = createServiceClient()

  // Check student exists
  const { data: profile } = await service
    .from('student_profiles')
    .select('id, token_balance')
    .eq('id', studentId)
    .single()

  if (!profile) return { error: '找不到學生' }

  // Prevent negative balance
  const newBalance = (profile.token_balance ?? 0) + amount
  if (newBalance < 0) return { error: `餘額不足（目前 ${profile.token_balance ?? 0}）` }

  await service.from('token_transactions').insert({
    student_id: studentId,
    amount,
    reason: 'manual_adjustment',
    note: note || (amount > 0 ? '老師手動增加' : '老師手動扣減'),
    created_by: user.id,
  })
  await service.rpc('increment_token_balance', {
    p_student_id: studentId,
    p_amount: amount,
  })

  revalidatePath('/admin/redemptions')
  return { success: true }
}

export async function saveRedemptionOption(
  id: string | null,
  data: { reward_description: string; tokens_required: number; is_active: boolean }
) {
  await assertTeacher()
  const service = createServiceClient()

  if (id) {
    await service.from('redemption_options').update(data).eq('id', id)
  } else {
    await service.from('redemption_options').insert(data)
  }

  revalidatePath('/admin/redemptions')
  return { success: true }
}
