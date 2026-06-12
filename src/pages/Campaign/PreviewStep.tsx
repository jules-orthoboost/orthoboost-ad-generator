import { useState } from 'react'
import { loadPersonas } from '../../core/data'
import { resolveTokens } from '../../core/tokens'
import { deliverableName } from '../../core/naming'
import { HIFI_TEMPLATES } from '../../templates/hifi'
import { TemplateFrame } from '../../templates/hifi/TemplateFrame'
import type { SizeKey } from '../../core/schemas'
import type { StepProps } from './CampaignBuilder'

const personas = loadPersonas()
const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

type Version = 'V1' | 'V2'

export function PreviewStep({ draft, deps }: StepProps) {
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)
  const { kit, manifest, archetype } = deps
  if (!kit || !manifest || !archetype) return <p className="muted">Finish the earlier steps first.</p>

  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)
  const Component = HIFI_TEMPLATES[manifest.slug].Component
  const grammar = archetype.videoGrammar
  const logoUrl = asset(tokens.logoPath)

  const tiles: { version: Version; size: SizeKey }[] = [
    { version: 'V1', size: 'Story' },
    { version: 'V1', size: 'Post' },
    { version: 'V2', size: 'Story' },
    { version: 'V2', size: 'Post' },
  ]

  return (
    <div>
      <h2>Preview all variants</h2>
      <div className="tpl-controls">
        <button className="ctl btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Stop' : 'Play'} animation
        </button>
        <label className="ctl">
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />{' '}
          Reduced motion
        </label>
      </div>

      <div className="cb-qa-grid">
        {tiles.map(({ version, size }) => {
          const content = draft.versions[version].content
          const name = deliverableName({
            adSetType: draft.adSetType ?? 'Seasonal',
            theme: draft.theme ?? 'Theme',
            year: draft.year ?? new Date().getFullYear(),
            creativeType: 'Image',
            version,
            size,
            clientName: kit.clientName,
          })
          return (
            <figure key={`${version}-${size}`} className="cb-qa-tile">
              <TemplateFrame size={size} tokens={tokens} fitHeight={size === 'Story' ? 360 : 300}>
                <Component
                  size={size}
                  tokens={tokens}
                  content={content}
                  logoUrl={logoUrl}
                  beats={grammar.beats}
                  durationMs={grammar.durationMs}
                  playing={playing}
                  reducedMotion={reduced}
                />
              </TemplateFrame>
              <figcaption>{name}</figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
