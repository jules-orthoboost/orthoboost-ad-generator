import { loadPersonas, loadPhotoLibrary } from '../../core/data'
import { resolveTokens } from '../../core/tokens'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import { TemplateFrame } from '../../templates/hifi/TemplateFrame'
import type { SlotContent } from '../../core/schemas'
import type { StepProps } from './CampaignBuilder'

const personas = loadPersonas()
const photos = loadPhotoLibrary()
const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

const sample: SlotContent = {
  headline: 'Your headline here',
  subhead: 'A short supporting line',
  cta: 'Book now',
  offer: '$500 off',
  photo: photos[0],
}

export function TemplateStep({ draft, setDraft, deps }: StepProps) {
  const kit = deps.kit
  if (!kit) return <p className="muted">Pick a client first.</p>
  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)

  const suited = Object.values(HIFI_TEMPLATES).filter((r) =>
    r.manifest.suitedPersonas.includes(kit.personaSlug),
  )

  return (
    <div>
      <h2>Choose a template</h2>
      <p className="muted">
        Showing templates suited to the {persona?.name ?? kit.personaSlug} persona.
      </p>
      {suited.length === 0 ? (
        <p className="cb-empty">No templates are tagged for this persona yet.</p>
      ) : (
        <div className="cb-tpl-grid">
          {suited.map(({ manifest, Component }) => {
            const active = draft.hifiTemplateSlug === manifest.slug
            return (
              <button
                key={manifest.slug}
                className={`cb-tpl ${active ? 'active' : ''}`}
                onClick={() => setDraft((d) => ({ ...d, hifiTemplateSlug: manifest.slug }))}
              >
                <TemplateFrame size="Story" tokens={tokens} fitHeight={220}>
                  <Component
                    size="Story"
                    tokens={tokens}
                    content={sample}
                    logoUrl={asset(tokens.logoPath)}
                    beats={[]}
                    durationMs={0}
                    playing={false}
                    reducedMotion
                  />
                </TemplateFrame>
                <span className="cb-tpl-name">{manifest.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
