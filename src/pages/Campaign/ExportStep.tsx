import { loadBrandKits } from '../../core/data'
import { deliverableName, type CreativeType, type Size, type Version } from '../../core/naming'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import { presetDuration } from '../../templates/hifi/presets'
import { resolveDraftContent } from '../../core/gates'
import { Button } from '../../components/catalyst/button'
import { DeliverablePreview } from './DeliverablePreview'
import { StepIntro } from './ui'
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
    return <p className="text-sm text-zinc-500">Finish the earlier steps first.</p>
  }

  const versions: Version[] = ['V1', 'V2']
  const sizes: Size[] = ['Story', 'Post']
  const styleId = draft.animationStyle ?? 'none'
  const types: CreativeType[] = styleId === 'none' ? ['Image'] : ['Image', 'Video']
  const total = selKits.length * templates.length * versions.length * sizes.length * types.length

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
    animationStyle: styleId,
    deliverables: selKits.flatMap((kit) =>
      templates.flatMap((t) =>
        versions.flatMap((version) =>
          sizes.flatMap((size) =>
            types.map((creativeType) => ({
              name: deliverableName({
                adSetType: campaign.adSetType,
                theme: campaign.name,
                year: campaign.year,
                creativeType,
                version,
                size,
                clientName: kit.clientName,
              }),
              brand: kit.slug,
              template: t.manifest.slug,
              version,
              size,
              creativeType,
              ...(creativeType === 'Video' ? { durationMs: presetDuration(styleId), fps: 30 } : {}),
              content: resolveDraftContent(draft, version, kit.slug),
            })),
          ),
        ),
      ),
    ),
  })

  return (
    <div>
      <StepIntro title={`Export — ${persona.name}`}>
        {selKits.length} brands × {templates.length} templates × {versions.length} versions × {sizes.length} sizes
        {styleId !== 'none' ? ' × image + video' : ''} = {total} deliverables, grouped under {persona.name}.
      </StepIntro>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-950/10 bg-zinc-50 p-4">
        <Button onClick={() => download(`${persona.slug}_${campaign.slug}_batch.json`, buildConfig())}>
          Download batch config
        </Button>
        <p className="text-sm text-zinc-500">
          Then run{' '}
          <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[0.8em] font-medium text-zinc-800">
            node harness/render-batch.mjs &lt;file&gt;
          </code>{' '}
          for finals in{' '}
          <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[0.8em] font-medium text-zinc-800">
            out/{persona.slug}/
          </code>
          .
        </p>
      </div>

      <h3 className="mt-8 mb-1 text-sm font-semibold text-zinc-950">
        Preview · V1 / Post ({Math.min(tiles.length, PREVIEW_CAP)} of {tiles.length})
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.slice(0, PREVIEW_CAP).map(({ kit, templateSlug }) => (
          <figure key={`${kit.slug}-${templateSlug}`} className="m-0 flex flex-col items-center gap-2">
            <DeliverablePreview
              draft={draft}
              kit={kits[kit.slug]}
              templateSlug={templateSlug}
              version="V1"
              size="Post"
              fitHeight={300}
            />
            <figcaption className="text-center text-[0.68rem] leading-snug break-words text-zinc-500">
              {kit.clientName} · {HIFI_TEMPLATES[templateSlug].manifest.name}
            </figcaption>
          </figure>
        ))}
      </div>
      {tiles.length > PREVIEW_CAP && (
        <p className="mt-3 text-sm text-zinc-500">+{tiles.length - PREVIEW_CAP} more in the batch config.</p>
      )}
    </div>
  )
}
