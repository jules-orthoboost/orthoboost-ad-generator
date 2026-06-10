import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'offer-card',
  name: 'Offer Card',
  archetype: 'offer-card',
  suitedPersonas: ['dr-b-nye', 'dr-mcstuffins', 'dr-v-frizzle'],
  slots: ['offer', 'headline', 'cta', 'photo', 'logo'],
}
