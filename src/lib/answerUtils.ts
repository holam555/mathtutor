/**
 * Normalize an answer string for comparison.
 * Handles: case, whitespace, full-width chars, fraction spacing.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/，/g, ',')            // full-width comma → half-width
    .replace(/。/g, '.')            // full-width period
    .replace(/又/g, ' ')            // "3又1/2" → "3 1/2"
    .replace(/\s+/g, ' ')           // collapse whitespace — must run AFTER 又→space ("3 又 1/2")
    .replace(/\s*,\s*/g, ',')       // strip spaces around comma
    .replace(/\s*\/\s*/g, '/')      // normalize fraction spacing
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s*-\s*/g, '-')
    .trim()
}

export function isAnswerCorrect(studentAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(studentAnswer) === normalizeAnswer(correctAnswer)
}
