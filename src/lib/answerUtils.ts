/**
 * Normalize an answer string for comparison.
 * Handles: case, whitespace, full-width chars, fraction spacing.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')           // collapse whitespace
    .replace(/，/g, ',')            // full-width comma → half-width
    .replace(/\s*,\s*/g, ',')       // strip spaces around comma
    .replace(/。/g, '.')            // full-width period
    .replace(/\s*\/\s*/g, '/')      // normalize fraction spacing
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s*-\s*/g, '-')
    .replace(/又/g, ' ')            // "3又1/2" → "3 1/2"
    .trim()
}

export function isAnswerCorrect(studentAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(studentAnswer) === normalizeAnswer(correctAnswer)
}
