import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, relativeLuminance, contrastRatio, meetsAA, pickLegibleColor } from './contrast'

describe('hexToRgb / rgbToHex', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 })
  })
  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 })
  })
  it('round-trips to lowercase 6-digit hex', () => {
    expect(rgbToHex({ r: 255, g: 136, b: 0 })).toBe('#ff8800')
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })
  it('clamps out-of-range channels', () => {
    expect(rgbToHex({ r: 300, g: -5, b: 128 })).toBe('#ff0080')
  })
  it('throws on invalid hex', () => {
    expect(() => hexToRgb('#xyz')).toThrow()
    expect(() => hexToRgb('not-a-color')).toThrow()
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black vs white and symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
  })
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#3182ce', '#3182ce')).toBeCloseTo(1, 5)
  })
})

describe('meetsAA', () => {
  it('uses 4.5 for normal text and 3 for large', () => {
    expect(meetsAA(4.5)).toBe(true)
    expect(meetsAA(4.49)).toBe(false)
    expect(meetsAA(3, { large: true })).toBe(true)
    expect(meetsAA(2.99, { large: true })).toBe(false)
  })
})

describe('pickLegibleColor', () => {
  const ratio = (a: string, b: string) => contrastRatio(a, b)

  it('returns the highest-contrast palette color that passes AA', () => {
    // White bg: navy passes (high contrast), pale-blue fails; navy wins.
    const got = pickLegibleColor('#ffffff', ['#bee3f8', '#1a365d'])
    expect(got).toBe('#1a365d')
    expect(ratio(got, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('still returns an AA-passing color when no palette color passes', () => {
    // Mid-gray bg where neither pale palette color passes: must ramp to a passing tone.
    const bg = '#777777'
    const got = pickLegibleColor(bg, ['#888888', '#909090'])
    expect(ratio(got, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('guarantees AA for mid-gray even with an empty palette', () => {
    const bg = '#777777'
    const got = pickLegibleColor(bg, [])
    expect(ratio(got, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('honors the large-text 3:1 threshold', () => {
    const bg = '#ffffff'
    // A mid-tone that clears 3:1 but not 4.5:1 should be acceptable when large.
    const got = pickLegibleColor(bg, ['#949494'], { large: true })
    expect(ratio(got, bg)).toBeGreaterThanOrEqual(3)
  })

  it('lightens toward white on a dark background', () => {
    const got = pickLegibleColor('#000000', ['#222222'])
    // Forced to ramp; result must pass and be lighter than the failing input.
    expect(ratio(got, '#000000')).toBeGreaterThanOrEqual(4.5)
  })
})
