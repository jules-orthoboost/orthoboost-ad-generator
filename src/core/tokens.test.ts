import { describe, it, expect } from 'vitest'
import { resolveTokens } from './tokens'
import type { Persona, BrandKit } from './schemas'
import { contrastRatio } from './contrast'
import { loadBrandKits, loadPersonas } from './data'

const persona = {
  slug: 'dr-b-nye',
  name: 'Dr. B. Nye',
  archetype: 'Science-Driven Holistic Clinic',
  accentColor: '#dd6b20',
  positioning: 'x',
  messagingBehavior: 'x',
  patientBase: ['Adults'],
  exampleClients: [],
  layout: [],
  visualTone: [],
  iconography: [],
  texture: [],
  designPrinciples: [],
  donts: [],
} satisfies Persona

const kit = {
  slug: 'mock-ortho-co',
  clientName: 'Mock Ortho Co',
  personaSlug: 'dr-b-nye',
  colors: { brand: '#1f6feb', ink: '#10243f' },
  typography: { displayFont: 'Fraunces', bodyFont: 'Inter' },
  logo: { assetPath: 'assets/clients/mock-ortho-co/logo.svg' },
  radius: 24,
} satisfies BrandKit

describe('resolveTokens', () => {
  it('takes brand color and fonts from the kit', () => {
    const t = resolveTokens(persona, kit)
    expect(t.brand).toBe('#1f6feb')
    expect(t.ink).toBe('#10243f')
    expect(t.displayFont).toBe('Fraunces')
    expect(t.radius).toBe(24)
  })

  it('falls back to the persona accent when the kit omits accent', () => {
    const t = resolveTokens(persona, kit)
    expect(t.accent).toBe('#dd6b20')
  })

  it('falls back to base defaults when both omit a token', () => {
    const t = resolveTokens(persona, kit)
    expect(t.surface).toBe('#ffffff') // base default
    expect(t.onBrand).toBe('#ffffff')
  })

  it('the kit accent overrides the persona accent', () => {
    const t = resolveTokens(persona, { ...kit, colors: { ...kit.colors, accent: '#00b894' } })
    expect(t.accent).toBe('#00b894')
  })

  it('maps tokens to CSS custom properties', () => {
    const t = resolveTokens(persona, kit)
    const vars = t.cssVars
    expect(vars['--brand']).toBe('#1f6feb')
    expect(vars['--radius']).toBe('24px')
    expect(vars['--display-font']).toContain('Fraunces')
  })
})

describe('resolveTokens — AA legibility pass (§6)', () => {
  it('corrects ink that fails against the surface', () => {
    // Pale ink on a white surface fails AA; the pass must replace it with a legible color.
    const badInk = { ...kit, colors: { brand: '#1f6feb', ink: '#cfcfcf', surface: '#ffffff' } } satisfies BrandKit
    const t = resolveTokens(persona, badInk)
    expect(t.ink).not.toBe('#cfcfcf')
    expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5)
    expect(t.cssVars['--ink']).toBe(t.ink)
    expect(t.surface).toBe('#ffffff') // background preserved
  })

  it('corrects onBrand that fails against the brand', () => {
    // White text on a pale-yellow brand fails AA; the pass must fix onBrand.
    const badOnBrand = { ...kit, colors: { brand: '#ffe066', onBrand: '#ffffff' } } satisfies BrandKit
    const t = resolveTokens(persona, badOnBrand)
    expect(contrastRatio(t.onBrand, t.brand)).toBeGreaterThanOrEqual(4.5)
    expect(t.brand).toBe('#ffe066') // background preserved
  })

  it('leaves already-legible roles unchanged', () => {
    // Dark ink on white + white on a mid blue both pass; nothing should change.
    const t = resolveTokens(persona, kit)
    expect(t.ink).toBe('#10243f')
    expect(t.onBrand).toBe('#ffffff')
  })

  it('guarantees AA text on background for every brand kit (cross-persona)', () => {
    const kits = loadBrandKits()
    const personas = loadPersonas()
    for (const k of Object.values(kits)) {
      const p = personas[k.personaSlug]
      const t = resolveTokens(p, k)
      expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(t.onBrand, t.brand)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
