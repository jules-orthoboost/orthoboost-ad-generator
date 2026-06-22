import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'joe-value-card',
  name: 'Value Card (Price-led)',
  archetype: 'joe-value-card',
  suitedPersonas: ['dr-a-joe'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: true },
}
