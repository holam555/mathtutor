import { NextRequest, NextResponse } from 'next/server'
import { getAssessmentPaper } from '@/data/assessmentQuestions'
import type { AssessmentQuestion } from '@/types/assessment'

// GET /api/assessment/questions?grade=5&month=9
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const grade = parseInt(searchParams.get('grade') ?? '', 10)
  const month = parseInt(searchParams.get('month') ?? '', 10)

  if (!grade || !month) {
    return NextResponse.json({ error: '請提供年級和入學月份' }, { status: 400 })
  }

  const paper = getAssessmentPaper(grade, month)
  if (!paper) {
    return NextResponse.json({ error: '暫未支援該版本評估，敬請期待', empty: true }, { status: 200 })
  }

  const questions: AssessmentQuestion[] = paper.questions.map((q, i) => ({
    id: `hc-${grade}-${month}-${i}`,
    category_id: '',
    question_text: q.question_text,
    question_image_url: null,
    question_type: q.question_type,
    options: q.options ?? null,
    correct_answer: q.correct_answer,
    difficulty: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    category: undefined,
    module_name: q.module_name,
  }))

  const modules = Array.from(new Set(paper.questions.map((q) => q.module_name)))

  return NextResponse.json({ questions, modules })
}
