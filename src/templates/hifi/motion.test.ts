import { describe, it, expect } from 'vitest'
import { slotProgress, revealStyle } from './motion'
import type { Beat } from '../../core/schemas'

const beats: Beat[] = [
  { atMs: 0, slot: 'photo', effect: 'fade-in' },
  { atMs: 800, slot: 'headline', effect: 'rise-in' },
]

describe('slotProgress', () => {
  it('is 0 before the beat, 1 well after', () => {
    expect(slotProgress(beats, 'headline', 0)).toBe(0)
    expect(slotProgress(beats, 'headline', 5000)).toBe(1)
  })
  it('is between 0 and 1 mid-reveal', () => {
    const p = slotProgress(beats, 'headline', 800 + 300)
    expect(p).toBeGreaterThan(0)
    expect(p).toBeLessThan(1)
  })
  it('is 1 for a slot with no beat (always present)', () => {
    expect(slotProgress(beats, 'cta', 0)).toBe(1)
  })
  it('is 1 everywhere when nowMs is Infinity (final frame)', () => {
    expect(slotProgress(beats, 'headline', Infinity)).toBe(1)
  })
})

describe('revealStyle', () => {
  it('fully shown at progress 1 has no transform and full opacity', () => {
    const s = revealStyle('rise-in', 1)
    expect(s.opacity).toBe(1)
    expect(s.transform ?? 'none').toBe('none')
  })
  it('hidden at progress 0 is transparent', () => {
    expect(revealStyle('fade-in', 0).opacity).toBe(0)
  })
})
