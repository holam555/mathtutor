import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  buildModuleResultsByName,
  buildModuleResultsFromP3Answers,
  buildUnitMastery,
  buildTopicMastery,
  computeTotalScore,
  generateAssessmentReport,
  type CurriculumMethods,
} from '@/lib/assessmentUtils'
import { computeDiagnosticTier } from '@/types/assessment'
import type { AssessmentAnswer } from '@/types/assessment'

type SubmitBody = {
  grade: number
  // legacy P5/P6 path:
  month?: number
  // P3 new path:
  selected_unit_ids?: string[]
  selected_topic_ids?: string[]
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

  const {
    grade, month, grade_level,
    selected_unit_ids, selected_topic_ids,
    student_name, school_name, parent_phone, parent_email, answers,
  } = body

  if (!grade || !student_name || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: '缺少必填資料' }, { status: 400 })
  }

  const isP3Mode = grade === 3
  const drillDownToTopic = isP3Mode && (selected_topic_ids?.length ?? 0) > 0

  // ── Score (group-aware for P3, simple for legacy) ─────────────────────────
  const totalScore = computeTotalScore(answers)
  // Legacy view also wants raw correct/total counts:
  const totalCorrect = answers.filter((a) => a.is_correct).length
  const totalQuestions = answers.length
  const score = totalScore.pct

  let band: string
  let bandDescription: string
  if (score >= 85) {
    band = 'Band 1'
    bandDescription = '數學基礎扎實，各範疇表現優異，具備升讀高年級的能力'
  } else if (score >= 65) {
    band = 'Band 2'
    bandDescription = '整體掌握良好，部分範疇需要加強，有一定的提升空間'
  } else {
    band = 'Band 3'
    bandDescription = '基礎知識需要加強，建議針對重點範疇進行系統性練習'
  }

  // ── Module results: P3 uses unit/topic name; legacy uses module_name string
  const moduleResults = isP3Mode
    ? buildModuleResultsFromP3Answers(answers, drillDownToTopic)
    : buildModuleResultsByName(answers)

  // ── Fetch curriculum teaching methods for weak modules (P3 only) ──────────
  const supabase = createServiceClient()
  let curriculumMethods: CurriculumMethods = {}
  if (isP3Mode) {
    const moduleNames = moduleResults.map((m) => m.name)
    if (drillDownToTopic) {
      const { data: rows } = await supabase
        .from('curriculum_topics')
        .select('name, teaching_methods')
        .in('name', moduleNames)
      for (const r of rows ?? []) {
        if (Array.isArray(r.teaching_methods) && r.teaching_methods.length > 0) {
          curriculumMethods[r.name as string] = r.teaching_methods as string[]
        }
      }
    } else {
      // Aggregate methods from ALL topics under each unit
      const { data: rows } = await supabase
        .from('curriculum_topics')
        .select('teaching_methods, curriculum_units!inner(name)')
        .eq('curriculum_units.grade', 3)
      const byUnit = new Map<string, Set<string>>()
      for (const r of (rows ?? []) as { teaching_methods: string[] | null; curriculum_units: { name: string } | { name: string }[] }[]) {
        const u = Array.isArray(r.curriculum_units) ? r.curriculum_units[0] : r.curriculum_units
        const unitName = u?.name
        if (!unitName) continue
        if (!byUnit.has(unitName)) byUnit.set(unitName, new Set())
        for (const m of r.teaching_methods ?? []) byUnit.get(unitName)!.add(m)
      }
      for (const [unit, set] of Array.from(byUnit.entries())) {
        if (set.size > 0) curriculumMethods[unit] = Array.from(set).slice(0, 6)
      }
    }
  }

  // ── Generate Gemini-driven rich report (or fallback) ─────────────────────
  let reportData
  try {
    reportData = await generateAssessmentReport(student_name, grade_level, moduleResults, answers, curriculumMethods)
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
      overallSummary: `${student_name}完成了本次學前評估，整體得分${score}分（${band}）。建議預約試堂，讓老師為學生制定個人化學習計劃。`,
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

  // ── Append P3-only report fields ─────────────────────────────────────────
  if (isP3Mode) {
    reportData.diagnosticTier = computeDiagnosticTier(score)
    reportData.unitMastery = buildUnitMastery(answers)
    if (drillDownToTopic) {
      reportData.topicMastery = buildTopicMastery(answers)
    }
  }

  // ── Persist session ──────────────────────────────────────────────────────
  // For P3, semester column stores 'A' or 'B'; legacy stored month as string.
  const semesterValue = isP3Mode ? 'A' : (month ? String(month) : '上')

  const { data: session, error } = await supabase
    .from('assessment_sessions')
    .insert({
      grade,
      semester: semesterValue,
      grade_level,
      student_name,
      school_name: school_name ?? null,
      parent_phone: parent_phone ?? null,
      parent_email: parent_email ?? null,
      answers,
      report_data: reportData,
      selected_unit_ids: selected_unit_ids ?? null,
      selected_topic_ids: selected_topic_ids ?? null,
      diagnostic_tier: isP3Mode ? computeDiagnosticTier(score) : null,
    })
    .select('id')
    .single()

  if (error || !session) {
    console.error('Failed to save assessment session:', error)
    return NextResponse.json({ error: '儲存失敗，請重試' }, { status: 500 })
  }

  return NextResponse.json({ session_id: session.id, report_data: reportData })
}
