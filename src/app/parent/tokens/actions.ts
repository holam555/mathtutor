'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertStudent() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role
  if (!user || (role !== 'student' && role !== 'parent')) {
    throw new Error('權限不足')
  }
  return user
}

export async function redeemOption(optionId: string) {
  const user = await assertStudent()
  const service = createServiceClient()

  // Load option
  const { data: option } = await service
    .from('redemption_options')
    .select('id, reward_description, tokens_required, is_active')
    .eq('id', optionId)
    .single()

  if (!option || !option.is_active) return { error: '此兌換選項不可用' }

  // Check balance
  const { data: profile } = await service
    .from('student_profiles')
    .select('token_balance')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: '找不到學生檔案' }
  if ((profile.token_balance ?? 0) < option.tokens_required) {
    return { error: `Token 不足（需要 ${option.tokens_required}，目前 ${profile.token_balance ?? 0}）` }
  }

  // Create redemption record
  const { data: redemption, error: rdError } = await service
    .from('token_redemptions')
    .insert({
      student_id: user.id,
      option_id: optionId,
      tokens_used: option.tokens_required,
      reward_description: option.reward_description,
      status: 'pending',
    })
    .select('id')
    .single()

  if (rdError) return { error: rdError.message }

  // Deduct tokens
  await service.from('token_transactions').insert({
    student_id: user.id,
    amount: -option.tokens_required,
    reason: 'redemption',
    reference_id: redemption.id,
    created_by: user.id,
  })
  await service.rpc('increment_token_balance', {
    p_student_id: user.id,
    p_amount: -option.tokens_required,
  })

  revalidatePath('/parent/tokens')
  return { success: true }
}
