import { loadCampaignThemes, loadCopyBySlug } from '../../core/data'
import type { PersonaCopyVersion } from '../../core/data'
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
      const shared = lib ? { V1: pick(lib.V1), V2: pick(lib.V2) } : d.shared
      return { ...d, campaignSlug: slug, templateSlugs: [], shared }
    })

  return (
    <div>
      <h2>Select a campaign</h2>
      <p className="muted">
        A campaign is a seasonal theme. Templates are filtered to it, and the shared copy is
        pre-filled from this persona's library (you can edit it next).
      </p>
      <div className="cb-cards">
        {list.map((c) => {
          const active = draft.campaignSlug === c.slug
          return (
            <button
              key={c.slug}
              className={`cb-card ${active ? 'active' : ''}`}
              onClick={() => select(c.slug)}
            >
              <strong>{c.name}</strong>
              <span className="muted">
                {c.adSetType} · {c.year}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
