import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { loadBrandKits, loadCampaignThemes, loadLofiTemplates, loadPersonas } from '../../core/data'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import type { FlowDraft } from '../../core/gates'
import { Button } from '../../components/catalyst/button'
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

type StepState = 'current' | 'done' | 'open' | 'locked'

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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Builder steps" className="flex flex-col gap-0.5 lg:sticky lg:top-4 lg:self-start">
        {STEP_IDS.map((id, i) => {
          const locked = !reachable(i)
          const state: StepState = i === index ? 'current' : gates[i].ok ? 'done' : locked ? 'locked' : 'open'
          return (
            <button
              key={id}
              disabled={locked}
              onClick={() => setIndex(i)}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
                state === 'current' && 'bg-zinc-950/5',
                state !== 'current' && !locked && 'hover:bg-zinc-950/5',
                locked && 'cursor-not-allowed',
              )}
            >
              <span
                className={clsx(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  circleClass(state),
                )}
              >
                {state === 'done' ? <CheckIcon /> : i + 1}
              </span>
              <span className={clsx('text-sm font-medium', labelClass(state))}>{STEP_TITLES[id]}</span>
            </button>
          )
        })}
      </nav>

      <section className="min-w-0">
        {currentId === 'persona' && <PersonaStep {...stepProps} />}
        {currentId === 'brands' && <BrandsStep {...stepProps} />}
        {currentId === 'campaign' && <CampaignStep {...stepProps} />}
        {currentId === 'templates' && <TemplatesStep {...stepProps} />}
        {currentId === 'copy' && <CopyStep {...stepProps} />}
        {currentId === 'animation' && <AnimationStep {...stepProps} />}
        {currentId === 'export' && <ExportStep {...stepProps} />}

        <footer className="mt-8 flex items-center gap-4 border-t border-zinc-950/5 pt-5">
          <Button outline disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Back
          </Button>
          {!currentGate.ok && (
            <p className="text-xs text-amber-700">
              {currentGate.missing[0]}
              {currentGate.missing.length > 1 && ` · +${currentGate.missing.length - 1} more`}
            </p>
          )}
          <Button
            className="ml-auto"
            disabled={!currentGate.ok || index === STEP_IDS.length - 1}
            onClick={() => setIndex((i) => Math.min(i + 1, STEP_IDS.length - 1))}
          >
            Next
          </Button>
        </footer>
      </section>
    </div>
  )
}

function circleClass(state: StepState) {
  switch (state) {
    case 'current':
      return 'bg-zinc-900 text-white'
    case 'done':
      return 'bg-emerald-600 text-white'
    case 'open':
      return 'border border-zinc-300 bg-white text-zinc-600'
    case 'locked':
      return 'border border-zinc-200 bg-white text-zinc-300'
  }
}

function labelClass(state: StepState) {
  switch (state) {
    case 'current':
      return 'text-zinc-950'
    case 'locked':
      return 'text-zinc-400'
    default:
      return 'text-zinc-700'
  }
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="size-3">
      <path d="M3 7.5 5.5 10 11 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
