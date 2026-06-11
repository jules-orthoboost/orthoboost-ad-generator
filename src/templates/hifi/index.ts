import type { RegisteredTemplate } from './types'
import { manifest as heroManifest } from './hero-banner-cta/manifest'
import { Component as HeroComponent } from './hero-banner-cta/Template'
import { manifest as offerManifest } from './offer-card/manifest'
import { Component as OfferComponent } from './offer-card/Template'

export const HIFI_TEMPLATES: Record<string, RegisteredTemplate> = {
  [heroManifest.slug]: { manifest: heroManifest, Component: HeroComponent },
  [offerManifest.slug]: { manifest: offerManifest, Component: OfferComponent },
}
