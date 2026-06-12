import { describe, it, expect } from 'vitest'
import { clientGate, setupGate, templateGate, contentGate } from './gates'
import type { BrandKit, HifiTemplateManifest, LofiTemplate } from './schemas'

const kit = {
  slug: 'mock-ortho-co',
  clientName: 'Mock Ortho Co',
  personaSlug: 'dr-b-nye',
  colors: { brand: '#1f6feb' },
  logo: { assetPath: 'assets/clients/mock-ortho-co/logo.svg' },
} as BrandKit

const manifest = {
  slug: 'hero-banner-cta',
  name: 'Hero',
  archetype: 'hero-banner-cta',
  suitedPersonas: ['dr-b-nye'],
  slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
} as HifiTemplateManifest

const archetype = {
  slug: 'hero-banner-cta',
  name: 'Hero',
  description: 'x',
  slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
  zones: {
    Story: [
      { slot: 'headline', x: 90, y: 460, w: 900, h: 300, layer: 1, maxLines: 3 },
      { slot: 'subhead', x: 140, y: 790, w: 800, h: 120, layer: 1, maxLines: 2 },
      { slot: 'cta', x: 290, y: 1380, w: 500, h: 110, layer: 2 },
    ],
    Post: [
      { slot: 'headline', x: 90, y: 240, w: 900, h: 260, layer: 1, maxLines: 3 },
      { slot: 'subhead', x: 140, y: 530, w: 800, h: 110, layer: 1, maxLines: 2 },
      { slot: 'cta', x: 290, y: 1090, w: 500, h: 110, layer: 2 },
    ],
  },
  placement: {
    Story: { safeTop: 250, safeBottom: 340, margin: 64 },
    Post: { safeTop: 0, safeBottom: 0, margin: 64 },
  },
  videoGrammar: { durationMs: 10000, fps: 30, loop: true, reducedMotion: 'static', beats: [] },
} as unknown as LofiTemplate

it('clientGate fails with no kit, passes with a valid one', () => {
  expect(clientGate(undefined).ok).toBe(false)
  expect(clientGate(kit).ok).toBe(true)
})

it('setupGate needs all three fields', () => {
  expect(setupGate({}).ok).toBe(false)
  expect(setupGate({ adSetType: 'Seasonal', theme: 'Back To School', year: 2026 }).ok).toBe(true)
})

it('templateGate needs a selected, persona-suited template', () => {
  expect(templateGate(undefined, kit).ok).toBe(false)
  expect(templateGate(manifest, kit).ok).toBe(true)
  expect(templateGate({ ...manifest, suitedPersonas: ['other'] }, kit).missing[0]).toMatch(/persona/i)
})

it('contentGate requires every copy slot + photo for both versions', () => {
  const empty = { V1: { content: {} }, V2: { content: {} } }
  expect(contentGate(manifest, archetype, empty).ok).toBe(false)
  const full = {
    V1: { content: { headline: 'Hi', subhead: 'There', cta: 'Book', photo: 'p.svg' } },
    V2: { content: { headline: 'Hi', subhead: 'There', cta: 'Book', photo: 'q.svg' } },
  }
  expect(contentGate(manifest, archetype, full).ok).toBe(true)
})

it('contentGate flags copy that does not fit its zone', () => {
  const long = 'word '.repeat(60).trim()
  const full = {
    V1: { content: { headline: long, subhead: 'There', cta: 'Book', photo: 'p.svg' } },
    V2: { content: { headline: 'Hi', subhead: 'There', cta: 'Book', photo: 'q.svg' } },
  }
  const r = contentGate(manifest, archetype, full)
  expect(r.ok).toBe(false)
  expect(r.missing.join(' ')).toMatch(/headline/i)
})
