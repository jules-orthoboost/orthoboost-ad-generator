import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { PersonaSchema, LofiTemplateSchema, BrandKitSchema } from './schemas'

// Validates the actual JSON data files committed to the repo.
const root = join(__dirname, '..', '..')

function jsonFiles(dir: string): [string, unknown][] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f, JSON.parse(readFileSync(join(dir, f), 'utf8'))])
}

describe('repo data', () => {
  it('every lo-fi archetype validates and matches its file name', () => {
    const files = jsonFiles(join(root, 'data', 'templates', 'lofi'))
    expect(files.length).toBeGreaterThanOrEqual(5)
    for (const [name, raw] of files) {
      const parsed = LofiTemplateSchema.parse(raw)
      expect(`${parsed.slug}.json`).toBe(name)
    }
  })

  it('every persona validates and matches its file name', () => {
    const files = jsonFiles(join(root, 'data', 'personas'))
    expect(files.length).toBe(11)
    for (const [name, raw] of files) {
      const parsed = PersonaSchema.parse(raw)
      expect(`${parsed.slug}.json`).toBe(name)
    }
  })

  it('every brand kit validates, matches its file name, and refs an existing persona', () => {
    const personaSlugs = new Set(
      readdirSync(join(root, 'data', 'personas'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, '')),
    )
    const files = jsonFiles(join(root, 'data', 'brand-kits'))
    expect(files.length).toBeGreaterThanOrEqual(1)
    for (const [name, raw] of files) {
      const parsed = BrandKitSchema.parse(raw)
      expect(`${parsed.slug}.json`).toBe(name)
      expect(personaSlugs.has(parsed.personaSlug)).toBe(true)
    }
  })
})
