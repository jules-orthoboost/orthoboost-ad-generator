import { useState } from 'react'
import clsx from 'clsx'
import { loadPersonas } from '../core/data'
import { Heading, Subheading } from '../components/catalyst/heading'

const personas = loadPersonas()

export function PersonasView() {
  const slugs = Object.keys(personas).sort((a, b) => personas[a].name.localeCompare(personas[b].name))
  const [sel, setSel] = useState(slugs[0])
  const p = personas[sel]

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-0.5">
        <Subheading className="px-2 pb-2">Personas ({slugs.length})</Subheading>
        {slugs.map((slug) => (
          <button
            key={slug}
            onClick={() => setSel(slug)}
            className={clsx(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
              slug === sel ? 'bg-zinc-950/5 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-950/5',
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ background: personas[slug].accentColor }}
            />
            <span className="truncate">{personas[slug].name}</span>
          </button>
        ))}
      </aside>

      <main className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="size-4 shrink-0 rounded-full" style={{ background: p.accentColor }} />
          <Heading>{p.name}</Heading>
        </div>
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
            <section key={title} className={clsx('trait', title === 'What to avoid' && 'avoid')}>
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
  )
}
