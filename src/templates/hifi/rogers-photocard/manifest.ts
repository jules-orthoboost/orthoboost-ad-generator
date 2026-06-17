import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'rogers-photocard',
  name: 'Rogers Photo Card',
  archetype: 'rogers-photocard',
  suitedPersonas: ['dr-m-rogers'],
  slots: ['headline', 'subhead', 'offer', 'cta', 'photo', 'logo'],
}
