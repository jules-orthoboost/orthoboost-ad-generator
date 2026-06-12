import { describe, it, expect } from 'vitest'
import { renderSiteHtml } from './renderSiteHtml'

const html = renderSiteHtml({
  clientName: 'Mock Ortho Co',
  headline: 'Back to school, brighter smiles',
  subhead: 'Free consults all August.',
  offer: '$500 off',
  cta: 'Book a free consult',
  logoSrc: 'data:image/svg+xml;base64,AAA',
  photoSrc: 'data:image/svg+xml;base64,BBB',
  tokens: {
    brand: '#1f6feb',
    ink: '#10243f',
    surface: '#ffffff',
    accent: '#16b8a6',
    onBrand: '#ffffff',
    displayFont: 'Fraunces',
    bodyFont: 'Inter',
  },
})

describe('renderSiteHtml', () => {
  it('is a complete standalone document', () => {
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('</html>')
    expect(html).toContain('<style>')
  })
  it('embeds copy, client name, and assets', () => {
    for (const s of [
      'Back to school, brighter smiles',
      'Mock Ortho Co',
      '$500 off',
      'Book a free consult',
      'data:image/svg+xml;base64,AAA',
      'data:image/svg+xml;base64,BBB',
    ])
      expect(html).toContain(s)
  })
  it('uses brand tokens, not hardcoded colors', () => {
    expect(html).toContain('--brand: #1f6feb')
    expect(html).toContain('Fraunces')
  })
  it('escapes interpolated copy', () => {
    const evil = renderSiteHtml({
      clientName: 'A & B <Ortho>',
      headline: 'x',
      cta: 'y',
      logoSrc: 'l',
      tokens: {
        brand: '#000000', ink: '#000000', surface: '#ffffff', accent: '#000000',
        onBrand: '#ffffff', displayFont: 'Inter', bodyFont: 'Inter',
      },
    })
    expect(evil).toContain('A &amp; B &lt;Ortho&gt;')
    expect(evil).not.toContain('<Ortho>')
  })
})
