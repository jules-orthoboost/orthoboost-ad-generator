import { useEffect, useState } from 'react'
import { loadBrandKits, loadCampaigns, loadCopyLibrary, loadLofiTemplates, loadPersonas, sharedCopy } from '../core/data'
import { resolveTokens } from '../core/tokens'
import { resolveAsset } from '../core/assets'
import { HIFI_TEMPLATES } from '../templates/hifi'
import { TemplateFrame } from '../templates/hifi/TemplateFrame'
import { applyPreset } from '../templates/hifi/presets'
import type { SizeKey, SlotContent } from '../core/schemas'

const campaigns = loadCampaigns()
const kits = loadBrandKits()
const personas = loadPersonas()
const lofi = loadLofiTemplates()
const copyLib = loadCopyLibrary()

const err = (msg: string) => (
  <div className="render-root" style={{ padding: 40, fontFamily: 'monospace' }}>
    {msg}
  </div>
)

const useRenderReady = (when: boolean) =>
  useEffect(() => {
    if (!when) return
    let done = false
    const ready = () => {
      if (done) return
      done = true
      requestAnimationFrame(() => {
        document.body.dataset.renderReady = '1'
      })
    }
    if (document.fonts?.ready) document.fonts.ready.then(ready)
    else ready()
  }, [when])

/**
 * Chrome-less, 1:1 render of one deliverable, driven by URL params. The harness
 * navigates here per deliverable and screenshots `.render-root`. Two modes:
 *
 *   campaign: /render?campaign=<slug>&version=V1&size=Story[&frame=N&fps=30][&reduced=1]
 *             (`version` is a filename/back-compat token; ignored for content selection)
 *   batch:    /render?batch=<served-url>&i=<index>[&frame=N&fps=30][&reduced=1]
 */
export function RenderView() {
  const params = new URLSearchParams(window.location.search)
  const frame = params.get('frame')
  const fps = Number(params.get('fps') ?? '30')
  const reduced = params.get('reduced') != null
  const frameNowMs = frame != null ? (Number(frame) / fps) * 1000 : undefined
  const batchUrl = params.get('batch')

  if (batchUrl) {
    return (
      <BatchRender
        batchUrl={batchUrl}
        index={Number(params.get('i') ?? '0')}
        frameNowMs={frameNowMs}
        reduced={reduced}
      />
    )
  }
  return (
    <CampaignRender
      campaignSlug={params.get('campaign') ?? ''}
      size={(params.get('size') ?? 'Story') as SizeKey}
      frameNowMs={frameNowMs}
      reduced={reduced}
    />
  )
}

function CampaignRender({
  campaignSlug,
  size,
  frameNowMs,
  reduced,
}: {
  campaignSlug: string
  size: SizeKey
  frameNowMs?: number
  reduced: boolean
}) {
  const campaign = campaigns[campaignSlug]
  const kit = campaign ? kits[campaign.clientSlug] : undefined
  const reg = campaign ? HIFI_TEMPLATES[campaign.hifiTemplateSlug] : undefined
  useRenderReady(true)

  if (!campaign || !kit || !reg) {
    return err(`Render error: missing ${!campaign ? `campaign "${campaignSlug}"` : !kit ? 'brand kit' : 'template'}.`)
  }

  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)
  const archetype = lofi[reg.manifest.archetype]
  // Shared per-persona copy (headline/subhead/cta) wins; per-client content
  // supplies the offer + photo (and may override copy if explicitly set).
  const content = campaign.content
  const shared = sharedCopy(copyLib, campaign.theme, campaign.year, kit.personaSlug)
  const merged = {
    ...content,
    headline: content.headline ?? shared?.headline,
    subhead: content.subhead ?? shared?.subhead,
    cta: content.cta ?? shared?.cta,
    disclaimer: content.disclaimer ?? shared?.disclaimer,
  }
  const resolvedContent = { ...merged, photo: merged.photo ? resolveAsset(merged.photo) : undefined }

  return (
    <div className="render-root">
      <TemplateFrame size={size} tokens={tokens}>
        <reg.Component
          size={size}
          tokens={tokens}
          content={resolvedContent}
          logoUrl={resolveAsset(tokens.logoPath)}
          beats={archetype.videoGrammar.beats}
          durationMs={archetype.videoGrammar.durationMs}
          playing={frameNowMs !== undefined}
          reducedMotion={reduced}
          frameNowMs={frameNowMs}
        />
      </TemplateFrame>
    </div>
  )
}

interface BatchDeliverable {
  name: string
  brand: string
  template: string
  version: 'V1' | 'V2'
  size: SizeKey
  content: SlotContent
}
interface Batch {
  persona: string
  animationStyle?: string
  deliverables: BatchDeliverable[]
}

function BatchRender({
  batchUrl,
  index,
  frameNowMs,
  reduced,
}: {
  batchUrl: string
  index: number
  frameNowMs?: number
  reduced: boolean
}) {
  const [batch, setBatch] = useState<Batch | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch(resolveAsset(batchUrl))
      .then((r) => r.json())
      .then((b: Batch) => setBatch(b))
      .catch((e) => setError(String(e)))
  }, [batchUrl])
  useRenderReady(batch !== null || error !== null)

  if (error) return err(`Batch error: ${error}`)
  if (!batch) return <div className="render-root" />
  const d = batch.deliverables[index]
  if (!d) return err(`No deliverable at index ${index}`)
  const kit = kits[d.brand]
  const reg = HIFI_TEMPLATES[d.template]
  if (!kit || !reg) return err(`Missing brand/template for ${d.name}`)

  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)
  const grammar = lofi[reg.manifest.archetype].videoGrammar
  const motion = applyPreset(grammar.beats, grammar.durationMs, batch.animationStyle)
  const content = { ...d.content, photo: d.content.photo ? resolveAsset(d.content.photo) : undefined }

  return (
    <div className="render-root">
      <TemplateFrame size={d.size} tokens={tokens}>
        <reg.Component
          size={d.size}
          tokens={tokens}
          content={content}
          logoUrl={resolveAsset(tokens.logoPath)}
          beats={motion.beats}
          durationMs={motion.durationMs}
          playing={frameNowMs !== undefined}
          reducedMotion={reduced}
          frameNowMs={frameNowMs}
        />
      </TemplateFrame>
    </div>
  )
}
