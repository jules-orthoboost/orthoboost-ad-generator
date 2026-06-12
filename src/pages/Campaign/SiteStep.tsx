import { useState } from 'react'
import { loadPersonas } from '../../core/data'
import { resolveTokens } from '../../core/tokens'
import { resolveAsset } from '../../core/assets'
import { renderSiteHtml, type SiteTokens } from '../../site/renderSiteHtml'
import { exportSiteZip } from '../../site/exportSite'
import type { StepProps } from './CampaignBuilder'

const personas = loadPersonas()

export function SiteStep({ draft, deps }: StepProps) {
  const [width, setWidth] = useState<'mobile' | 'desktop'>('desktop')
  const [busy, setBusy] = useState(false)
  const kit = deps.kit
  if (!kit) return <p className="muted">Finish the earlier steps first.</p>

  const persona = personas[kit.personaSlug]
  const resolved = resolveTokens(persona, kit)
  const tokens: SiteTokens = {
    brand: resolved.brand,
    ink: resolved.ink,
    surface: resolved.surface,
    accent: resolved.accent,
    onBrand: resolved.onBrand,
    displayFont: resolved.displayFont,
    bodyFont: resolved.bodyFont,
  }

  // V1 is the canonical site copy.
  const content = draft.versions.V1.content
  const logoUrl = resolveAsset(resolved.logoPath)
  const photoUrl = content.photo ? resolveAsset(content.photo) : undefined

  const siteInput = {
    clientName: kit.clientName,
    headline: content.headline,
    subhead: content.subhead,
    offer: content.offer,
    cta: content.cta,
    tokens,
  }

  const html = renderSiteHtml({ ...siteInput, logoSrc: logoUrl, photoSrc: photoUrl })

  const download = async () => {
    setBusy(true)
    try {
      await exportSiteZip({ ...siteInput, logoUrl, photoUrl }, draft.clientSlug ?? 'site')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2>Site template</h2>
      <p className="muted">
        A matching landing page built from the V1 copy and the client&apos;s brand tokens. The
        download is a self-contained HTML file (assets inlined) — host it anywhere.
      </p>

      <div className="tpl-controls">
        <div className="seg">
          {(['desktop', 'mobile'] as const).map((w) => (
            <button key={w} className={width === w ? 'on' : ''} onClick={() => setWidth(w)}>
              {w === 'desktop' ? 'Desktop' : 'Mobile'}
            </button>
          ))}
        </div>
        <button className="ctl btn" disabled={busy} onClick={download}>
          {busy ? 'Packaging…' : 'Download site zip'}
        </button>
      </div>

      <div className={`cb-site-frame ${width}`}>
        <iframe title="Site preview" srcDoc={html} sandbox="" />
      </div>
    </div>
  )
}
