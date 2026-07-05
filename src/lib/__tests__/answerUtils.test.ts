import { describe, it, expect } from 'vitest'
import { normalizeAnswer, isAnswerCorrect } from '../answerUtils'

// Grading is exact string comparison after normalization — these tests pin
// the normalization rules that CLAUDE.md documents (space-format mixed
// numbers, 又-compatibility for legacy data, fraction spacing).

describe('normalizeAnswer', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeAnswer('  60  ')).toBe('60')
    expect(normalizeAnswer('1   5/8')).toBe('1 5/8')
  })

  it('treats 又-notation as equivalent to space-format mixed numbers', () => {
    expect(normalizeAnswer('3又1/2')).toBe('3 1/2')
    expect(normalizeAnswer('1又5/8')).toBe(normalizeAnswer('1 5/8'))
  })

  it('normalizes fraction slash spacing', () => {
    expect(normalizeAnswer('5 / 18')).toBe('5/18')
  })

  it('lowercases (MCQ option letters)', () => {
    expect(normalizeAnswer('B. 三百五十萬')).toBe('b. 三百五十萬')
  })

  it('converts full-width punctuation', () => {
    expect(normalizeAnswer('1，2')).toBe('1,2')
    expect(normalizeAnswer('1 , 2')).toBe('1,2')
    expect(normalizeAnswer('3。5')).toBe('3.5')
  })

  it('normalizes operator spacing', () => {
    expect(normalizeAnswer('2 + 3')).toBe('2+3')
    expect(normalizeAnswer('7 - 4')).toBe('7-4')
  })
})

describe('isAnswerCorrect', () => {
  it('accepts legacy 又 answers against space-format keys', () => {
    expect(isAnswerCorrect('1又5/8', '1 5/8')).toBe(true)
    expect(isAnswerCorrect('1 5/8', '1又5/8')).toBe(true)
  })

  it('accepts case/spacing variants of MCQ options', () => {
    expect(isAnswerCorrect('b. 答案', 'B. 答案')).toBe(true)
  })

  it('rejects genuinely different answers', () => {
    expect(isAnswerCorrect('1/2', '2/1')).toBe(false)
    expect(isAnswerCorrect('61', '60')).toBe(false)
  })

  it('does NOT equate mathematically-equal but differently-written values (documented limitation)', () => {
    // Grading is string-based: 0.5 vs 1/2 are distinct. MCQ authoring rules
    // (CLAUDE.md C4) forbid coexisting equivalent options for this reason.
    expect(isAnswerCorrect('0.5', '1/2')).toBe(false)
  })
})
