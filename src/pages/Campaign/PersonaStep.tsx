import { loadBrandKits, loadPersonas } from '../../core/data'
import { StepIntro, Tile, TileGrid } from './ui'
import type { StepProps } from './CampaignBuilder'

const personas = loadPersonas()
const kits = loadBrandKits()

export function PersonaStep({ draft, setDraft }: StepProps) {
  const list = Object.values(personas).sort((a, b) => a.name.localeCompare(b.name))
  const brandCount = (slug: string) => Object.values(kits).filter((k) => k.personaSlug === slug).length

  return (
    <div>
      <StepIntro title="Select a persona">
        The persona sets the voice and design language; every brand on it inherits both.
      </StepIntro>
      <TileGrid>
        {list.map((p) => (
          <Tile
            key={p.slug}
            active={draft.personaSlug === p.slug}
            accent={p.accentColor}
            title={p.name}
            meta={`${brandCount(p.slug)} brand kits`}
            onClick={() =>
              setDraft((d) => ({
                ...d,
                personaSlug: p.slug,
                brandSlugs: [],
                templateSlugs: [],
                perClient: {},
              }))
            }
          />
        ))}
      </TileGrid>
    </div>
  )
}
