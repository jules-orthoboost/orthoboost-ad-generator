import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'yang-spec-sheet',
  name: 'Spec Sheet (Authority)',
  archetype: 'yang-spec-sheet',
  suitedPersonas: ['dr-c-yang'],
  slots: ['photo', 'logo', 'badge', 'headline', 'subhead', 'offer', 'cta', 'disclaimer'],
  fields: { richOffer: true, socialProof: true },
}
