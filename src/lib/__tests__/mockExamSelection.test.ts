import { describe, it, expect } from 'vitest'
import {
  selectMockExamQuestions,
  PAPER_TARGET,
  type AssessmentQuestionRow,
  type LongQuestionRow,
} from '../mockExamSelection'
import type { DifficultyTier } from '@/types/assessment'

// Selection is randomized (shuffled pools), so these tests assert
// invariants — section counts, group atomicity, tier accounting — and run
// the group-atomicity check across many iterations to catch flaky splits.

let seq = 0
function aq(
  overrides: Partial<AssessmentQuestionRow> = {}
): AssessmentQuestionRow {
  seq++
  return {
    id: `q-${seq}`,
    topic_id: 'topic-1',
    question_text: `question ${seq}`,
    question_type: 'multiple_choice',
    options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
    correct_answer: 'A. 1',
    image_url: null,
    image_alt_text: null,
    difficulty_tier: 'enhancement',
    group_id: null,
    sub_order: null,
    ...overrides,
  }
}

function lq(tier: DifficultyTier = 'enhancement'): LongQuestionRow {
  seq++
  return {
    id: `lq-${seq}`,
    topic_id: 'topic-1',
    question_text: `long question ${seq}`,
    model_answer: 'model answer',
    difficulty_tier: tier,
    image_url: null,
  }
}

function abundantPool(): { mcSq: AssessmentQuestionRow[]; lqs: LongQuestionRow[] } {
  const mcSq: AssessmentQuestionRow[] = []
  const tiers: DifficultyTier[] = ['basic', 'enhancement', 'advanced']
  for (const tier of tiers) {
    for (let i = 0; i < 20; i++) {
      mcSq.push(aq({ question_type: 'multiple_choice', difficulty_tier: tier }))
      mcSq.push(aq({ question_type: 'fill_in_number', difficulty_tier: tier }))
    }
  }
  const lqs = tiers.flatMap((tier) => Array.from({ length: 5 }, () => lq(tier)))
  return { mcSq, lqs }
}

describe('selectMockExamQuestions', () => {
  it('fills the full 40-question paper from an abundant pool', () => {
    const { mcSq, lqs } = abundantPool()
    const result = selectMockExamQuestions(mcSq, lqs)

    expect(result.mcQuestions.length).toBe(PAPER_TARGET.mc)
    expect(result.sqQuestions.length).toBe(PAPER_TARGET.sq)
    expect(result.lqQuestions.length).toBe(PAPER_TARGET.lq)
  })

  it('accounts every picked question in difficultyActual', () => {
    const { mcSq, lqs } = abundantPool()
    const result = selectMockExamQuestions(mcSq, lqs)
    const counted =
      result.difficultyActual.basic +
      result.difficultyActual.enhancement +
      result.difficultyActual.advanced
    expect(counted).toBe(
      result.mcQuestions.length + result.sqQuestions.length + result.lqQuestions.length
    )
  })

  it('never selects the same question twice', () => {
    const { mcSq, lqs } = abundantPool()
    const result = selectMockExamQuestions(mcSq, lqs)
    const ids = [
      ...result.mcQuestions.map((q) => q.id),
      ...result.sqQuestions.map((q) => q.id),
      ...result.lqQuestions.map((q) => q.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('pulls grouped sub-questions atomically, in sub_order (100 runs)', () => {
    // A 3-part linked question (e.g. Q5(a)(b)(c) sharing a figure) must
    // never be split — students would see "(b)" without the shared setup.
    for (let run = 0; run < 100; run++) {
      const groupId = `grp-${run}`
      const members = [1, 2, 3].map((subOrder) =>
        aq({
          question_type: 'fill_in_number',
          group_id: groupId,
          sub_order: subOrder,
          difficulty_tier: 'enhancement',
        })
      )
      const memberIds = new Set(members.map((m) => m.id))
      // Sparse filler pool so the group has a high chance of being drawn.
      const filler = Array.from({ length: 10 }, () =>
        aq({ question_type: 'fill_in_number', difficulty_tier: 'enhancement' })
      )

      const result = selectMockExamQuestions([...members, ...filler], [])
      const pickedMembers = result.sqQuestions.filter((q) => memberIds.has(q.id))

      // All-or-none:
      expect([0, 3]).toContain(pickedMembers.length)

      if (pickedMembers.length === 3) {
        // Siblings must appear consecutively and in sub_order.
        const idx = result.sqQuestions.findIndex((q) => memberIds.has(q.id))
        const slice = result.sqQuestions.slice(idx, idx + 3)
        expect(slice.map((q) => q.sub_order)).toEqual([1, 2, 3])
      }
    }
  })

  it('handles a sparse pool without crashing or duplicating', () => {
    const mcSq = [
      aq({ question_type: 'multiple_choice', difficulty_tier: 'basic' }),
      aq({ question_type: 'fill_in_number', difficulty_tier: 'basic' }),
    ]
    const result = selectMockExamQuestions(mcSq, [lq()])
    const total =
      result.mcQuestions.length + result.sqQuestions.length + result.lqQuestions.length
    expect(total).toBeLessThanOrEqual(3)
    expect(result.lqQuestions.length).toBe(1)
  })
})
