import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'joe-per-day',
  name: 'Per-Day Price (Budget)',
  archetype: 'joe-per-day',
  suitedPersonas: ['dr-a-joe'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: false },
}
