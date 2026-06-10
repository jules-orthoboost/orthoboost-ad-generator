import { describe, it, expect } from 'vitest'
import { resolveTokens } from './tokens'
import type { Persona, BrandKit } from './schemas'

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
