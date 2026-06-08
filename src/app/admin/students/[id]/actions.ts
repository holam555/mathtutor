'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertTeacher() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'teacher') {
    throw new Error('權限不足')
  }
  return user
}

export async function saveTopicAssignments(studentId: string, topicIds: string[]) {
  const user = await assertTeacher()
  const service = createServiceClient()

  // Deactivate all existing assignments for this student
  await service
    .from('student_topic_assignments')
    .update({ is_active: false })
    .eq('student_id', studentId)

  // Upsert the new active set (if any)
  if (topicIds.length > 0) {
    const rows = topicIds.map((tid) => ({
      student_id: studentId,
      topic_id: tid,
      assigned_by: user.id,
      is_active: true,
    }))

    const { error } = await service
      .from('student_topic_assignments')
      .upsert(rows, { onConflict: 'student_id,topic_id' })

    if (error) return { error: error.message }
  }

  revalidatePath(`/admin/students/${studentId}`)
  return { success: true }
}
