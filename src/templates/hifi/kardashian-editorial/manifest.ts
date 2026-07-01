import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'kardashian-editorial',
  name: 'Editorial (Luxury)',
  archetype: 'kardashian-editorial',
  suitedPersonas: ['d-k-kardashian'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: true },
}
