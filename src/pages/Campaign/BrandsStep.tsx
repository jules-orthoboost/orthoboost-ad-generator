import { loadBrandKits } from '../../core/data'
import { emptyPerClient } from '../../core/gates'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()

export function BrandsStep({ draft, setDraft }: StepProps) {
  if (!draft.personaSlug) return <p className="muted">Pick a persona first.</p>
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
      <h2>Select brand kits</h2>
      <p className="muted">
        {list.length} brands on this persona · {draft.brandSlugs.length} selected. Pick any number to
        export together.
      </p>
      <button className="cb-nav" onClick={() => setAll(!allOn)}>
        {allOn ? 'Clear all' : 'Select all'}
      </button>
      <div className="cb-cards">
        {list.map((k) => {
          const active = draft.brandSlugs.includes(k.slug)
          return (
            <button
              key={k.slug}
              className={`cb-card ${active ? 'active' : ''}`}
              onClick={() => toggle(k.slug)}
            >
              <span className="cb-card-dot" style={{ background: k.colors.brand }} />
              <strong>{k.clientName}</strong>
              <span className="muted">{active ? '✓ selected' : 'tap to add'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
