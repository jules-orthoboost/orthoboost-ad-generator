import { useMemo, useState } from 'react'
import { loadBrandKits, loadCampaignThemes, loadLofiTemplates, loadPersonas } from '../../core/data'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import type { FlowDraft } from '../../core/gates'
import { STEP_IDS, STEP_TITLES, gateFor, type StepDeps } from './steps'
import { PersonaStep } from './PersonaStep'
import { BrandsStep } from './BrandsStep'
import { CampaignStep } from './CampaignStep'
import { TemplatesStep } from './TemplatesStep'
import { CopyStep } from './CopyStep'
import { AnimationStep } from './AnimationStep'
import { ExportStep } from './ExportStep'

const kits = loadBrandKits()
const personas = loadPersonas()
const lofi = loadLofiTemplates()
const campaigns = loadCampaignThemes()

export interface StepProps {
  draft: FlowDraft
  setDraft: React.Dispatch<React.SetStateAction<FlowDraft>>
  deps: StepDeps
}

const emptyDraft = (): FlowDraft => ({
  brandSlugs: [],
  templateSlugs: [],
  shared: { V1: {}, V2: {} },
  perClient: {},
})

export function CampaignBuilder() {
  const [draft, setDraft] = useState<FlowDraft>(emptyDraft)
  const [index, setIndex] = useState(0)

  const deps: StepDeps = useMemo(() => {
    const persona = draft.personaSlug ? personas[draft.personaSlug] : undefined
    const selKits = draft.brandSlugs.map((s) => kits[s]).filter(Boolean)
    const campaign = draft.campaignSlug ? campaigns[draft.campaignSlug] : undefined
    const templates = draft.templateSlugs.map((s) => HIFI_TEMPLATES[s]).filter(Boolean)
    const archetypes = templates.map((t) => lofi[t.manifest.archetype]).filter(Boolean)
    return { persona, kits: selKits, campaign, templates, archetypes }
  }, [draft.personaSlug, draft.brandSlugs, draft.campaignSlug, draft.templateSlugs])

  const gates = STEP_IDS.map((id) => gateFor(id, draft))
  const currentId = STEP_IDS[index]
  const currentGate = gates[index]
  const reachable = (i: number) => gates.slice(0, i).every((g) => g.ok)

  const stepProps: StepProps = { draft, setDraft, deps }

  return (
    <div className="cb">
      <ol className="cb-rail">
        {STEP_IDS.map((id, i) => {
          const state = i === index ? 'current' : gates[i].ok ? 'done' : reachable(i) ? 'open' : 'locked'
          return (
            <li key={id}>
              <button className={`cb-step ${state}`} disabled={!reachable(i)} onClick={() => setIndex(i)}>
                <span className="cb-num">{i + 1}</span>
                {STEP_TITLES[id]}
              </button>
            </li>
          )
        })}
      </ol>

      <section className="cb-body">
        {currentId === 'persona' && <PersonaStep {...stepProps} />}
        {currentId === 'brands' && <BrandsStep {...stepProps} />}
        {currentId === 'campaign' && <CampaignStep {...stepProps} />}
        {currentId === 'templates' && <TemplatesStep {...stepProps} />}
        {currentId === 'copy' && <CopyStep {...stepProps} />}
        {currentId === 'animation' && <AnimationStep {...stepProps} />}
        {currentId === 'export' && <ExportStep {...stepProps} />}

        <footer className="cb-foot">
          <button className="cb-nav" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Back
          </button>
          {!currentGate.ok && (
            <ul className="cb-missing">
              {currentGate.missing.slice(0, 4).map((m) => (
                <li key={m}>{m}</li>
              ))}
              {currentGate.missing.length > 4 && <li>+{currentGate.missing.length - 4} more…</li>}
            </ul>
          )}
          <button
            className="cb-nav primary"
            disabled={!currentGate.ok || index === STEP_IDS.length - 1}
            onClick={() => setIndex((i) => Math.min(i + 1, STEP_IDS.length - 1))}
          >
            Next
          </button>
        </footer>
      </section>
    </div>
  )
}
