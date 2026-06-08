// Marks per question category for 模擬考試試卷.
// Uniform per type — no per-question variation (the user explicitly removed
// long_questions.total_marks because marking is a paper-level concern).
//
//   多項選擇題 (MC) : 1.5 分
//   短答題    (SQ) : 2   分
//   長答題    (LQ) : 6   分

export const MARKS = {
  mc: 1.5,
  sq: 2,
  lq: 6,
} as const

export function marksForQuestionType(question_type: string): number {
  if (question_type === 'multiple_choice') return MARKS.mc
  // fill_in_number is the canonical SQ; fill_in / calculation also count as SQ.
  return MARKS.sq
}

// Strip the trailing ".0" so "1.5" stays but "30.0" becomes "30".
export function formatMarks(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1)
}

// Total possible marks for a paper with the given counts.
export function totalPossibleMarks(input: {
  mc: number
  sq: number
  lq: number
}): number {
  return input.mc * MARKS.mc + input.sq * MARKS.sq + input.lq * MARKS.lq
}
