import { useMemo, useState } from 'react'
import { loadBrandKits, loadLofiTemplates } from '../../core/data'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import type { CampaignDraft } from '../../core/gates'
import { STEP_IDS, STEP_TITLES, gateFor, type StepDeps } from './steps'
import { ClientStep } from './ClientStep'
import { SetupStep } from './SetupStep'
import { TemplateStep } from './TemplateStep'
import { ContentStep } from './ContentStep'
import { PreviewStep } from './PreviewStep'
import { ExportStep } from './ExportStep'

const kits = loadBrandKits()
const lofi = loadLofiTemplates()

export interface StepProps {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  deps: StepDeps
}

const emptyDraft = (): CampaignDraft => ({
  versions: { V1: { content: {} }, V2: { content: {} } },
})

export function CampaignBuilder() {
  const [draft, setDraft] = useState<CampaignDraft>(emptyDraft)
  const [index, setIndex] = useState(0)

  const deps: StepDeps = useMemo(() => {
    const kit = draft.clientSlug ? kits[draft.clientSlug] : undefined
    const reg = draft.hifiTemplateSlug ? HIFI_TEMPLATES[draft.hifiTemplateSlug] : undefined
    const manifest = reg?.manifest
    const archetype = manifest ? lofi[manifest.archetype] : undefined
    return { kit, manifest, archetype }
  }, [draft.clientSlug, draft.hifiTemplateSlug])

  const gates = STEP_IDS.map((id) => gateFor(id, draft, deps))
  const currentId = STEP_IDS[index]
  const currentGate = gates[index]

  // A step is reachable once every earlier step's gate passes.
  const reachable = (i: number) => gates.slice(0, i).every((g) => g.ok)

  const stepProps: StepProps = { draft, setDraft, deps }

  return (
    <div className="cb">
      <ol className="cb-rail">
        {STEP_IDS.map((id, i) => {
          const state = i === index ? 'current' : gates[i].ok ? 'done' : reachable(i) ? 'open' : 'locked'
          return (
            <li key={id}>
              <button
                className={`cb-step ${state}`}
                disabled={!reachable(i)}
                onClick={() => setIndex(i)}
              >
                <span className="cb-num">{i + 1}</span>
                {STEP_TITLES[id]}
              </button>
            </li>
          )
        })}
      </ol>

      <section className="cb-body">
        {currentId === 'client' && <ClientStep {...stepProps} />}
        {currentId === 'setup' && <SetupStep {...stepProps} />}
        {currentId === 'template' && <TemplateStep {...stepProps} />}
        {currentId === 'content' && <ContentStep {...stepProps} />}
        {currentId === 'preview' && <PreviewStep {...stepProps} />}
        {currentId === 'export' && <ExportStep {...stepProps} />}

        <footer className="cb-foot">
          <button className="cb-nav" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Back
          </button>
          {!currentGate.ok && (
            <ul className="cb-missing">
              {currentGate.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
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
