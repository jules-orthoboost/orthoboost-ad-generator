import { describe, it, expect } from 'vitest'
import { validateAll } from './data'
import { PersonaSchema } from './schemas'

const persona = {
  slug: 'family-first',
  name: 'Family First',
  archetype: 'Family-Focused Community Ortho',
  accentColor: '#38a169',
  positioning: 'x',
  messagingBehavior: 'x',
  patientBase: [],
  exampleClients: [],
  layout: [],
  visualTone: [],
  iconography: [],
  texture: [],
  designPrinciples: [],
  donts: [],
}

describe('validateAll', () => {
  it('returns parsed entities keyed by slug', () => {
    const out = validateAll(PersonaSchema, { '/data/personas/family-first.json': persona })
    expect(out['family-first'].name).toBe('Family First')
  })

  it('names the bad file in the error', () => {
    expect(() => validateAll(PersonaSchema, { '/data/personas/bad.json': { slug: 'BAD' } })).toThrow(
      /bad\.json/,
    )
  })
})
