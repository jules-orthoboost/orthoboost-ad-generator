import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'house-family-plan',
  name: 'Family Plan (Checklist)',
  archetype: 'house-family-plan',
  suitedPersonas: ['dr-g-house'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: false },
}
