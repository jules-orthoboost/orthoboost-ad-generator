import { describe, it, expect } from 'vitest'
import {
  personaGate,
  brandsGate,
  campaignGate,
  templatesGate,
  copyGate,
  resolveDraftContent,
  fitProblem,
  type FlowDraft,
} from './gates'
import type { LofiTemplate } from './schemas'

const base: FlowDraft = {
  personaSlug: 'dr-m-rogers',
  brandSlugs: ['aloha-orthodontics'],
  campaignSlug: 'back-to-school-2026',
  templateSlugs: ['rogers-photocard'],
  shared: {
    V1: { headline: 'Hi', subhead: 'There', cta: 'Book' },
    V2: { headline: 'Hi', subhead: 'There', cta: 'Book' },
  },
  perClient: {
    'aloha-orthodontics': { V1: { offer: 'Free consult' }, V2: { offer: 'Free consult' } },
  },
}

it('selection gates require their field', () => {
  expect(personaGate({ ...base, personaSlug: undefined }).ok).toBe(false)
  expect(personaGate(base).ok).toBe(true)
  expect(brandsGate({ ...base, brandSlugs: [] }).ok).toBe(false)
  expect(brandsGate(base).ok).toBe(true)
  expect(campaignGate({ ...base, campaignSlug: undefined }).ok).toBe(false)
  expect(templatesGate({ ...base, templateSlugs: [] }).ok).toBe(false)
})

it('copyGate needs shared headlines and a per-client offer', () => {
  expect(copyGate(base).ok).toBe(true)
  const noOffer = { ...base, perClient: { 'aloha-orthodontics': { V1: {}, V2: {} } } }
  expect(copyGate(noOffer).ok).toBe(false)
  const noHead = { ...base, shared: { V1: { cta: 'Book' }, V2: { cta: 'Book' } } }
  expect(copyGate(noHead).missing.join(' ')).toMatch(/headline/i)
})

it('resolveDraftContent merges shared copy with per-client offer/photo', () => {
  const c = resolveDraftContent(base, 'V1', 'aloha-orthodontics')
  expect(c.headline).toBe('Hi')
  expect(c.offer).toBe('Free consult')
})

it('"make different" overrides shared copy for one client', () => {
  const draft: FlowDraft = {
    ...base,
    perClient: {
      'aloha-orthodontics': {
        V1: { offer: 'X', makeDifferent: true, override: { headline: 'Custom' } },
        V2: {},
      },
    },
  }
  expect(resolveDraftContent(draft, 'V1', 'aloha-orthodontics').headline).toBe('Custom')
  // override ignored when the toggle is off
  const off = { ...draft.perClient['aloha-orthodontics'].V1, makeDifferent: false }
  const draft2 = { ...draft, perClient: { 'aloha-orthodontics': { V1: off, V2: {} } } }
  expect(resolveDraftContent(draft2, 'V1', 'aloha-orthodontics').headline).toBe('Hi')
})

it('attaches shared highlights to resolved content', () => {
  const draft: FlowDraft = { ...base, sharedHighlights: { headline: [{ start: 0, end: 2 }] } }
  expect(resolveDraftContent(draft, 'V1', 'aloha-orthodontics').highlights?.headline).toEqual([{ start: 0, end: 2 }])
})

it('drops a field\'s highlights when the client overrides that field', () => {
  const draft: FlowDraft = {
    ...base,
    sharedHighlights: { headline: [{ start: 0, end: 2 }] },
    perClient: {
      'aloha-orthodontics': {
        V1: { offer: 'X', makeDifferent: true, override: { headline: 'Custom' } },
        V2: { offer: 'Free consult' },
      },
    },
  }
  expect(resolveDraftContent(draft, 'V1', 'aloha-orthodontics').highlights?.headline).toBeUndefined()
})

const archetype = {
  zones: {
    Story: [{ slot: 'headline', x: 90, y: 460, w: 900, h: 300, layer: 1, maxLines: 2 }],
    Post: [{ slot: 'headline', x: 90, y: 240, w: 900, h: 260, layer: 1, maxLines: 2 }],
  },
} as unknown as LofiTemplate

describe('fitProblem', () => {
  it('passes short copy, flags long copy', () => {
    expect(fitProblem('Short', [archetype], 'headline')).toBeNull()
    expect(fitProblem('word '.repeat(60).trim(), [archetype], 'headline')).toMatch(/too long/i)
  })
})
