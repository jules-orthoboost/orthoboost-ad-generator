import { useState } from 'react'
import { loadBrandKits, loadPersonas } from '../core/data'
import { BrandKitCard } from '../components/BrandKitCard'

const kits = loadBrandKits()
const personas = loadPersonas()

export function BrandKits() {
  const slugs = Object.keys(kits).sort()
  const [selected, setSelected] = useState(slugs[0])
  const kit = kits[selected]
  const persona = personas[kit.personaSlug]

  return (
    <div className="layout">
      <aside className="sidebar">
        {slugs.map((slug) => (
          <button
            key={slug}
            className={`side-item ${slug === selected ? 'active' : ''}`}
            onClick={() => setSelected(slug)}
          >
            {kits[slug].clientName}
          </button>
        ))}
      </aside>
      <main className="detail">
        <BrandKitCard kit={kit} persona={persona} />
      </main>
    </div>
  )
}
