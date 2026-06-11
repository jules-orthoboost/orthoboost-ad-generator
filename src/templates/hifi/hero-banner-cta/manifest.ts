import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'hero-banner-cta',
  name: 'Hero Banner CTA',
  archetype: 'hero-banner-cta',
  suitedPersonas: ['dr-b-nye', 'dr-a-joe', 'dr-c-yang'],
  slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
}
