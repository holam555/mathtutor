export interface QuestionCategory {
  id: string
  name: string
  name_en: string | null
  grade: number
  semester: string
  code: string
  description: string | null
  created_at: string
}

export interface Question {
  id: string
  category_id: string
  question_text: string
  question_image_url: string | null
  question_type: 'multiple_choice' | 'fill_in' | 'fill_in_number' | 'calculation'
  options: string[] | null
  correct_answer: string
  difficulty: number
  source: string | null
  school_name: string | null
  exam_year: number | null
  is_active: boolean
  created_at: string
  // Joined fields
  category?: QuestionCategory
}

export interface StudentProfile {
  id: string
  name: string
  grade: number | null
  parent_id: string | null
  school_name: string | null
  created_at: string
}

export interface ParentProfile {
  id: string
  name: string
  phone: string | null
  token_balance: number
  created_at: string
}

export interface PracticeSession {
  id: string
  student_id: string
  session_type: 'new' | 'retry_wrong' | 'category'
  category_id: string | null
  started_at: string
  completed_at: string | null
  total_questions: number
  correct_count: number | null
}

export interface AnswerRecord {
  id: string
  session_id: string
  student_id: string
  question_id: string
  question_source: 'questions' | 'generated_questions'
  student_answer: string
  is_correct: boolean
  time_spent_seconds: number | null
  answered_at: string
}

export interface WrongQuestionBank {
  id: string
  student_id: string
  question_id: string
  question_source: string
  category_id: string
  wrong_count: number
  correct_streak: number
  last_wrong_at: string
  is_resolved: boolean
  // Joined fields
  question?: Question
  category?: QuestionCategory
}
