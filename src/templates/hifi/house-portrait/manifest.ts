import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'house-portrait',
  name: 'Family Portrait (Premium)',
  archetype: 'house-portrait',
  suitedPersonas: ['dr-g-house'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: true },
}
