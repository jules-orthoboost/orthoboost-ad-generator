import { describe, it, expect } from 'vitest'
import { estimateFit } from './fit'

describe('estimateFit', () => {
  it('short text fits one line', () => {
    const r = estimateFit({ text: 'New braces', widthPx: 900, fontSizePx: 100, maxLines: 3 })
    expect(r.fits).toBe(true)
    expect(r.lines).toBe(1)
  })
  it('long text overflows the line cap', () => {
    const r = estimateFit({
      text: 'Back to school, back to confident smiles for the whole family this year',
      widthPx: 700,
      fontSizePx: 120,
      maxLines: 2,
    })
    expect(r.lines).toBeGreaterThan(2)
    expect(r.fits).toBe(false)
  })
  it('empty text fits with zero lines', () => {
    expect(estimateFit({ text: '', widthPx: 500, fontSizePx: 80, maxLines: 3 })).toEqual({
      fits: true,
      lines: 0,
      charsPerLine: expect.any(Number),
    })
  })
})
