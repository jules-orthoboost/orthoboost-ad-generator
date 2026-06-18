import { useState } from 'react'
import clsx from 'clsx'
import { loadBrandKits, loadPersonas } from '../core/data'
import { BrandKitCard } from '../components/BrandKitCard'
import { Subheading } from '../components/catalyst/heading'

const kits = loadBrandKits()
const personas = loadPersonas()

export function BrandKits() {
  const slugs = Object.keys(kits).sort((a, b) => kits[a].clientName.localeCompare(kits[b].clientName))
  const [selected, setSelected] = useState(slugs[0])
  const kit = kits[selected]
  const persona = personas[kit.personaSlug]

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-0.5">
        <Subheading className="px-2 pb-2">Brand kits ({slugs.length})</Subheading>
        {slugs.map((slug) => (
          <button
            key={slug}
            onClick={() => setSelected(slug)}
            className={clsx(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
              slug === selected ? 'bg-zinc-950/5 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-950/5',
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ background: kits[slug].colors.brand }}
            />
            <span className="truncate">{kits[slug].clientName}</span>
          </button>
        ))}
      </aside>

      <main className="min-w-0">
        <BrandKitCard kit={kit} persona={persona} />
      </main>
    </div>
  )
}
