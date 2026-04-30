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

  const totalCorrect = answers.filter((a) => a.is_correct).length
  const totalQuestions = answers.length
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const band = score >= 85 ? 'Band 1' : score >= 65 ? 'Band 2' : 'Band 3'
  const bandDescription =
    score >= 85 ? '數學基礎扎實，各範疇表現優異' :
    score >= 65 ? '整體掌握良好，部分範疇需要加強' :
    '基礎知識需要加強，建議進行系統性練習'

  let reportData
  try {
    reportData = await generateAssessmentReport(student_name, grade_level, moduleResults, answers)
  } catch (err) {
    console.error('Gemini report generation failed:', err)
    reportData = {
      modules: moduleResults.map((m) => ({ ...m, comment: '' })),
      totalCorrect,
      totalQuestions,
      score,
      band,
      bandDescription,
      strongAreas: moduleResults
        .filter((m) => m.rating === 'S' || m.rating === 'A')
        .map((m) => ({
          title: m.name,
          observation: `${student_name}在${m.name}範疇表現良好，正確率達${m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0}%。`,
          tip: '建議每週保持練習，鞏固已掌握的知識。',
        })),
      weakAreas: moduleResults
        .filter((m) => m.rating === 'B' || m.rating === 'C')
        .map((m, i) => ({
          name: m.name,
          priority: (m.rating === 'C' ? '最高優先' : i === 0 ? '高優先' : '中優先') as '最高優先' | '高優先' | '中優先',
          errorTypes: ['需要加強練習', '建議針對性訓練'],
          rootCause: '需要系統性練習以鞏固基礎概念。',
          solutions: [
            { title: '基礎鞏固', detail: '從基礎題目開始，逐步建立對核心概念的理解。' },
            { title: '重複操練', detail: '每天練習同類題型，透過重複加深印象。' },
            { title: '錯題分析', detail: '仔細分析錯誤原因，找出規律避免重複犯錯。' },
          ],
        })),
      overallSummary: `${student_name}完成了本次學前評估，整體得分${score}分（${band}）。建議預約試堂，讓老師為孩子制定個人化學習計劃。`,
      learningPlan: moduleResults
        .filter((m) => m.rating === 'B' || m.rating === 'C')
        .slice(0, 3)
        .map((m, i) => ({
          priority: (['第一優先', '第二優先', '第三優先'] as const)[i],
          area: m.name,
          action: '針對薄弱知識點進行系統練習，每週至少3次',
        })),
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
