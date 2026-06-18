import type { BrandKit, LofiTemplate, Persona } from '../../core/schemas'
import type { CampaignTheme } from '../../core/data'
import type { RegisteredTemplate } from '../../templates/hifi/types'
import {
  personaGate,
  brandsGate,
  campaignGate,
  templatesGate,
  copyGate,
  type FlowDraft,
  type GateResult,
} from '../../core/gates'

export const STEP_IDS = [
  'persona',
  'brands',
  'campaign',
  'templates',
  'copy',
  'animation',
  'export',
] as const
export type StepId = (typeof STEP_IDS)[number]

export const STEP_TITLES: Record<StepId, string> = {
  persona: 'Persona',
  brands: 'Brand kits',
  campaign: 'Campaign',
  templates: 'Templates',
  copy: 'Copy',
  animation: 'Animation',
  export: 'Export',
}

export interface StepDeps {
  persona?: Persona
  kits: BrandKit[]
  campaign?: CampaignTheme
  templates: RegisteredTemplate[]
  archetypes: LofiTemplate[]
}

export function gateFor(id: StepId, draft: FlowDraft): GateResult {
  switch (id) {
    case 'persona':
      return personaGate(draft)
    case 'brands':
      return brandsGate(draft)
    case 'campaign':
      return campaignGate(draft)
    case 'templates':
      return templatesGate(draft)
    case 'copy':
      return copyGate(draft)
    case 'animation':
    case 'export':
      return { ok: true, missing: [] }
  }
}
