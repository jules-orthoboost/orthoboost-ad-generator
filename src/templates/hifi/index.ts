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
import { manifest as joeValueCardManifest } from './joe-value-card/manifest'
import { Component as JoeValueCardComponent } from './joe-value-card/Template'
import { manifest as yangSpecSheetManifest } from './yang-spec-sheet/manifest'
import { Component as YangSpecSheetComponent } from './yang-spec-sheet/Template'
import { manifest as housePortraitManifest } from './house-portrait/manifest'
import { Component as HousePortraitComponent } from './house-portrait/Template'
import { manifest as kardashianEditorialManifest } from './kardashian-editorial/manifest'
import { Component as KardashianEditorialComponent } from './kardashian-editorial/Template'
import { manifest as houseFamilyPlanManifest } from './house-family-plan/manifest'
import { Component as HouseFamilyPlanComponent } from './house-family-plan/Template'

export const HIFI_TEMPLATES: Record<string, RegisteredTemplate> = {
  [heroManifest.slug]: { manifest: heroManifest, Component: HeroComponent },
  [offerManifest.slug]: { manifest: offerManifest, Component: OfferComponent },
  [rogersDiscManifest.slug]: { manifest: rogersDiscManifest, Component: RogersDiscComponent },
  [rogersPhotocardManifest.slug]: { manifest: rogersPhotocardManifest, Component: RogersPhotocardComponent },
  [rogersFullbleedManifest.slug]: { manifest: rogersFullbleedManifest, Component: RogersFullbleedComponent },
  [joeValueCardManifest.slug]: { manifest: joeValueCardManifest, Component: JoeValueCardComponent },
  [yangSpecSheetManifest.slug]: { manifest: yangSpecSheetManifest, Component: YangSpecSheetComponent },
  [housePortraitManifest.slug]: { manifest: housePortraitManifest, Component: HousePortraitComponent },
  [kardashianEditorialManifest.slug]: { manifest: kardashianEditorialManifest, Component: KardashianEditorialComponent },
  [houseFamilyPlanManifest.slug]: { manifest: houseFamilyPlanManifest, Component: HouseFamilyPlanComponent },
}

/** Templates for a persona, optionally gated by campaign.
 * A template with no `suitedCampaigns` is evergreen (fits any campaign). */
export function templatesFor(personaSlug: string, campaignSlug?: string): RegisteredTemplate[] {
  return Object.values(HIFI_TEMPLATES).filter(({ manifest }) => {
    if (!manifest.suitedPersonas.includes(personaSlug)) return false
    if (!campaignSlug || !manifest.suitedCampaigns) return true
    return manifest.suitedCampaigns.includes(campaignSlug)
  })
}
