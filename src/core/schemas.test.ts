import { describe, it, expect } from 'vitest'
import { PersonaSchema, LofiTemplateSchema } from './schemas'

const minimalPersona = {
  slug: 'family-first',
  name: 'Family First',
  archetype: 'Family-Focused Community Ortho',
  accentColor: '#38a169',
  positioning: 'Warm, community-rooted practice for busy families.',
  messagingBehavior: 'Leads with convenience. Plain language, no jargon.',
  patientBase: ['Parents booking for kids 8-15', 'Adult aligner cases'],
  exampleClients: [],
  layout: ['Generous whitespace'],
  visualTone: ['Warm and approachable'],
  iconography: ['Simple line icons'],
  texture: ['Flat, clean backgrounds'],
  designPrinciples: ['Clarity over creativity'],
  donts: ['No clinical/medical imagery'],
}

describe('PersonaSchema', () => {
  it('accepts a complete persona', () => {
    const p = PersonaSchema.parse(minimalPersona)
    expect(p.slug).toBe('family-first')
    expect(p.patientBase).toHaveLength(2)
  })

  it('rejects a bad slug', () => {
    expect(() => PersonaSchema.parse({ ...minimalPersona, slug: 'Family First' })).toThrow()
  })

  it('rejects a bad accent color', () => {
    expect(() => PersonaSchema.parse({ ...minimalPersona, accentColor: 'green' })).toThrow()
  })
})

describe('LofiTemplateSchema', () => {
  const validArchetype = {
    slug: 'hero-banner-cta',
    name: 'Hero / Banner / CTA',
    description: 'Full-bleed photo, headline band, CTA pill bottom-center.',
    slots: ['headline', 'subhead', 'cta', 'offer', 'photo', 'logo'],
    zones: {
      Story: [
        { slot: 'photo', x: 0, y: 0, w: 1080, h: 1920, layer: 0 },
        { slot: 'headline', x: 90, y: 420, w: 900, h: 300, layer: 1, maxLines: 3 },
        { slot: 'cta', x: 290, y: 1380, w: 500, h: 110, layer: 2 },
        { slot: 'logo', x: 440, y: 300, w: 200, h: 80, layer: 2 },
      ],
      Post: [
        { slot: 'photo', x: 0, y: 0, w: 1080, h: 1350, layer: 0 },
        { slot: 'headline', x: 90, y: 220, w: 900, h: 260, layer: 1, maxLines: 3 },
        { slot: 'cta', x: 290, y: 1090, w: 500, h: 110, layer: 2 },
        { slot: 'logo', x: 440, y: 100, w: 200, h: 80, layer: 2 },
      ],
    },
    placement: {
      Story: { safeTop: 250, safeBottom: 340, margin: 64 },
      Post: { safeTop: 0, safeBottom: 0, margin: 64 },
    },
    videoGrammar: {
      durationMs: 10000,
      fps: 30,
      loop: true,
      reducedMotion: 'static',
      beats: [
        { atMs: 0, slot: 'photo', effect: 'fade-in' },
        { atMs: 600, slot: 'headline', effect: 'rise-in' },
        { atMs: 1400, slot: 'cta', effect: 'pop-in' },
      ],
    },
  }

  it('accepts an archetype with zones for both sizes and video grammar', () => {
    const t = LofiTemplateSchema.parse(validArchetype)
    expect(t.zones.Story).toHaveLength(4)
  })

  it('rejects a zone outside the canvas', () => {
    const bad = structuredClone(validArchetype)
    bad.zones.Story[0] = { slot: 'photo', x: 600, y: 0, w: 600, h: 100, layer: 0 }
    expect(() => LofiTemplateSchema.parse(bad)).toThrow(/canvas/)
  })

  it('rejects a beat past the end of the video', () => {
    const bad = structuredClone(validArchetype)
    bad.videoGrammar.beats.push({ atMs: 99999, slot: 'cta', effect: 'pop-in' })
    expect(() => LofiTemplateSchema.parse(bad)).toThrow(/duration/)
  })
})
