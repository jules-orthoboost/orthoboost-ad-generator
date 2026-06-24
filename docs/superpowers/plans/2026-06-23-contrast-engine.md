# Contrast Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pure, dependency-free WCAG-2.1 color module (`src/core/contrast.ts`) that measures contrast and returns a guaranteed-AA-legible color from a palette against any background.

**Architecture:** Two layers. Task 1 is the measurement primitives (hex↔rgb, relative luminance, contrast ratio, AA check). Task 2 is the decision function `pickLegibleColor`, which uses Task 1 to pick the best passing palette color or ramp toward black/white until AA holds. No app wiring in this plan — the module is standalone and consumed by later slices.

**Tech Stack:** TypeScript, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-23-contrast-engine-design.md`

## Global Constraints

- **Pure & dependency-free.** No new npm packages; `contrast.ts` imports nothing from the app and has no side effects.
- **WCAG 2.1 AA:** 4.5:1 normal, 3:1 large. The engine never infers font size — callers pass `{ large }`.
- **`pickLegibleColor` must NEVER return a failing color.** Its guarantee (true black/white passes for any background) is the central invariant and must be tested against mid-gray `#777777`.
- **Full `npm test` gates the deploy.** Run the entire suite before committing. Type-check with `npx tsc -b`.
- **CRLF:** commit with `git -c core.autocrlf=false`. End each commit message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Hex inputs are `#rgb` or `#rrggbb`; `rgbToHex` outputs lowercase `#rrggbb`.

---

### Task 1: Measurement primitives

**Files:**
- Create: `src/core/contrast.ts`
- Test: `src/core/contrast.test.ts`

**Interfaces:**
- Produces (Task 2 + later slices rely on these):
  - `interface Rgb { r: number; g: number; b: number }`
  - `hexToRgb(hex: string): Rgb`
  - `rgbToHex(rgb: Rgb): string`
  - `relativeLuminance(rgb: Rgb): number`
  - `contrastRatio(a: string, b: string): number`
  - `meetsAA(ratio: number, opts?: { large?: boolean }): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/core/contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, relativeLuminance, contrastRatio, meetsAA } from './contrast'

describe('hexToRgb / rgbToHex', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 })
  })
  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 })
  })
  it('round-trips to lowercase 6-digit hex', () => {
    expect(rgbToHex({ r: 255, g: 136, b: 0 })).toBe('#ff8800')
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })
  it('clamps out-of-range channels', () => {
    expect(rgbToHex({ r: 300, g: -5, b: 128 })).toBe('#ff0080')
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black vs white and symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
  })
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#3182ce', '#3182ce')).toBeCloseTo(1, 5)
  })
})

describe('meetsAA', () => {
  it('uses 4.5 for normal text and 3 for large', () => {
    expect(meetsAA(4.5)).toBe(true)
    expect(meetsAA(4.49)).toBe(false)
    expect(meetsAA(3, { large: true })).toBe(true)
    expect(meetsAA(2.99, { large: true })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests — verify they fail**

Run: `npm test -- src/core/contrast.test.ts`
Expected: FAIL — `contrast.ts` does not exist / functions undefined.

- [ ] **Step 3: Implement the primitives**

Create `src/core/contrast.ts`:

```ts
// Pure WCAG 2.1 color math. No dependencies, no app imports, no side effects.

export interface Rgb {
  r: number
  g: number
  b: number
}

const clamp255 = (n: number): number => Math.max(0, Math.min(255, Math.round(n)))

/** Parse `#rgb` or `#rrggbb` (case-insensitive) into 0–255 channels. */
export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`invalid hex color: ${hex}`)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Channels (clamped) to lowercase `#rrggbb`. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = (n: number) => clamp255(n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/** WCAG 2.1 relative luminance (sRGB), 0–1. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio between two hex colors, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a))
  const lb = relativeLuminance(hexToRgb(b))
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** AA threshold: 3:1 for large/graphical, else 4.5:1. */
export function meetsAA(ratio: number, opts?: { large?: boolean }): boolean {
  return ratio >= (opts?.large ? 3 : 4.5)
}
```

- [ ] **Step 4: Run the tests — verify they pass**

Run: `npm test -- src/core/contrast.test.ts`
Expected: PASS (all primitive tests green).

- [ ] **Step 5: Type-check, full suite, commit**

Run: `npx tsc -b` (expect clean) and `npm test` (expect whole suite green).
Then:
```bash
git -c core.autocrlf=false add src/core/contrast.ts src/core/contrast.test.ts
git -c core.autocrlf=false commit -m "feat: add WCAG contrast primitives (luminance, ratio, AA)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `pickLegibleColor`

**Files:**
- Modify: `src/core/contrast.ts`
- Test: `src/core/contrast.test.ts`

**Interfaces:**
- Consumes (from Task 1): `hexToRgb`, `rgbToHex`, `relativeLuminance`, `contrastRatio`, `meetsAA`, `Rgb`.
- Produces: `pickLegibleColor(against: string, palette: string[], opts?: { large?: boolean }): string` — always returns an AA-passing hex vs `against`.

- [ ] **Step 1: Write the failing tests**

Append to `src/core/contrast.test.ts`:

```ts
import { pickLegibleColor } from './contrast'

describe('pickLegibleColor', () => {
  const ratio = (a: string, b: string) => contrastRatio(a, b)

  it('returns the highest-contrast palette color that passes AA', () => {
    // White bg: navy passes (high contrast), pale-blue fails; navy wins.
    const got = pickLegibleColor('#ffffff', ['#bee3f8', '#1a365d'])
    expect(got).toBe('#1a365d')
    expect(ratio(got, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('still returns an AA-passing color when no palette color passes', () => {
    // Mid-gray bg where neither pale palette color passes: must ramp to a passing tone.
    const bg = '#777777'
    const got = pickLegibleColor(bg, ['#888888', '#909090'])
    expect(ratio(got, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('guarantees AA for mid-gray even with an empty palette', () => {
    const bg = '#777777'
    const got = pickLegibleColor(bg, [])
    expect(ratio(got, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('honors the large-text 3:1 threshold', () => {
    const bg = '#ffffff'
    // A mid-tone that clears 3:1 but not 4.5:1 should be acceptable when large.
    const got = pickLegibleColor(bg, ['#949494'], { large: true })
    expect(ratio(got, bg)).toBeGreaterThanOrEqual(3)
  })

  it('lightens toward white on a dark background', () => {
    const got = pickLegibleColor('#000000', ['#222222'])
    // Forced to ramp; result must pass and be lighter than the failing input.
    expect(ratio(got, '#000000')).toBeGreaterThanOrEqual(4.5)
  })
})
```

- [ ] **Step 2: Run the tests — verify they fail**

Run: `npm test -- src/core/contrast.test.ts`
Expected: FAIL — `pickLegibleColor` is not exported.

- [ ] **Step 3: Implement `pickLegibleColor`**

Append to `src/core/contrast.ts`:

```ts
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * A hex color guaranteed to meet AA against `against`.
 * 1) highest-contrast palette color that already passes, else
 * 2) ramp the highest-contrast palette color (or a near-tone when the palette is
 *    empty) toward the background-appropriate extreme until it passes. The endpoint
 *    is true black/white, which passes for any background, so this never fails.
 */
export function pickLegibleColor(
  against: string,
  palette: string[],
  opts?: { large?: boolean },
): string {
  const passes = (c: string) => meetsAA(contrastRatio(c, against), opts)
  const better = (a: string, b: string) =>
    contrastRatio(a, against) >= contrastRatio(b, against) ? a : b

  const passing = palette.filter(passes)
  if (passing.length) return passing.reduce(better)

  const bgIsDark = relativeLuminance(hexToRgb(against)) < 0.5
  const target: Rgb = bgIsDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  const start = palette.length
    ? hexToRgb(palette.reduce(better))
    : hexToRgb(bgIsDark ? '#fafafa' : '#111111')

  for (let t = 0; t <= 1; t += 0.04) {
    const candidate = rgbToHex({
      r: lerp(start.r, target.r, t),
      g: lerp(start.g, target.g, t),
      b: lerp(start.b, target.b, t),
    })
    if (passes(candidate)) return candidate
  }
  return rgbToHex(target) // guaranteed-passing endpoint (defensive; loop normally returns first)
}
```

- [ ] **Step 4: Run the tests — verify they pass**

Run: `npm test -- src/core/contrast.test.ts`
Expected: PASS (all `pickLegibleColor` tests green, including the mid-gray and empty-palette guarantees).

- [ ] **Step 5: Type-check, full suite, commit**

Run: `npx tsc -b` (expect clean) and `npm test` (expect whole suite green).
Then:
```bash
git -c core.autocrlf=false add src/core/contrast.ts src/core/contrast.test.ts
git -c core.autocrlf=false commit -m "feat: add pickLegibleColor with guaranteed-AA fallback ramp

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** API (hexToRgb/rgbToHex/relativeLuminance/contrastRatio/meetsAA/pickLegibleColor) → Tasks 1–2. AA thresholds + `large` flag → `meetsAA` + Task 2 large test. "Always returns a passing color" invariant + mid-gray hard case → Task 2 Steps 1/3. Pure/dependency-free → Global Constraints + the module imports nothing. Out-of-scope wiring is correctly absent.

**Placeholder scan:** none — every step has complete code and exact commands.

**Type consistency:** `Rgb`, the six function signatures, and the `{ large }` opts shape are identical across both tasks and the spec. Task 2 consumes only names Task 1 produces.
