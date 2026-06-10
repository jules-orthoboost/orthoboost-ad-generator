import type { z } from 'zod'
import { PersonaSchema, LofiTemplateSchema, BrandKitSchema } from './schemas'

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
