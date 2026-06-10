import { useState } from 'react'
import { loadBrandKits, loadLofiTemplates, loadPersonas } from '../core/data'
import { resolveTokens } from '../core/tokens'
import type { SizeKey, SlotContent } from '../core/schemas'
import { TemplateFrame } from '../templates/hifi/TemplateFrame'
import { HIFI_TEMPLATES } from '../templates/hifi'

const personas = loadPersonas()
const kits = loadBrandKits()
const lofi = loadLofiTemplates()

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

// Sample copy per template, for preview only. Real copy comes from the campaign builder.
const SAMPLE: Record<string, SlotContent> = {
  'hero-banner-cta': {
    headline: 'Back to school, back to confident smiles',
    subhead: 'Free consults all August. Flexible plans built around busy family schedules.',
    cta: 'Book a free consult',
    photo: 'assets/photos/back-to-school/classroom-warm.svg',
  },
  'offer-card': {
    offer: '$500 off',
    headline: 'New braces, new school year',
    cta: 'Claim your consult',
    photo: 'assets/photos/back-to-school/smile-portrait.svg',
  },
}

const kitSlugs = Object.keys(kits).sort()

export function Templates() {
  const templateSlugs = Object.keys(HIFI_TEMPLATES).sort()
  const [slug, setSlug] = useState(templateSlugs[0])
  const [size, setSize] = useState<SizeKey>('Story')
  const [kitSlug, setKitSlug] = useState(kitSlugs[0])
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)

  const reg = HIFI_TEMPLATES[slug]
  const kit = kits[kitSlug]
  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)
  const archetype = lofi[reg.manifest.archetype]
  const content = SAMPLE[slug] ?? {}
  const resolvedContent: SlotContent = {
    ...content,
    photo: content.photo ? asset(content.photo) : undefined,
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        {templateSlugs.map((s) => (
          <button
            key={s}
            className={`side-item ${s === slug ? 'active' : ''}`}
            onClick={() => setSlug(s)}
          >
            {HIFI_TEMPLATES[s].manifest.name}
          </button>
        ))}
      </aside>
      <main className="detail">
        <h1>{reg.manifest.name}</h1>
        <p className="muted">
          Archetype: {reg.manifest.archetype} · slots: {reg.manifest.slots.join(', ')}
        </p>

        <div className="tpl-controls">
          <div className="seg">
            {(['Story', 'Post'] as SizeKey[]).map((s) => (
              <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
          <label className="ctl">
            Brand kit{' '}
            <select value={kitSlug} onChange={(e) => setKitSlug(e.target.value)}>
              {kitSlugs.map((k) => (
                <option key={k} value={k}>
                  {kits[k].clientName}
                </option>
              ))}
            </select>
          </label>
          <button className="ctl btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? 'Stop' : 'Play'} animation
          </button>
          <label className="ctl">
            <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />{' '}
            Reduced motion
          </label>
        </div>

        <div className="tpl-stage">
          <TemplateFrame size={size} tokens={tokens} fitHeight={size === 'Story' ? 620 : 540}>
            <reg.Component
              size={size}
              tokens={tokens}
              content={resolvedContent}
              logoUrl={asset(tokens.logoPath)}
              beats={archetype.videoGrammar.beats}
              durationMs={archetype.videoGrammar.durationMs}
              playing={playing}
              reducedMotion={reduced}
            />
          </TemplateFrame>
        </div>
      </main>
    </div>
  )
}
