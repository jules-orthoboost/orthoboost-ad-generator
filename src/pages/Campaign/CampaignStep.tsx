import { loadCampaignThemes, loadCopyBySlug } from '../../core/data'
import type { PersonaCopyVersion } from '../../core/data'
import { StepIntro, Tile, TileGrid } from './ui'
import type { StepProps } from './CampaignBuilder'

const themes = loadCampaignThemes()
const copyBySlug = loadCopyBySlug()

const pick = (v?: PersonaCopyVersion): PersonaCopyVersion =>
  v ? { headline: v.headline, subhead: v.subhead, cta: v.cta, disclaimer: v.disclaimer } : {}

export function CampaignStep({ draft, setDraft }: StepProps) {
  const list = Object.values(themes).sort((a, b) => a.name.localeCompare(b.name))

  const select = (slug: string) =>
    setDraft((d) => {
      // Prefill shared copy from the persona library for this campaign (editable next step).
      const lib = d.personaSlug ? copyBySlug[slug]?.personas?.[d.personaSlug] : undefined
      const shared = lib ? pick(lib.V1) : d.shared
      return { ...d, campaignSlug: slug, templateSlugs: [], shared }
    })

  return (
    <div>
      <StepIntro title="Select a campaign">
        A campaign is a seasonal theme. Templates are filtered to it, and the shared copy is pre-filled from this
        persona's library — you can edit it next.
      </StepIntro>
      <TileGrid>
        {list.map((c) => (
          <Tile
            key={c.slug}
            active={draft.campaignSlug === c.slug}
            title={c.name}
            meta={`${c.adSetType} · ${c.year}`}
            onClick={() => select(c.slug)}
          />
        ))}
      </TileGrid>
    </div>
  )
}
