import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { loadPersonas } from '../core/data'
import { Heading } from '../components/catalyst/heading'
import { Badge } from '../components/catalyst/badge'
import { useHashSegments, navigate } from '../core/router'

const personas = loadPersonas()

export function PersonasView() {
  const slugs = useMemo(
    () => Object.keys(personas).sort((a, b) => personas[a].name.localeCompare(personas[b].name)),
    [],
  )
  const segments = useHashSegments()
  const routed = segments[1]
  const sel = routed && personas[routed] ? routed : slugs[0]
  const p = personas[sel]

  const [query, setQuery] = useState('')
  const filtered = slugs.filter(
    (s) => personas[s].name.toLowerCase().includes(query.toLowerCase()) ||
      personas[s].archetype.toLowerCase().includes(query.toLowerCase()),
  )

  const [copied, setCopied] = useState(false)
  function copyLink() {
    const url = `${location.origin}${location.pathname}#personas/${sel}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  const resources = (p.resources ?? []).filter((r) => !/figma/i.test(r.label))

  const traits: { title: string; items: string[]; avoid?: boolean }[] = [
    { title: 'Layout', items: p.layout },
    { title: 'Visual tone', items: p.visualTone },
    { title: 'Iconography', items: p.iconography },
    { title: 'Texture', items: p.texture },
    { title: 'Design principles', items: p.designPrinciples },
    { title: 'What to avoid', items: p.donts, avoid: true },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Heading>Personas</Heading>
            <Badge color="sky">{slugs.length}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Brand-voice archetypes that drive every campaign's tone, layout, and creative guardrails.
          </p>
        </div>
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-950/10 bg-white px-3.5 py-1.5 text-sm font-semibold text-navy shadow-purity transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[.98]"
        >
          <LinkIcon className="size-4 text-zinc-400" />
          <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Left rail */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="relative mb-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              aria-label="Search personas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search personas…"
              className="w-full rounded-xl border border-zinc-950/10 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 shadow-purity placeholder:text-zinc-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <nav className="flex flex-col gap-0.5">
            {filtered.map((slug) => {
              const isSel = slug === sel
              return (
                <button
                  key={slug}
                  onClick={() => navigate(`personas/${slug}`)}
                  aria-current={isSel ? 'true' : undefined}
                  className={clsx(
                    'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[.99]',
                    isSel
                      ? 'bg-white text-navy shadow-purity ring-1 ring-zinc-950/5'
                      : 'text-zinc-600 hover:bg-white/70 hover:text-zinc-900',
                  )}
                >
                  <span
                    className={clsx(
                      'size-2.5 shrink-0 rounded-full ring-1 ring-black/10 transition-all duration-200',
                      isSel ? 'scale-125' : 'opacity-70 group-hover:opacity-100',
                    )}
                    style={{ background: personas[slug].accentColor }}
                  />
                  <span className="truncate">{personas[slug].name}</span>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-zinc-500">No personas match “{query}”.</p>
            )}
          </nav>
        </aside>

        {/* Detail */}
        <main className="min-w-0">
          <div key={sel} className="persona-in overflow-hidden rounded-2xl bg-white shadow-purity-lg ring-1 ring-zinc-950/5">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-1 size-6 shrink-0 rounded-full shadow-purity ring-1 ring-black/10"
                    style={{ background: p.accentColor }}
                  />
                  <div className="min-w-0">
                    <Heading level={2}>{p.name}</Heading>
                    <p className="mt-0.5 text-sm font-medium text-zinc-500">{p.archetype}</p>
                  </div>
                </div>
                {resources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resources.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-950/10 bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 shadow-purity transition duration-200 hover:-translate-y-px hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      >
                        {r.label}
                        <ExternalIcon className="size-3 text-zinc-400" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                <Fact term="Positioning">{p.positioning}</Fact>
                <Fact term="Messaging behavior">{p.messagingBehavior}</Fact>
                <Fact term="Patient base">
                  <div className="flex flex-wrap gap-1.5">
                    {p.patientBase.map((b) => (
                      <Badge key={b} color="zinc">
                        {b}
                      </Badge>
                    ))}
                  </div>
                </Fact>
                {p.exampleClients.length > 0 && (
                  <Fact term="Example clients">{p.exampleClients.join(', ')}</Fact>
                )}
              </dl>
            </div>

            {/* Trait grid */}
            <div className="grid grid-cols-1 gap-px border-t border-zinc-950/10 bg-zinc-950/10 sm:grid-cols-2 xl:grid-cols-3">
              {traits.map(({ title, items, avoid }) => (
                <section
                  key={title}
                  className={clsx('p-4', avoid ? 'bg-rose-50/60' : 'bg-white')}
                >
                  <h3
                    className={clsx(
                      'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
                      avoid ? 'text-rose-600' : 'text-zinc-500',
                    )}
                  >
                    {avoid && <WarnIcon className="size-3.5" />}
                    {title}
                  </h3>
                  <ul className="mt-2 space-y-1 text-[13px]/5 text-zinc-700">
                    {items.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span
                          className={clsx(
                            'mt-2 size-1 shrink-0 rounded-full',
                            avoid ? 'bg-rose-400' : 'bg-zinc-300',
                          )}
                        />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{term}</dt>
      <dd className="mt-1 text-sm/5 text-zinc-700">{children}</dd>
    </div>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.53 9.72l3.62 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.62A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8.5 5.5a3 3 0 0 1 4.24 0l1.76 1.76a3 3 0 0 1-4.24 4.24l-.7-.7a.75.75 0 1 1 1.06-1.06l.7.7a1.5 1.5 0 1 0 2.12-2.12l-1.76-1.76a1.5 1.5 0 0 0-2.12 0 .75.75 0 0 1-1.06-1.06Z" />
      <path d="M11.5 14.5a3 3 0 0 1-4.24 0L5.5 12.74a3 3 0 0 1 4.24-4.24l.7.7a.75.75 0 0 1-1.06 1.06l-.7-.7a1.5 1.5 0 0 0-2.12 2.12l1.76 1.76a1.5 1.5 0 0 0 2.12 0 .75.75 0 0 1 1.06 1.06Z" />
    </svg>
  )
}

function ExternalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11 3a1 1 0 1 0 0 2h1.586l-5.293 5.293a1 1 0 1 0 1.414 1.414L14 6.414V8a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-4Z" />
      <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
    </svg>
  )
}

function WarnIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
