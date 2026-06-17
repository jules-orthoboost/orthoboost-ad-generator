import { useEffect } from 'react'
import { loadBrandKits, loadCampaigns, loadCopyLibrary, loadLofiTemplates, loadPersonas, sharedCopy } from '../core/data'
import { resolveTokens } from '../core/tokens'
import { resolveAsset } from '../core/assets'
import { HIFI_TEMPLATES } from '../templates/hifi'
import { TemplateFrame } from '../templates/hifi/TemplateFrame'
import type { SizeKey } from '../core/schemas'

const campaigns = loadCampaigns()
const kits = loadBrandKits()
const personas = loadPersonas()
const lofi = loadLofiTemplates()
const copyLib = loadCopyLibrary()

/**
 * Chrome-less, 1:1 render of a single deliverable, driven entirely by URL params.
 * The harness navigates here per deliverable and screenshots `.render-root`.
 *
 *   /render?campaign=<slug>&version=V1&size=Story[&frame=N&fps=30][&reduced=1]
 */
export function RenderView() {
  const params = new URLSearchParams(window.location.search)
  const campaignSlug = params.get('campaign') ?? ''
  const version = (params.get('version') ?? 'V1') as 'V1' | 'V2'
  const size = (params.get('size') ?? 'Story') as SizeKey
  const frame = params.get('frame')
  const fps = Number(params.get('fps') ?? '30')
  const reduced = params.get('reduced') != null
  const frameNowMs = frame != null ? (Number(frame) / fps) * 1000 : undefined

  const campaign = campaigns[campaignSlug]
  const kit = campaign ? kits[campaign.clientSlug] : undefined
  const reg = campaign ? HIFI_TEMPLATES[campaign.hifiTemplateSlug] : undefined

  useEffect(() => {
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
  }, [])

  if (!campaign || !kit || !reg) {
    return (
      <div className="render-root" style={{ padding: 40, fontFamily: 'monospace' }}>
        Render error: missing {!campaign ? `campaign "${campaignSlug}"` : !kit ? 'brand kit' : 'template'}.
      </div>
    )
  }

  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)
  const archetype = lofi[reg.manifest.archetype]
  // Shared per-persona copy (headline/subhead/cta) wins; per-client content
  // supplies the offer + photo (and may override copy if explicitly set).
  const content = campaign.versions[version].content
  const shared = sharedCopy(copyLib, campaign.theme, campaign.year, kit.personaSlug, version)
  const merged = {
    ...content,
    headline: content.headline ?? shared?.headline,
    subhead: content.subhead ?? shared?.subhead,
    cta: content.cta ?? shared?.cta,
    disclaimer: content.disclaimer ?? shared?.disclaimer,
  }
  const resolvedContent = {
    ...merged,
    photo: merged.photo ? resolveAsset(merged.photo) : undefined,
  }

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
