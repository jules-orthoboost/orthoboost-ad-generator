import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'

// Renders the whole app (with real repo data via import.meta.glob) to catch runtime errors.
describe('app smoke', () => {
  it('renders the inspector with real data', () => {
    // Strip SSR comment markers so assertions can span JSX interpolation boundaries.
    const html = renderToString(<App />).replace(/<!-- -->/g, '')
    expect(html).toContain('Lo-Fi Archetypes (5)')
    expect(html).toContain('Personas (11)')
    expect(html).toContain('Badge Burst')
  })
})
