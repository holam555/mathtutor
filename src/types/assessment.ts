// Shared types for the 學前評估 feature — no server-only imports here

export type AssessmentAnswer = {
  question_id: string
  question_text: string
  question_type: string
  correct_answer: string
  student_answer: string
  is_correct: boolean
  category_id: string
  category_code: string
  module_name: string
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
  priority: '最高優先' | '高優先' | '中優先'
  errorTypes: string[]
  rootCause: string
  solutions: { title: string; detail: string }[]
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
  // legacy fields kept for old records
  nextSteps?: string[]
}
