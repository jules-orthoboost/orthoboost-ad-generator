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

export type Version = 'V1' | 'V2'

/** Per-client, per-version data: the always-per-client offer + photo, plus an
 * optional "make different" override of the otherwise-shared copy. */
export interface PerClientVersion {
  offer?: string
  photo?: string
  makeDifferent?: boolean
  override?: PersonaCopyVersion // headline / subhead / cta / disclaimer
}

/** The whole linear-builder state: one persona, many brands, one campaign,
 * many templates, shared copy, and per-client offer/photo/overrides. */
export interface FlowDraft {
  personaSlug?: string
  brandSlugs: string[]
  campaignSlug?: string
  templateSlugs: string[]
  shared: { V1: PersonaCopyVersion; V2: PersonaCopyVersion }
  perClient: Record<string, { V1: PerClientVersion; V2: PerClientVersion }>
  animationStyle?: string
}

export const emptyPerClient = (): { V1: PerClientVersion; V2: PerClientVersion } => ({
  V1: {},
  V2: {},
})

/** Final SlotContent for a (version, brand): shared copy, overridden when the
 * client is "make different", plus that client's own offer + photo. */
export function resolveDraftContent(draft: FlowDraft, version: Version, brandSlug: string): SlotContent {
  const shared = draft.shared[version]
  const pc = draft.perClient[brandSlug]?.[version] ?? {}
  const ov = pc.makeDifferent ? pc.override ?? {} : {}
  return {
    headline: ov.headline ?? shared.headline,
    subhead: ov.subhead ?? shared.subhead,
    cta: ov.cta ?? shared.cta,
    disclaimer: ov.disclaimer ?? shared.disclaimer,
    offer: pc.offer,
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
  for (const v of ['V1', 'V2'] as Version[]) {
    if (!d.shared[v].headline?.trim()) missing.push(`${v}: shared headline is empty`)
  }
  for (const b of d.brandSlugs) {
    for (const v of ['V1', 'V2'] as Version[]) {
      if (!d.perClient[b]?.[v]?.offer?.trim()) missing.push(`${b} · ${v}: offer is empty`)
    }
  }
  return result(missing)
}
