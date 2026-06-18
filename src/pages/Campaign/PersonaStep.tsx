import { loadBrandKits, loadPersonas } from '../../core/data'
import type { StepProps } from './CampaignBuilder'

const personas = loadPersonas()
const kits = loadBrandKits()

export function PersonaStep({ draft, setDraft }: StepProps) {
  const list = Object.values(personas).sort((a, b) => a.name.localeCompare(b.name))
  const brandCount = (slug: string) => Object.values(kits).filter((k) => k.personaSlug === slug).length
  return (
    <div>
      <h2>Select a persona</h2>
      <p className="muted">The persona sets the voice and design language; every brand on it inherits both.</p>
      <div className="cb-cards">
        {list.map((p) => {
          const active = draft.personaSlug === p.slug
          return (
            <button
              key={p.slug}
              className={`cb-card ${active ? 'active' : ''}`}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  personaSlug: p.slug,
                  brandSlugs: [],
                  templateSlugs: [],
                  perClient: {},
                }))
              }
            >
              <span className="cb-card-dot" style={{ background: p.accentColor }} />
              <strong>{p.name}</strong>
              <span className="muted">{brandCount(p.slug)} brand kits</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
