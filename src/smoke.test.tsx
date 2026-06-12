import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'
import { CampaignBuilder } from './pages/Campaign/CampaignBuilder'
import { HIFI_TEMPLATES } from './templates/hifi'
import { TemplateFrame } from './templates/hifi/TemplateFrame'
import { resolveTokens } from './core/tokens'
import { loadBrandKits, loadLofiTemplates, loadPersonas } from './core/data'
import type { SizeKey } from './core/schemas'

// Renders the whole app (with real repo data via import.meta.glob) to catch runtime errors.
describe('app smoke', () => {
  it('renders the inspector with real data', () => {
    // Strip SSR comment markers so assertions can span JSX interpolation boundaries.
    const html = renderToString(<App />).replace(/<!-- -->/g, '')
    expect(html).toContain('Lo-Fi Archetypes (5)')
    expect(html).toContain('Personas (11)')
    expect(html).toContain('Badge Burst')
  })

  it('renders the campaign builder on its first step', () => {
    const html = renderToString(<CampaignBuilder />).replace(/<!-- -->/g, '')
    expect(html).toContain('Choose a client')
  })
})

describe('hi-fi templates render', () => {
  const kits = loadBrandKits()
  const personas = loadPersonas()
  const lofi = loadLofiTemplates()
  const kit = Object.values(kits)[0]
  const persona = personas[kit.personaSlug]
  const tokens = resolveTokens(persona, kit)

  for (const [slug, { manifest, Component }] of Object.entries(HIFI_TEMPLATES)) {
    for (const size of ['Story', 'Post'] as SizeKey[]) {
      it(`${slug} renders ${size} without throwing`, () => {
        const grammar = lofi[manifest.archetype].videoGrammar
        const html = renderToString(
          <TemplateFrame size={size} tokens={tokens}>
            <Component
              size={size}
              tokens={tokens}
              content={{ headline: 'Test', offer: '$500 off', cta: 'Book now' }}
              logoUrl="logo.svg"
              beats={grammar.beats}
              durationMs={grammar.durationMs}
              playing={false}
              reducedMotion={false}
            />
          </TemplateFrame>,
        )
        expect(html.length).toBeGreaterThan(0)
      })
    }
  }
})
