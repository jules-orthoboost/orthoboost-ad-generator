import { loadBrandKits } from '../../core/data'
import { emptyPerClient } from '../../core/gates'
import { Button } from '../../components/catalyst/button'
import { StepIntro, Tile, TileGrid } from './ui'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()

export function BrandsStep({ draft, setDraft }: StepProps) {
  if (!draft.personaSlug) return <p className="text-sm text-zinc-500">Pick a persona first.</p>
  const list = Object.values(kits)
    .filter((k) => k.personaSlug === draft.personaSlug)
    .sort((a, b) => a.clientName.localeCompare(b.clientName))

  const toggle = (slug: string) =>
    setDraft((d) => {
      const on = d.brandSlugs.includes(slug)
      const brandSlugs = on ? d.brandSlugs.filter((s) => s !== slug) : [...d.brandSlugs, slug]
      const perClient = { ...d.perClient }
      if (on) delete perClient[slug]
      else perClient[slug] = perClient[slug] ?? emptyPerClient()
      return { ...d, brandSlugs, perClient }
    })

  const allOn = list.length > 0 && list.every((k) => draft.brandSlugs.includes(k.slug))
  const setAll = (on: boolean) =>
    setDraft((d) => {
      const brandSlugs = on ? list.map((k) => k.slug) : []
      const perClient: typeof d.perClient = {}
      if (on) for (const k of list) perClient[k.slug] = d.perClient[k.slug] ?? emptyPerClient()
      return { ...d, brandSlugs, perClient }
    })

  return (
    <div>
      <StepIntro title="Select brand kits">
        {list.length} brands on this persona · {draft.brandSlugs.length} selected. Pick any number to export
        together.
      </StepIntro>
      <div className="mb-4">
        <Button outline onClick={() => setAll(!allOn)}>
          {allOn ? 'Clear all' : 'Select all'}
        </Button>
      </div>
      <TileGrid>
        {list.map((k) => (
          <Tile
            key={k.slug}
            active={draft.brandSlugs.includes(k.slug)}
            accent={k.colors.brand}
            title={k.clientName}
            onClick={() => toggle(k.slug)}
          />
        ))}
      </TileGrid>
    </div>
  )
}
