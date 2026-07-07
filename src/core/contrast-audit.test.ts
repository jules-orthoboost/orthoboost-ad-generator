import { describe, expect, it } from 'vitest'
import { loadBrandKits, loadPersonas } from './data'
import { resolveTokens } from './tokens'
import { contrastRatio } from './contrast'
import { hexToRgb, rgbToHsl } from './contrast'

/**
 * Every brand kit must resolve to an AA-legible palette on every text role a
 * template can paint with it — this is the guarantee behind "any kit renders
 * favorable results". Backgrounds are never altered; only text roles adjust.
 */
describe('contrast audit: all brand kits resolve AA-legible text roles', () => {
  const personas = loadPersonas()
  const kits = Object.values(loadBrandKits())

  it('covers every kit (sanity: kits present)', () => {
    expect(kits.length).toBeGreaterThan(0)
  })

  for (const kit of kits) {
    const persona = personas[kit.personaSlug]
    if (!persona) continue // registry test guards persona integrity separately

    describe(kit.slug, () => {
      const t = resolveTokens(persona, kit)

      it('body ink on surface ≥ 4.5:1', () => {
        expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5)
      })

      it('onBrand text on brand ≥ 4.5:1', () => {
        expect(contrastRatio(t.onBrand, t.brand)).toBeGreaterThanOrEqual(4.5)
      })

      it('accent display text on surface ≥ 3:1 (AA large)', () => {
        expect(contrastRatio(t.accentText, t.surface)).toBeGreaterThanOrEqual(3)
      })

      it('text on accent fills ≥ 4.5:1', () => {
        expect(contrastRatio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5)
      })

      it('accentText keeps the kit accent hue (±8° unless achromatic)', () => {
        const raw = rgbToHsl(hexToRgb(t.accent))
        const adj = rgbToHsl(hexToRgb(t.accentText))
        // Hue is meaningless for near-greys or once a walk hits an extreme.
        if (raw.s < 0.1 || adj.l <= 0.02 || adj.l >= 0.98) return
        const delta = Math.abs(raw.h - adj.h)
        expect(Math.min(delta, 360 - delta)).toBeLessThanOrEqual(8)
      })
    })
  }
})
