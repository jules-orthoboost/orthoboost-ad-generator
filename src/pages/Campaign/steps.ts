import type { BrandKit, HifiTemplateManifest, LofiTemplate } from '../../core/schemas'
import {
  clientGate,
  setupGate,
  templateGate,
  contentGate,
  type CampaignDraft,
  type GateResult,
} from '../../core/gates'

export const STEP_IDS = ['client', 'setup', 'template', 'content', 'preview', 'export'] as const
export type StepId = (typeof STEP_IDS)[number]

export const STEP_TITLES: Record<StepId, string> = {
  client: 'Client',
  setup: 'Campaign',
  template: 'Template',
  content: 'Content',
  preview: 'Preview',
  export: 'Export',
}

export interface StepDeps {
  kit?: BrandKit
  manifest?: HifiTemplateManifest
  archetype?: LofiTemplate
}

export function gateFor(id: StepId, draft: CampaignDraft, deps: StepDeps): GateResult {
  switch (id) {
    case 'client':
      return clientGate(deps.kit)
    case 'setup':
      return setupGate(draft)
    case 'template':
      return templateGate(deps.manifest, deps.kit)
    case 'content':
    case 'preview':
    case 'export':
      if (!deps.manifest || !deps.archetype) {
        return { ok: false, missing: ['Finish the earlier steps first'] }
      }
      return contentGate(deps.manifest, deps.archetype, draft.versions)
  }
}
