// Fisher–Yates shuffle, shared by the assessment and mock-exam selectors.

/** Shuffle `arr` in place and return it. */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Return a shuffled copy; the input array is left untouched. */
export function shuffle<T>(arr: readonly T[]): T[] {
  return shuffleInPlace([...arr])
}
