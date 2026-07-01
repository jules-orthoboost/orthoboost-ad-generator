import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'kardashian-glow',
  name: 'Glow (Full-bleed)',
  archetype: 'kardashian-glow',
  suitedPersonas: ['d-k-kardashian'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: true },
}
