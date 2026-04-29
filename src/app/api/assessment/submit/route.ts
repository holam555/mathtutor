import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  buildModuleResultsByName,
  generateAssessmentReport,
} from '@/lib/assessmentUtils'
import type { AssessmentAnswer } from '@/types/assessment'

type SubmitBody = {
  grade: number
  month: number
  grade_level: string
  student_name: string
  school_name?: string
  parent_phone?: string
  parent_email?: string
  answers: AssessmentAnswer[]
}

export async function POST(request: NextRequest) {
  let body: SubmitBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { grade, month, grade_level, student_name, school_name, parent_phone, parent_email, answers } = body

  if (!grade || !month || !student_name || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: '缺少必填資料' }, { status: 400 })
  }

  const moduleResults = buildModuleResultsByName(answers)

  let reportData
  try {
    reportData = await generateAssessmentReport(student_name, grade_level, moduleResults, answers)
  } catch (err) {
    console.error('Gemini report generation failed:', err)
    const { RATING_LABELS } = await import('@/lib/assessmentUtils')
    reportData = {
      modules: moduleResults.map((m) => ({
        ...m,
        comment: `${m.name}板塊完成了${m.total}條題目，答對${m.correct}條（${m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0}%），評級為${RATING_LABELS[m.rating]}。`,
      })),
      totalCorrect: answers.filter((a) => a.is_correct).length,
      totalQuestions: answers.length,
      overallSummary: `${student_name}完成了本次學前評估。建議預約試堂，讓老師為孩子制定個人化學習計劃。`,
      nextSteps: [
        '學習習慣：養成每天溫習的習慣，及時鞏固所學知識。',
        '專注力：做題時保持專注，避免粗心大意。',
        '主動性：遇到不懂的地方主動發問，勇於嘗試。',
        '基礎功底：針對薄弱知識點做定向練習，穩固數學根基。',
      ],
      generatedAt: new Date().toISOString(),
    }
  }

  // Store month as string in the semester column (no new migration needed)
  const supabase = createServiceClient()
  const { data: session, error } = await supabase
    .from('assessment_sessions')
    .insert({
      grade,
      semester: String(month),
      grade_level,
      student_name,
      school_name: school_name ?? null,
      parent_phone: parent_phone ?? null,
      parent_email: parent_email ?? null,
      answers,
      report_data: reportData,
    })
    .select('id')
    .single()

  if (error || !session) {
    console.error('Failed to save assessment session:', error)
    return NextResponse.json({ error: '儲存失敗，請重試' }, { status: 500 })
  }

  return NextResponse.json({ session_id: session.id, report_data: reportData })
}
