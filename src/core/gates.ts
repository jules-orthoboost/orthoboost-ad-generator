import type { LofiTemplate, SizeKey, SlotContent } from './schemas'
import { estimateFit } from './fit'
import type { PersonaCopyVersion } from './data'

export interface GateResult {
  ok: boolean
  missing: string[]
}
const result = (missing: string[]): GateResult => ({ ok: missing.length === 0, missing })

// Copy slots a human types (logo/photo handled separately).
export const COPY_SLOTS = ['headline', 'subhead', 'offer', 'cta', 'disclaimer', 'badge'] as const

// Representative preview font size per slot for the fit heuristic (px on the 1080 canvas).
export const SLOT_FONT_PX: Record<string, number> = {
  headline: 112,
  subhead: 44,
  offer: 130,
  cta: 44,
  disclaimer: 26,
  badge: 40,
}

/** Per-client, per-version data: the always-per-client offer + photo, plus an
 * optional "make different" override of the otherwise-shared copy. */
export interface PerClientVersion {
  offer?: string
  photo?: string
  // Structured-offer decorations (templates with manifest.fields.richOffer).
  offerLabel?: string
  offerUnit?: string
  offerFine?: string
  // Social-proof line (templates with manifest.fields.socialProof).
  rating?: string
  socialProof?: string
  makeDifferent?: boolean
  override?: PersonaCopyVersion // headline / subhead / cta / disclaimer
}

export interface FlowDraft {
  personaSlug?: string
  brandSlugs: string[]
  campaignSlug?: string
  templateSlugs: string[]
  shared: PersonaCopyVersion
  perClient: Record<string, PerClientVersion>
  animationStyle?: string
}

export const emptyPerClient = (): PerClientVersion => ({})

/** Final SlotContent for a brand: shared copy, overridden when the client is
 * "make different", plus that client's own offer + photo. */
export function resolveDraftContent(draft: FlowDraft, brandSlug: string): SlotContent {
  const shared = draft.shared
  const pc = draft.perClient[brandSlug] ?? {}
  const ov = pc.makeDifferent ? pc.override ?? {} : {}
  return {
    headline: ov.headline ?? shared.headline,
    subhead: ov.subhead ?? shared.subhead,
    cta: ov.cta ?? shared.cta,
    disclaimer: ov.disclaimer ?? shared.disclaimer,
    offer: pc.offer,
    offerLabel: pc.offerLabel,
    offerUnit: pc.offerUnit,
    offerFine: pc.offerFine,
    rating: pc.rating,
    socialProof: pc.socialProof,
    photo: pc.photo,
  }
}

/** First fit problem for a string against a set of archetypes, or null if it fits all. */
export function fitProblem(text: string, archetypes: LofiTemplate[], slot: string): string | null {
  if (!text.trim()) return null
  for (const a of archetypes) {
    for (const size of ['Story', 'Post'] as SizeKey[]) {
      const zone = a.zones[size].find((z) => z.slot === slot)
      if (!zone) continue
      const r = estimateFit({
        text,
        widthPx: zone.w,
        fontSizePx: SLOT_FONT_PX[slot] ?? 48,
        maxLines: zone.maxLines,
      })
      if (!r.fits) return `too long for ${size} (${r.lines} lines)`
    }
  }
  return null
}

// ---- step gates ----
export const personaGate = (d: FlowDraft) => result(d.personaSlug ? [] : ['Select a persona'])
export const brandsGate = (d: FlowDraft) =>
  result(d.brandSlugs.length ? [] : ['Select at least one brand kit'])
export const campaignGate = (d: FlowDraft) => result(d.campaignSlug ? [] : ['Select a campaign'])
export const templatesGate = (d: FlowDraft) =>
  result(d.templateSlugs.length ? [] : ['Select at least one template'])

export function copyGate(d: FlowDraft): GateResult {
  const missing: string[] = []
  if (!d.shared.headline?.trim()) missing.push('Shared headline is empty')
  for (const b of d.brandSlugs) {
    if (!d.perClient[b]?.offer?.trim()) missing.push(`${b}: offer is empty`)
  }
  return result(missing)
}
