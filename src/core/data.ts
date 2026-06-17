import type { z } from 'zod'
import { PersonaSchema, LofiTemplateSchema, BrandKitSchema, CampaignSchema } from './schemas'

/** Parse every file against the schema; throw with the offending path on failure. */
export function validateAll<S extends z.ZodType<{ slug: string }>>(
  schema: S,
  files: Record<string, unknown>,
): Record<string, z.infer<S>> {
  const out: Record<string, z.infer<S>> = {}
  for (const [path, raw] of Object.entries(files)) {
    const res = schema.safeParse(raw)
    if (!res.success) {
      const detail = res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`${path}: ${detail}`)
    }
    out[res.data.slug] = res.data
  }
  return out
}

// App-side loaders. Exercised by the build, not unit tests (import.meta.glob is Vite-only).
export function loadPersonas() {
  return validateAll(
    PersonaSchema,
    import.meta.glob('/data/personas/*.json', { eager: true, import: 'default' }),
  )
}

export function loadLofiTemplates() {
  return validateAll(
    LofiTemplateSchema,
    import.meta.glob('/data/templates/lofi/*.json', { eager: true, import: 'default' }),
  )
}

export function loadBrandKits() {
  return validateAll(
    BrandKitSchema,
    import.meta.glob('/data/brand-kits/*.json', { eager: true, import: 'default' }),
  )
}

export function loadCampaigns() {
  return validateAll(
    CampaignSchema,
    import.meta.glob('/data/campaigns/*.json', { eager: true, import: 'default' }),
  )
}

/** Persona-shared copy: headline/subhead/cta authored once per persona, per campaign.
 * Keyed by `${campaignTheme}|${year}` (case-insensitive theme). Offers are intentionally
 * NOT here — they are per-client (see brand kit / campaign content). */
export interface PersonaCopyVersion {
  headline?: string
  subhead?: string
  cta?: string
  disclaimer?: string
}
export interface CopyLibraryEntry {
  campaignTheme: string
  year: number
  personas: Record<string, { V1?: PersonaCopyVersion; V2?: PersonaCopyVersion }>
}
const copyKey = (theme: string, year: number) => `${theme.trim().toLowerCase()}|${year}`

export function loadCopyLibrary(): Record<string, CopyLibraryEntry> {
  const files = import.meta.glob('/data/copy/*.json', { eager: true, import: 'default' })
  const out: Record<string, CopyLibraryEntry> = {}
  for (const raw of Object.values(files) as CopyLibraryEntry[]) {
    out[copyKey(raw.campaignTheme, raw.year)] = raw
  }
  return out
}

/** Shared headline/subhead/cta for a persona on a campaign, or undefined if none authored. */
export function sharedCopy(
  lib: Record<string, CopyLibraryEntry>,
  theme: string,
  year: number,
  personaSlug: string,
  version: 'V1' | 'V2',
): PersonaCopyVersion | undefined {
  return lib[copyKey(theme, year)]?.personas?.[personaSlug]?.[version]
}

/** Served URLs for every photo in the committed library. */
export function loadPhotoLibrary(): string[] {
  const files = import.meta.glob('/public/assets/photos/**/*.{svg,jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  })
  return Object.values(files as Record<string, string>).sort()
}
