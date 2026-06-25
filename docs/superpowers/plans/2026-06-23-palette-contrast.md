# Palette Contrast Pass (§6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `resolveTokens` guarantee WCAG-AA legibility for the two canonical text↔background role pairs, using the contrast engine, non-destructively.

**Architecture:** A small enforcement pass inside `resolveTokens` (`src/core/tokens.ts`) that, after assembling the palette, swaps a text role (`ink`, `onBrand`) for `pickLegibleColor(...)` only when it fails AA against its background (`surface`, `brand`). Backgrounds are preserved; `cssVars` are rebuilt from corrected roles. Templates change nothing — they already consume `cssVars`.

**Tech Stack:** TypeScript, Vitest. Consumes `src/core/contrast.ts` (no new deps).

**Spec:** `docs/superpowers/specs/2026-06-23-palette-contrast-design.md`

## Global Constraints

- **Non-destructive:** only a *failing* text role is changed; `brand`/`surface` backgrounds are never altered. `resolveTokens`'s signature and all other roles/fonts/cssVars stay as they are.
- **AA normal text = 4.5:1** for both contracts.
- **Don't break existing `tokens.test.ts`** — the mock kit's `ink`/`onBrand` already clear AA, so they must remain unchanged after the pass.
- **Full `npm test` gates the deploy** — run the whole suite. Type-check with `npx tsc -b`.
- **CRLF:** commit with `git -c core.autocrlf=false`; end the message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Enforce legible text roles in `resolveTokens`

**Files:**
- Modify: `src/core/tokens.ts`
- Test: `src/core/tokens.test.ts`

**Interfaces:**
- Consumes: `contrastRatio`, `meetsAA`, `pickLegibleColor` from `src/core/contrast.ts`.
- Produces: `resolveTokens(persona, kit): ResolvedTokens` — same signature; `ink`/`onBrand` (and their cssVars) are now guaranteed AA vs `surface`/`brand`.

- [ ] **Step 1: Write the failing tests**

Append to `src/core/tokens.test.ts` (keep the existing tests). Add the import of real loaders + the contrast helper at the top of the file:

```ts
import { contrastRatio } from './contrast'
import { loadBrandKits, loadPersonas } from './data'
```

Then add this `describe` block:

```ts
describe('resolveTokens — AA legibility pass (§6)', () => {
  it('corrects ink that fails against the surface', () => {
    // Pale ink on a white surface fails AA; the pass must replace it with a legible color.
    const badInk = { ...kit, colors: { brand: '#1f6feb', ink: '#cfcfcf', surface: '#ffffff' } } satisfies BrandKit
    const t = resolveTokens(persona, badInk)
    expect(t.ink).not.toBe('#cfcfcf')
    expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5)
    expect(t.cssVars['--ink']).toBe(t.ink)
    expect(t.surface).toBe('#ffffff') // background preserved
  })

  it('corrects onBrand that fails against the brand', () => {
    // White text on a pale-yellow brand fails AA; the pass must fix onBrand.
    const badOnBrand = { ...kit, colors: { brand: '#ffe066', onBrand: '#ffffff' } } satisfies BrandKit
    const t = resolveTokens(persona, badOnBrand)
    expect(contrastRatio(t.onBrand, t.brand)).toBeGreaterThanOrEqual(4.5)
    expect(t.brand).toBe('#ffe066') // background preserved
  })

  it('leaves already-legible roles unchanged', () => {
    // Dark ink on white + white on a mid blue both pass; nothing should change.
    const t = resolveTokens(persona, kit)
    expect(t.ink).toBe('#10243f')
    expect(t.onBrand).toBe('#ffffff')
  })

  it('guarantees AA text on background for every brand kit (cross-persona)', () => {
    const kits = loadBrandKits()
    const personas = loadPersonas()
    for (const k of Object.values(kits)) {
      const p = personas[k.personaSlug]
      const t = resolveTokens(p, k)
      expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(t.onBrand, t.brand)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
```

- [ ] **Step 2: Run the tests — verify they fail**

Run: `npm test -- src/core/tokens.test.ts`
Expected: FAIL — the §6 block fails (ink/onBrand not yet corrected; `--ink` may differ); existing tests still pass.

- [ ] **Step 3: Implement the pass in `src/core/tokens.ts`**

Add the import at the top:

```ts
import { contrastRatio, meetsAA, pickLegibleColor } from './contrast'
```

Replace the body of `resolveTokens` (rename the assembled object to `base`, compute corrected `ink`/`onBrand`, then build `resolved` + `cssVars` from the corrected values):

```ts
export function resolveTokens(persona: Persona, kit: BrandKit): ResolvedTokens {
  const c = kit.colors
  const ty = kit.typography
  const base = {
    brand: c.brand,
    ink: c.ink ?? BASE.ink,
    surface: c.surface ?? BASE.surface,
    accent: c.accent ?? persona.accentColor ?? BASE.accent,
    onBrand: c.onBrand ?? BASE.onBrand,
    displayFont: ty?.displayFont ?? BASE.displayFont,
    bodyFont: ty?.bodyFont ?? BASE.bodyFont,
    radius: kit.radius ?? BASE.radius,
    logoPath: kit.logo.assetPath,
    clientName: kit.clientName,
    valueProps: kit.valueProps ?? [],
    tagline: kit.tagline,
    website: kit.website,
    phone: kit.phone,
    address: kit.address,
    social: kit.social,
  }

  // §6 legibility: body text on surface and text on brand must clear AA.
  // Non-destructive — backgrounds are preserved; only a failing text role is swapped.
  const palette = [...new Set([base.brand, base.ink, base.surface, base.accent, base.onBrand])]
  const ink = meetsAA(contrastRatio(base.ink, base.surface)) ? base.ink : pickLegibleColor(base.surface, palette)
  const onBrand = meetsAA(contrastRatio(base.onBrand, base.brand))
    ? base.onBrand
    : pickLegibleColor(base.brand, palette)
  const resolved = { ...base, ink, onBrand }

  const stack = (f: string) => `${f}, system-ui, sans-serif`
  return {
    ...resolved,
    cssVars: {
      '--brand': resolved.brand,
      '--ink': resolved.ink,
      '--surface': resolved.surface,
      '--accent': resolved.accent,
      '--on-brand': resolved.onBrand,
      '--display-font': stack(resolved.displayFont),
      '--body-font': stack(resolved.bodyFont),
      '--radius': `${resolved.radius}px`,
    },
  }
}
```

- [ ] **Step 4: Run the tests — verify they pass**

Run: `npm test -- src/core/tokens.test.ts`
Expected: PASS — the §6 block passes (including the all-kits guarantee) and every pre-existing `resolveTokens` test still passes.

- [ ] **Step 5: Type-check, full suite, commit**

Run: `npx tsc -b` (expect clean) and `npm test` (expect whole suite green).
Then:
```bash
git -c core.autocrlf=false add src/core/tokens.ts src/core/tokens.test.ts
git -c core.autocrlf=false commit -m "feat: enforce WCAG-AA text legibility in resolveTokens (palette contrast)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** ink↔surface + onBrand↔brand AA enforcement, non-destructive, palette candidates, cssVars rebuilt → Task 1 Step 3. Cross-persona all-kits guarantee + behavior + unchanged-when-passing → Task 1 Step 1. §7 logo and accent-as-text correctly absent (out of scope).

**Placeholder scan:** none — full code and exact commands in every step.

**Type consistency:** `resolveTokens(persona, kit)` signature unchanged; the pass uses only `contrastRatio`/`meetsAA`/`pickLegibleColor` exactly as exported by `contrast.ts`. `meetsAA(contrastRatio(...))` uses the engine's default 4.5 normal-text threshold.
