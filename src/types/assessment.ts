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

export type ReportData = {
  modules: ModuleResult[]
  totalCorrect: number
  totalQuestions: number
  overallSummary: string
  nextSteps: string[]
  generatedAt: string
}
