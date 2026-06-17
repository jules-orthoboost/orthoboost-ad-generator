import type { BrandKit, HifiTemplateManifest, LofiTemplate, SizeKey, SlotContent } from './schemas'
import { estimateFit } from './fit'

export interface GateResult {
  ok: boolean
  missing: string[]
}
const result = (missing: string[]): GateResult => ({ ok: missing.length === 0, missing })

export interface CampaignDraft {
  clientSlug?: string
  adSetType?: 'Seasonal' | 'Evergreen'
  theme?: string
  year?: number
  hifiTemplateSlug?: string
  versions: { V1: { content: SlotContent }; V2: { content: SlotContent } }
}

export function clientGate(kit?: BrandKit): GateResult {
  if (!kit) return result(['Select a client'])
  const missing: string[] = []
  if (!kit.personaSlug) missing.push('Client has no persona assigned')
  if (!kit.logo?.assetPath) missing.push('Client brand kit has no logo')
  if (!kit.colors?.brand) missing.push('Client brand kit has no brand color')
  return result(missing)
}

export function setupGate(s: { adSetType?: string; theme?: string; year?: number }): GateResult {
  const missing: string[] = []
  if (!s.adSetType) missing.push('Choose an ad set type')
  if (!s.theme?.trim()) missing.push('Enter a theme')
  if (!s.year) missing.push('Enter a year')
  return result(missing)
}

export function templateGate(
  manifest: HifiTemplateManifest | undefined,
  kit?: BrandKit,
): GateResult {
  if (!manifest) return result(['Choose a template'])
  if (kit && !manifest.suitedPersonas.includes(kit.personaSlug)) {
    return result([`Template is not suited to the ${kit.personaSlug} persona`])
  }
  return result([])
}

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

export function contentGate(
  manifest: HifiTemplateManifest,
  archetype: LofiTemplate,
  versions: { V1: { content: SlotContent }; V2: { content: SlotContent } },
): GateResult {
  const missing: string[] = []
  const copySlots = manifest.slots.filter((s): s is (typeof COPY_SLOTS)[number] =>
    (COPY_SLOTS as readonly string[]).includes(s),
  )
  const needsPhoto = manifest.slots.includes('photo')

  for (const v of ['V1', 'V2'] as const) {
    const content = versions[v].content
    if (needsPhoto && !content.photo) missing.push(`${v}: pick a photo`)
    for (const slot of copySlots) {
      const text = (content[slot] ?? '').trim()
      if (!text) {
        missing.push(`${v}: ${slot} is empty`)
        continue
      }
      for (const size of ['Story', 'Post'] as SizeKey[]) {
        const zone = archetype.zones[size].find((z) => z.slot === slot)
        if (!zone) continue
        const r = estimateFit({
          text,
          widthPx: zone.w,
          fontSizePx: SLOT_FONT_PX[slot] ?? 48,
          maxLines: zone.maxLines,
        })
        if (!r.fits) missing.push(`${v}: ${slot} is too long for ${size} (${r.lines} lines)`)
      }
    }
  }
  return result(missing)
}
