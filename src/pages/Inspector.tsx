import { useState } from 'react'
import { loadBrandKits, loadLofiTemplates, loadPersonas } from '../core/data'
import { ZoneCanvas } from '../components/ZoneCanvas'
import { BeatTimeline } from '../components/BeatTimeline'
import { Templates } from './Templates'
import { BrandKits } from './BrandKits'
import { HIFI_TEMPLATES } from '../templates/hifi'

const personas = loadPersonas()
const templates = loadLofiTemplates()
const brandKitCount = Object.keys(loadBrandKits()).length
const hifiCount = Object.keys(HIFI_TEMPLATES).length

type Tab = 'archetypes' | 'personas' | 'templates' | 'brandkits'

export function Inspector() {
  const [tab, setTab] = useState<Tab>('archetypes')
  const templateSlugs = Object.keys(templates).sort()
  const personaSlugs = Object.keys(personas).sort()
  const [selectedTemplate, setSelectedTemplate] = useState(templateSlugs[0])
  const [selectedPersona, setSelectedPersona] = useState(personaSlugs[0])

  const t = templates[selectedTemplate]
  const p = personas[selectedPersona]

  return (
    <div className="inspector">
      <header className="topbar">
        <span className="brand">
          Ortho<span className="brand-accent">Boost</span> Ad Generator
        </span>
        <nav className="tabs">
          <button className={tab === 'archetypes' ? 'active' : ''} onClick={() => setTab('archetypes')}>
            Lo-Fi Archetypes ({templateSlugs.length})
          </button>
          <button className={tab === 'personas' ? 'active' : ''} onClick={() => setTab('personas')}>
            Personas ({personaSlugs.length})
          </button>
          <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>
            Templates ({hifiCount})
          </button>
          <button className={tab === 'brandkits' ? 'active' : ''} onClick={() => setTab('brandkits')}>
            Brand Kits ({brandKitCount})
          </button>
        </nav>
      </header>

      {tab === 'templates' ? (
        <Templates />
      ) : tab === 'brandkits' ? (
        <BrandKits />
      ) : tab === 'archetypes' ? (
        <div className="layout">
          <aside className="sidebar">
            {templateSlugs.map((slug) => (
              <button
                key={slug}
                className={`side-item ${slug === selectedTemplate ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(slug)}
              >
                {templates[slug].name}
              </button>
            ))}
          </aside>
          <main className="detail">
            <h1>{t.name}</h1>
            <p className="muted">{t.description}</p>
            <p className="muted">
              Slots: {t.slots.join(', ')}
            </p>
            <div className="canvas-row">
              <ZoneCanvas template={t} size="Story" />
              <ZoneCanvas template={t} size="Post" />
            </div>
            <h2>Video grammar</h2>
            <BeatTimeline template={t} />
          </main>
        </div>
      ) : (
        <div className="layout">
          <aside className="sidebar">
            {personaSlugs.map((slug) => (
              <button
                key={slug}
                className={`side-item ${slug === selectedPersona ? 'active' : ''}`}
                onClick={() => setSelectedPersona(slug)}
              >
                <span className="dot" style={{ background: personas[slug].accentColor }} />
                {personas[slug].name}
              </button>
            ))}
          </aside>
          <main className="detail">
            <h1>
              <span className="dot lg" style={{ background: p.accentColor }} />
              {p.name}
            </h1>
            <p className="archetype">{p.archetype}</p>
            <dl className="persona-facts">
              <dt>Positioning</dt>
              <dd>{p.positioning}</dd>
              <dt>Messaging behavior</dt>
              <dd>{p.messagingBehavior}</dd>
              <dt>Patient base</dt>
              <dd>{p.patientBase.join(' · ')}</dd>
              {p.exampleClients.length > 0 && (
                <>
                  <dt>Example clients</dt>
                  <dd>{p.exampleClients.join(', ')}</dd>
                </>
              )}
            </dl>
            <div className="trait-grid">
              {(
                [
                  ['Layout', p.layout],
                  ['Visual tone', p.visualTone],
                  ['Iconography', p.iconography],
                  ['Texture', p.texture],
                  ['Design principles', p.designPrinciples],
                  ['What to avoid', p.donts],
                ] as const
              ).map(([title, items]) => (
                <section key={title} className={`trait ${title === 'What to avoid' ? 'avoid' : ''}`}>
                  <h3>{title}</h3>
                  <ul>
                    {items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {p.resources && (
              <p className="resources">
                {p.resources.map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.label}
                  </a>
                ))}
              </p>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
