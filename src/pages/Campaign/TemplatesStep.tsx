import { templatesFor } from '../../templates/hifi'
import { StepIntro, Tile, TileGrid } from './ui'
import type { StepProps } from './CampaignBuilder'

export function TemplatesStep({ draft, setDraft }: StepProps) {
  if (!draft.personaSlug || !draft.campaignSlug) {
    return <p className="text-sm text-zinc-500">Pick a persona and campaign first.</p>
  }
  const list = templatesFor(draft.personaSlug, draft.campaignSlug)
  const toggle = (slug: string) =>
    setDraft((d) => ({
      ...d,
      templateSlugs: d.templateSlugs.includes(slug)
        ? d.templateSlugs.filter((s) => s !== slug)
        : [...d.templateSlugs, slug],
    }))

  return (
    <div>
      <StepIntro title="Select templates">
        {list.length} templates fit this persona + campaign · {draft.templateSlugs.length} selected. Pick any
        number to generate.
      </StepIntro>
      {list.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No templates for this persona + campaign yet.
        </p>
      )}
      <TileGrid>
        {list.map(({ manifest }) => (
          <Tile
            key={manifest.slug}
            active={draft.templateSlugs.includes(manifest.slug)}
            title={manifest.name}
            meta={manifest.suitedCampaigns ? 'Campaign-specific' : 'Evergreen'}
            onClick={() => toggle(manifest.slug)}
          />
        ))}
      </TileGrid>
    </div>
  )
}
