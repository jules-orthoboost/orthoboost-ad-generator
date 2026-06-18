import { loadLofiTemplates, loadPersonas } from '../../core/data'
import { resolveTokens } from '../../core/tokens'
import { resolveAsset } from '../../core/assets'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import { TemplateFrame } from '../../templates/hifi/TemplateFrame'
import { resolveDraftContent, type FlowDraft, type Version } from '../../core/gates'
import type { BrandKit, SizeKey } from '../../core/schemas'

const personas = loadPersonas()
const lofi = loadLofiTemplates()

/** A single, live, brand-themed render of one deliverable from the flow draft. */
export function DeliverablePreview({
  draft,
  kit,
  templateSlug,
  version,
  size,
  fitHeight,
  playing,
  reduced,
}: {
  draft: FlowDraft
  kit: BrandKit
  templateSlug: string
  version: Version
  size: SizeKey
  fitHeight: number
  playing?: boolean
  reduced?: boolean
}) {
  const reg = HIFI_TEMPLATES[templateSlug]
  const persona = personas[kit.personaSlug]
  if (!reg || !persona) return null
  const tokens = resolveTokens(persona, kit)
  const grammar = lofi[reg.manifest.archetype].videoGrammar
  const content = resolveDraftContent(draft, version, kit.slug)
  const resolved = { ...content, photo: content.photo ? resolveAsset(content.photo) : undefined }
  return (
    <TemplateFrame size={size} tokens={tokens} fitHeight={fitHeight}>
      <reg.Component
        size={size}
        tokens={tokens}
        content={resolved}
        logoUrl={resolveAsset(tokens.logoPath)}
        beats={grammar.beats}
        durationMs={grammar.durationMs}
        playing={!!playing}
        reducedMotion={!!reduced}
      />
    </TemplateFrame>
  )
}
