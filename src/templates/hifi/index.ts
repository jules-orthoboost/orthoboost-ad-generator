import type { RegisteredTemplate } from './types'
import { manifest as heroManifest } from './hero-banner-cta/manifest'
import { Component as HeroComponent } from './hero-banner-cta/Template'
import { manifest as offerManifest } from './offer-card/manifest'
import { Component as OfferComponent } from './offer-card/Template'
import { manifest as rogersDiscManifest } from './rogers-disc/manifest'
import { Component as RogersDiscComponent } from './rogers-disc/Template'
import { manifest as rogersPhotocardManifest } from './rogers-photocard/manifest'
import { Component as RogersPhotocardComponent } from './rogers-photocard/Template'
import { manifest as rogersFullbleedManifest } from './rogers-fullbleed/manifest'
import { Component as RogersFullbleedComponent } from './rogers-fullbleed/Template'

export const HIFI_TEMPLATES: Record<string, RegisteredTemplate> = {
  [heroManifest.slug]: { manifest: heroManifest, Component: HeroComponent },
  [offerManifest.slug]: { manifest: offerManifest, Component: OfferComponent },
  [rogersDiscManifest.slug]: { manifest: rogersDiscManifest, Component: RogersDiscComponent },
  [rogersPhotocardManifest.slug]: { manifest: rogersPhotocardManifest, Component: RogersPhotocardComponent },
  [rogersFullbleedManifest.slug]: { manifest: rogersFullbleedManifest, Component: RogersFullbleedComponent },
}
