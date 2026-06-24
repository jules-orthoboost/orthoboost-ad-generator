import { describe, it, expect } from 'vitest'
import { buildContentsPayload } from './persist'
import type { Campaign } from './schemas'

const campaign = {
  slug: 'demo',
  clientSlug: 'mock-ortho-co',
  adSetType: 'Seasonal',
  theme: 'X',
  year: 2026,
  hifiTemplateSlug: 'hero-banner-cta',
  content: {},
} as Campaign

describe('buildContentsPayload', () => {
  it('targets data/campaigns/<slug>.json with base64 content and a message', () => {
    const p = buildContentsPayload(campaign)
    expect(p.path).toBe('data/campaigns/demo.json')
    expect(p.message).toMatch(/demo/)
    const decoded = JSON.parse(atob(p.contentBase64))
    expect(decoded.slug).toBe('demo')
  })
})
