import { templatesFor } from '../../templates/hifi'
import type { StepProps } from './CampaignBuilder'

export function TemplatesStep({ draft, setDraft }: StepProps) {
  if (!draft.personaSlug || !draft.campaignSlug) {
    return <p className="muted">Pick a persona and campaign first.</p>
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
      <h2>Select templates</h2>
      <p className="muted">
        {list.length} templates fit this persona + campaign · {draft.templateSlugs.length} selected.
        Pick any number to generate.
      </p>
      {list.length === 0 && (
        <p className="cb-empty">No templates for this persona + campaign yet.</p>
      )}
      <div className="cb-cards">
        {list.map(({ manifest }) => {
          const active = draft.templateSlugs.includes(manifest.slug)
          return (
            <button
              key={manifest.slug}
              className={`cb-card ${active ? 'active' : ''}`}
              onClick={() => toggle(manifest.slug)}
            >
              <strong>{manifest.name}</strong>
              <span className="muted">
                {active ? '✓ selected' : manifest.suitedCampaigns ? 'campaign-specific' : 'evergreen'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
