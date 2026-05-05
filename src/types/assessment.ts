// Shared types for the 學前評估 feature — no server-only imports here

export type DifficultyTier = 'basic' | 'enhancement' | 'advanced'

// Marks per tier (matches P3 assessment template):
//   basic 3, enhancement 5, advanced 10. Total 20 Qs = 100 marks.
export const TIER_MARKS: Record<DifficultyTier, number> = {
  basic: 3,
  enhancement: 5,
  advanced: 10,
}

// Target quota per assessment.  Total = 20.
// advanced is intentionally low (2) because the active pool only has ~26
// advanced questions across all topics — a 4-per-assessment target made
// most single-topic / single-unit selections unable to reach 20 questions.
// The selector also has cross-tier fallback (see assessmentSelection.ts)
// so if a chosen scope has 0 advanced, the slot is taken from enhancement
// or basic instead.
export const TIER_QUOTA: Record<DifficultyTier, number> = {
  basic: 10,
  enhancement: 8,
  advanced: 2,
}

export type AssessmentAnswer = {
  question_id: string
  question_text: string
  question_type: string
  correct_answer: string
  student_answer: string
  is_correct: boolean
  // legacy fields (kept for old P5/P6 hardcoded sessions)
  category_id: string
  category_code: string
  module_name: string
  // P3 new schema:
  topic_id?: string | null
  topic_name?: string | null
  unit_id?: string | null
  unit_name?: string | null
  difficulty_tier?: DifficultyTier | null
  group_id?: string | null
  sub_order?: number | null
}

export type AssessmentQuestion = {
  id: string
  category_id: string
  question_text: string
  question_image_url: string | null
  question_type: 'multiple_choice' | 'fill_in' | 'fill_in_number' | 'calculation'
  options: string[] | null
  correct_answer: string
  difficulty: number
  is_active: boolean
  created_at: string
  category?: { id: string; name: string; code: string }
  module_name: string
  // P3 new schema additions:
  topic_id?: string | null
  topic_name?: string | null
  unit_id?: string | null
  unit_name?: string | null
  difficulty_tier?: DifficultyTier | null
  group_id?: string | null
  sub_order?: number | null
  image_alt_text?: string | null
}

// Curriculum tree returned by /api/assessment/curriculum
export type CurriculumTopic = {
  id: string
  name: string
  lesson_number: number
  display_order: number
}

export type CurriculumUnit = {
  id: string
  name: string
  textbook_ref: string
  unit_number: number
  semester: 'A' | 'B'
  display_order: number
  topics: CurriculumTopic[]
}

export type Rating = 'S' | 'A' | 'B' | 'C'

export type ModuleResult = {
  name: string
  correct: number
  total: number
  rating: Rating
  wrongCategoryCodes: string[]
  comment?: string
}

export type StrongArea = {
  title: string       // e.g. "分數比較理解"
  observation: string // 2 sentences of specific observation
  tip: string         // actionable maintenance tip
}

export type WeakArea = {
  name: string
  priority: '急需加強' | '需要加強' | '可以加強'
  errorTypes: string[]
  rootCause: string
  solutions: { title: string; detail: string }[]
}

// P3 diagnostic tier (per the user's assessment rubric)
export type DiagnosticTier = 'advanced' | 'basic_mastery' | 'weak'

export const DIAGNOSTIC_TIER_LABELS: Record<DiagnosticTier, { title: string; description: string; emoji: string; color: string }> = {
  advanced: {
    title: '基礎極為紮實，靈活運用突出',
    description: '已具備後續課程入學能力，可匹配拔尖拓展教學計劃，提前滲透後續課程重點考點。',
    emoji: '🎯',
    color: 'teal',
  },
  basic_mastery: {
    title: '基礎基本掌握，需強化綜合解題',
    description: '具備基本計算與應用能力，但靈活運用、綜合解題能力不足。需針對性強化兩步及以上應用題、分數基礎、有餘數除法等核心模塊，鞏固後順利銜接。',
    emoji: '📚',
    color: 'amber',
  },
  weak: {
    title: '基礎薄弱，需先進行補強',
    description: '核心計算、基礎概念存在明顯漏洞。需先進行基礎知識補強，為後續課程學習打下基礎。',
    emoji: '⚠️',
    color: 'orange',
  },
}

export function computeDiagnosticTier(score: number): DiagnosticTier {
  if (score >= 80) return 'advanced'
  if (score >= 50) return 'basic_mastery'
  return 'weak'
}

// 大/小單元 mastery summary (separate from legacy modules)
export type UnitMastery = {
  unit_id: string
  unit_name: string
  textbook_ref: string
  correct_marks: number
  total_marks: number
  pct: number             // 0–100
  rating: Rating
}

export type TopicMastery = {
  topic_id: string
  topic_name: string
  unit_id: string
  unit_name: string
  correct_marks: number
  total_marks: number
  pct: number
  rating: Rating
}

export type ReportData = {
  modules: ModuleResult[]
  totalCorrect: number
  totalQuestions: number
  score: number             // 0–100
  band: string              // 'Band 1' | 'Band 2' | 'Band 3'
  bandDescription: string
  strongAreas: StrongArea[]
  weakAreas: WeakArea[]
  overallSummary: string
  learningPlan: { priority: string; area: string; action: string }[]
  generatedAt: string
  // P3 new fields:
  diagnosticTier?: DiagnosticTier
  unitMastery?: UnitMastery[]
  topicMastery?: TopicMastery[]   // present only when parent drilled down to topics
  // legacy fields kept for old records
  nextSteps?: string[]
}
