import { describe, it, expect } from 'vitest'
import { intToTier } from '../difficulty'

describe('intToTier', () => {
  it('maps the documented 1/2/3 scale', () => {
    expect(intToTier(1)).toBe('basic')
    expect(intToTier(2)).toBe('enhancement')
    expect(intToTier(3)).toBe('advanced')
  })
  it('clamps out-of-range values instead of throwing', () => {
    expect(intToTier(0)).toBe('basic')
    expect(intToTier(5)).toBe('advanced')
  })
})
