import type { Persona, BrandKit } from './schemas'

export interface ResolvedTokens {
  brand: string
  ink: string
  surface: string
  accent: string
  onBrand: string
  displayFont: string
  bodyFont: string
  radius: number
  logoPath: string
  clientName: string
  /** Exactly the brand kit's value props (e.g. benefit chips). Empty if unset. */
  valueProps: string[]
  /** Brand-level contact, for templates with a footer. Undefined when unset. */
  tagline?: string
  website?: string
  phone?: string
  address?: string
  social?: string
  cssVars: Record<string, string>
}

const BASE = {
  brand: '#163055',
  ink: '#1a2332',
  surface: '#ffffff',
  accent: '#29bbf6',
  onBrand: '#ffffff',
  displayFont: 'Inter',
  bodyFont: 'Inter',
  radius: 16,
}

/** Merge brand identity from persona defaults <- brand kit. Pure; shared by preview + harness. */
export function resolveTokens(persona: Persona, kit: BrandKit): ResolvedTokens {
  const c = kit.colors
  const ty = kit.typography
  const resolved = {
    brand: c.brand,
    ink: c.ink ?? BASE.ink,
    surface: c.surface ?? BASE.surface,
    accent: c.accent ?? persona.accentColor ?? BASE.accent,
    onBrand: c.onBrand ?? BASE.onBrand,
    displayFont: ty?.displayFont ?? BASE.displayFont,
    bodyFont: ty?.bodyFont ?? BASE.bodyFont,
    radius: kit.radius ?? BASE.radius,
    logoPath: kit.logo.assetPath,
    clientName: kit.clientName,
    valueProps: kit.valueProps ?? [],
    tagline: kit.tagline,
    website: kit.website,
    phone: kit.phone,
    address: kit.address,
    social: kit.social,
  }
  const stack = (f: string) => `${f}, system-ui, sans-serif`
  return {
    ...resolved,
    cssVars: {
      '--brand': resolved.brand,
      '--ink': resolved.ink,
      '--surface': resolved.surface,
      '--accent': resolved.accent,
      '--on-brand': resolved.onBrand,
      '--display-font': stack(resolved.displayFont),
      '--body-font': stack(resolved.bodyFont),
      '--radius': `${resolved.radius}px`,
    },
  }
}
