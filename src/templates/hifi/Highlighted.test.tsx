import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Highlighted } from './Highlighted'
import type { ResolvedTokens } from '../../core/tokens'

const tokens = {
  brand: '#1f6feb', ink: '#10243f', surface: '#ffffff', accent: '#ffd166', onBrand: '#ffffff',
  displayFont: 'Inter', bodyFont: 'Inter', radius: 16, logoPath: '', clientName: 'X',
  valueProps: [], cssVars: {},
} as ResolvedTokens

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>)

describe('Highlighted', () => {
  it('renders plain text with no ranges', () => {
    const out = html(<Highlighted text="Back to school" tokens={tokens} />)
    expect(out).toBe('Back to school')
    expect(out).not.toContain('<mark')
  })

  it('wraps a single range in a mark and keeps the surrounding text', () => {
    const out = html(<Highlighted text="Back to school" ranges={[{ start: 5, end: 7 }]} tokens={tokens} />)
    expect(out).toContain('Back ')
    expect(out).toContain('<mark')
    expect(out).toContain('to')
    expect(out).toContain(' school')
  })

  it('clips out-of-bounds ranges instead of throwing', () => {
    const out = html(<Highlighted text="Hi" ranges={[{ start: 1, end: 99 }]} tokens={tokens} />)
    expect(out).toContain('<mark')
    expect(out).toContain('i')
  })

  it('normalizes unsorted/overlapping ranges', () => {
    const out = html(
      <Highlighted text="abcdef" ranges={[{ start: 4, end: 6 }, { start: 0, end: 2 }, { start: 1, end: 3 }]} tokens={tokens} />,
    )
    // 'ab' (+overlap to c) ... 'ef' highlighted; no crash, two or three marks.
    expect((out.match(/<mark/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('subtracts the offset (per-line rendering)', () => {
    // Global range 10..12 on a line that starts at global offset 8 -> local 2..4.
    const out = html(<Highlighted text="abcdef" ranges={[{ start: 10, end: 12 }]} tokens={tokens} offset={8} />)
    expect(out).toContain('<mark')
    expect(out).toContain('cd')
  })
})
