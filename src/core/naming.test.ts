import { describe, it, expect } from 'vitest'
import { deliverableName } from './naming'

describe('deliverableName', () => {
  it('builds the canonical file name', () => {
    expect(
      deliverableName({
        adSetType: 'Seasonal',
        theme: 'Back To School',
        year: 2026,
        creativeType: 'Video',
        version: 'V1',
        size: 'Story',
        clientName: 'Smith Orthodontics',
      }),
    ).toBe('Seasonal_BackToSchool-2026_Video_V1_Story_SmithOrthodontics')
  })

  it('supports Evergreen + Image + Post', () => {
    expect(
      deliverableName({
        adSetType: 'Evergreen',
        theme: 'Summer',
        year: 2026,
        creativeType: 'Image',
        version: 'V2',
        size: 'Post',
        clientName: 'Bracket Co',
      }),
    ).toBe('Evergreen_Summer-2026_Image_V2_Post_BracketCo')
  })

  it('strips punctuation from client names', () => {
    expect(
      deliverableName({
        adSetType: 'Evergreen',
        theme: 'New Years',
        year: 2027,
        creativeType: 'Image',
        version: 'V1',
        size: 'Post',
        clientName: "O'Brien & Sons Ortho.",
      }),
    ).toBe('Evergreen_NewYears-2027_Image_V1_Post_OBrienSonsOrtho')
  })
})
