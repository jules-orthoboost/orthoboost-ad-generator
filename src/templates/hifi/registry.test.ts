import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { HifiTemplateManifestSchema } from '../../core/schemas'
import { HIFI_TEMPLATES } from './index'

const root = join(__dirname, '..', '..', '..')
const lofiDir = join(root, 'data', 'templates', 'lofi')

const lofi = Object.fromEntries(
  readdirSync(lofiDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const parsed = JSON.parse(readFileSync(join(lofiDir, f), 'utf8'))
      return [parsed.slug, parsed]
    }),
)

describe('hi-fi registry', () => {
  it('keys match each manifest slug', () => {
    for (const [key, { manifest }] of Object.entries(HIFI_TEMPLATES)) {
      expect(key).toBe(manifest.slug)
    }
  })

  it('every manifest validates, refs a real archetype, and uses a subset of its slots', () => {
    for (const { manifest } of Object.values(HIFI_TEMPLATES)) {
      HifiTemplateManifestSchema.parse(manifest)
      const archetype = lofi[manifest.archetype]
      expect(archetype, `archetype ${manifest.archetype} exists`).toBeTruthy()
      const archetypeSlots: string[] = archetype.slots
      for (const slot of manifest.slots) {
        expect(archetypeSlots).toContain(slot)
      }
    }
  })
})
