import { loadBrandKits } from '../../core/data'
import { deliverableName, type Size, type Version } from '../../core/naming'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import { resolveDraftContent } from '../../core/gates'
import { DeliverablePreview } from './DeliverablePreview'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()
const PREVIEW_CAP = 24

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportStep({ draft, deps }: StepProps) {
  const { persona, campaign, kits: selKits, templates } = deps
  if (!persona || !campaign || selKits.length === 0 || templates.length === 0) {
    return <p className="muted">Finish the earlier steps first.</p>
  }

  const versions: Version[] = ['V1', 'V2']
  const sizes: Size[] = ['Story', 'Post']
  const total = selKits.length * templates.length * versions.length * sizes.length

  // Live preview tiles: one per (brand × template) at V1 / Post.
  const tiles = selKits.flatMap((kit) =>
    templates.map((t) => ({ kit, templateSlug: t.manifest.slug })),
  )

  const buildConfig = () => ({
    persona: persona.slug,
    campaign: {
      slug: campaign.slug,
      name: campaign.name,
      year: campaign.year,
      adSetType: campaign.adSetType,
    },
    animationStyle: draft.animationStyle ?? 'none',
    deliverables: selKits.flatMap((kit) =>
      templates.flatMap((t) =>
        versions.flatMap((version) =>
          sizes.map((size) => ({
            name: deliverableName({
              adSetType: campaign.adSetType,
              theme: campaign.name,
              year: campaign.year,
              creativeType: 'Image',
              version,
              size,
              clientName: kit.clientName,
            }),
            brand: kit.slug,
            template: t.manifest.slug,
            version,
            size,
            content: resolveDraftContent(draft, version, kit.slug),
          })),
        ),
      ),
    ),
  })

  return (
    <div>
      <h2>Export — {persona.name}</h2>
      <p className="muted">
        {selKits.length} brands × {templates.length} templates × {versions.length} versions ×{' '}
        {sizes.length} sizes = <strong>{total} deliverables</strong>, grouped under {persona.name}.
      </p>

      <div className="cb-export-actions">
        <button
          className="cb-nav primary"
          onClick={() => download(`${persona.slug}_${campaign.slug}_batch.json`, buildConfig())}
        >
          Download batch config
        </button>
        <span className="muted">Hand to the render harness for PNG/MP4 finals (foldered by persona).</span>
      </div>

      <h3>
        Preview · V1 / Post ({Math.min(tiles.length, PREVIEW_CAP)} of {tiles.length})
      </h3>
      <div className="cb-qa-grid">
        {tiles.slice(0, PREVIEW_CAP).map(({ kit, templateSlug }) => (
          <figure key={`${kit.slug}-${templateSlug}`} className="cb-qa-tile">
            <DeliverablePreview
              draft={draft}
              kit={kits[kit.slug]}
              templateSlug={templateSlug}
              version="V1"
              size="Post"
              fitHeight={300}
            />
            <figcaption>
              {kit.clientName} · {HIFI_TEMPLATES[templateSlug].manifest.name}
            </figcaption>
          </figure>
        ))}
      </div>
      {tiles.length > PREVIEW_CAP && (
        <p className="muted">+{tiles.length - PREVIEW_CAP} more in the batch config.</p>
      )}
    </div>
  )
}
