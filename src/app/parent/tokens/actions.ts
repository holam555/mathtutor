'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Redeem on behalf of a specific student. Callers must be either the
// student themselves OR a parent linked to that student via
// parent_student_relationships.
export async function redeemOption(optionId: string, studentId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role
  if (!user || (role !== 'student' && role !== 'parent')) {
    return { error: '權限不足' }
  }

  const service = createServiceClient()

  // Authorisation: student redeeming own balance, or parent of linked child.
  if (role === 'student') {
    if (user.id !== studentId) return { error: '權限不足' }
  } else {
    const { data: link } = await service
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', studentId)
      .eq('is_active', true)
      .maybeSingle()
    if (!link) return { error: '此學生並未連結你的帳戶' }
  }

  // Load option
  const { data: option } = await service
    .from('redemption_options')
    .select('id, reward_description, tokens_required, is_active')
    .eq('id', optionId)
    .single()

  if (!option || !option.is_active) return { error: '此兌換選項不可用' }

  // Check balance on the child's profile
  const { data: profile } = await service
    .from('student_profiles')
    .select('token_balance')
    .eq('id', studentId)
    .single()

  if (!profile) return { error: '找不到學生檔案' }
  if ((profile.token_balance ?? 0) < option.tokens_required) {
    return {
      error: `代幣不足（需要 ${option.tokens_required}，目前 ${profile.token_balance ?? 0}）`,
    }
  }

  const { data: redemption, error: rdError } = await service
    .from('token_redemptions')
    .insert({
      student_id: studentId,
      option_id: optionId,
      tokens_used: option.tokens_required,
      reward_description: option.reward_description,
      status: 'pending',
    })
    .select('id')
    .single()

  if (rdError) return { error: rdError.message }

  await service.from('token_transactions').insert({
    student_id: studentId,
    amount: -option.tokens_required,
    reason: 'redemption',
    reference_id: redemption.id,
    created_by: user.id,
  })
  await service.rpc('increment_token_balance', {
    p_student_id: studentId,
    p_amount: -option.tokens_required,
  })

  revalidatePath('/parent')
  return { success: true }
}
