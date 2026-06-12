import { loadBrandKits, loadPersonas } from '../../core/data'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()
const personas = loadPersonas()

export function ClientStep({ draft, setDraft }: StepProps) {
  const slugs = Object.keys(kits).sort()
  return (
    <div>
      <h2>Choose a client</h2>
      <p className="muted">Each client carries a brand kit (logo, colors, type) and an assigned persona.</p>
      <div className="cb-cards">
        {slugs.map((slug) => {
          const kit = kits[slug]
          const persona = personas[kit.personaSlug]
          const active = draft.clientSlug === slug
          return (
            <button
              key={slug}
              className={`cb-card ${active ? 'active' : ''}`}
              onClick={() => setDraft((d) => ({ ...d, clientSlug: slug }))}
            >
              <span className="cb-card-dot" style={{ background: kit.colors.brand }} />
              <strong>{kit.clientName}</strong>
              <span className="muted">{persona ? persona.name : kit.personaSlug}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
