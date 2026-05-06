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
import { isAnswerCorrect } from '@/lib/answerUtils'
import { getAssessmentPaper } from '@/data/assessmentQuestions'

// Gemini report generation can take 20–40 s; 60 s keeps us under Vercel Pro limit.
export const maxDuration = 60

const DB_BACKED_GRADES = new Set([3, 5])

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

  // DB-backed grades (P3 + P5) use unit/topic-aware module results and server-side regrading.
  const isDbMode = DB_BACKED_GRADES.has(grade)
  const isP3Mode = grade === 3
  const drillDownToTopic = isDbMode && (selected_topic_ids?.length ?? 0) > 0

  // ── SECURITY: re-grade every answer server-side ──────────────────────────
  // The client never sees the correct answer (stripped from /api/assessment/questions).
  // Trusting client-supplied is_correct/correct_answer would let anyone score 100%.
  {
    const supabaseGrade = createServiceClient()

    if (isDbMode) {
      // P3 + P5 DB path: fetch correct_answer from assessment_questions by UUID.
      const dbIds = answers.map((a) => a.question_id).filter((id) => !id.startsWith('hc-'))
      if (dbIds.length > 0) {
        const { data: rows } = await supabaseGrade
          .from('assessment_questions')
          .select('id, correct_answer')
          .in('id', dbIds)
        const answerMap = new Map<string, string>()
        for (const r of rows ?? []) answerMap.set(r.id as string, (r.correct_answer as string) ?? '')
        for (const a of answers) {
          const ca = answerMap.get(a.question_id) ?? ''
          a.correct_answer = ca
          a.is_correct = ca ? isAnswerCorrect(a.student_answer, ca) : false
        }
      }
    } else {
      // Legacy P4/P6 hardcoded path: derive correct_answer by index encoded in id.
      const paper = month ? getAssessmentPaper(grade, month) : null
      if (paper) {
        for (const a of answers) {
          const m = /^hc-(\d+)-(\d+)-(\d+)$/.exec(a.question_id)
          if (!m) {
            a.is_correct = false
            a.correct_answer = ''
            continue
          }
          const idx = parseInt(m[3], 10)
          const q = paper.questions[idx]
          const ca = q?.correct_answer ?? ''
          a.correct_answer = ca
          a.is_correct = ca ? isAnswerCorrect(a.student_answer, ca) : false
        }
      }
    }
  }

  // ── Score (group-aware for P3, simple for legacy) ─────────────────────────
  // Only used downstream for computeDiagnosticTier; band/bandDescription are
  // computed inside generateAssessmentReport now.
  const score = computeTotalScore(answers).pct

  // ── Module results: DB-backed grades use unit/topic name; legacy uses module_name string
  const moduleResults = isDbMode
    ? buildModuleResultsFromP3Answers(answers, drillDownToTopic)
    : buildModuleResultsByName(answers)

  // ── Fetch curriculum teaching methods for weak modules (P3 only) ──────────
  const supabase = createServiceClient()
  const curriculumMethods: CurriculumMethods = {}
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

  // ── Generate Gemini-driven rich report ───────────────────────────────────
  // No template fallback: if every retry on every model fails, return a
  // 503 with code AI_UNAVAILABLE so the client can surface a 「重試」 button
  // instead of saving a templated session that the parent would mistake
  // for the real diagnostic report.
  let reportData
  try {
    reportData = await generateAssessmentReport(student_name, grade_level, moduleResults, answers, curriculumMethods)
  } catch (err) {
    console.error('Gemini report generation failed (all retries exhausted):', err)
    return NextResponse.json(
      { error: 'AI 暫時繁忙，請稍後重試', code: 'AI_UNAVAILABLE' },
      { status: 503 },
    )
  }

  // ── Append DB-mode report fields (P3 + P5) ───────────────────────────────
  if (isDbMode) {
    reportData.diagnosticTier = computeDiagnosticTier(score)
    reportData.unitMastery = buildUnitMastery(answers)
    if (drillDownToTopic) {
      reportData.topicMastery = buildTopicMastery(answers)
    }
  }

  // ── Persist session ──────────────────────────────────────────────────────
  // For DB-backed grades, semester stores 'A'; legacy stored month as string.
  const semesterValue = isDbMode ? 'A' : (month ? String(month) : '上')

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
      diagnostic_tier: isDbMode ? computeDiagnosticTier(score) : null,
    })
    .select('id')
    .single()

  if (error || !session) {
    console.error('Failed to save assessment session:', error)
    return NextResponse.json({ error: '儲存失敗，請重試' }, { status: 500 })
  }

  return NextResponse.json({ session_id: session.id, report_data: reportData })
}
