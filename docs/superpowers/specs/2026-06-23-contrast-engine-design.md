# Contrast Engine — Design

- **Date:** 2026-06-23
- **Status:** Approved (ready for implementation plan)
- **Scope:** The pure WCAG color-math module only. This is the foundation that later
  slices call into — §6 palette application, §7 logo recolor, §5 highlight contrast.
  **No wiring into tokens/templates/logos in this slice** — that is the next slice.

## Problem

No contrast/luminance/WCAG code exists anywhere in the repo. Several upcoming
features need to guarantee legibility automatically. Build the math once, as a
pure dependency-free module with thorough unit tests, before anything consumes it.

## Decisions (locked)

- **WCAG 2.1 relative-luminance** formula, sRGB.
- **AA** targets: **4.5:1** normal text, **3:1** large text / graphical. "Large" =
  ≥24px, or ≥18.66px bold — the *caller* decides and passes a `large` flag; the
  engine does not know font sizes.
- Colors are 6-digit hex (`#rrggbb`), matching the app's `HexColor` format. 3-digit
  shorthand is also accepted for robustness.
- **`pickLegibleColor` always returns an AA-passing color.** Strategy:
  1. Among palette colors, return the **highest-contrast one that passes** vs the background.
  2. If none pass, take the highest-contrast palette color and **ramp it toward the
     background-appropriate extreme** (white for dark backgrounds, black for light)
     until it passes.
  3. The ramp endpoint is **true black/white**, which is mathematically guaranteed
     to pass for *any* background — so the function can never return a failing color.
- **Refinement of the brief:** the brief said the final fallback is near-black `#111`
  / near-white `#FAFAFA` "whichever passes." For mid-tone backgrounds (~`#777`)
  *neither* clears 4.5:1, so to keep the "always legible" guarantee the ramp continues
  to true `#000`/`#FFF` when necessary. Softer tones are still preferred — the ramp
  returns the *first* passing step, so most backgrounds yield a non-harsh result.

## API (`src/core/contrast.ts`, pure, no deps)

```ts
export interface Rgb { r: number; g: number; b: number } // 0–255

export function hexToRgb(hex: string): Rgb            // accepts #rgb or #rrggbb
export function rgbToHex(rgb: Rgb): string            // -> #rrggbb (lowercase)
export function relativeLuminance(rgb: Rgb): number   // WCAG 2.1, 0–1
export function contrastRatio(a: string, b: string): number  // 1–21
export function meetsAA(ratio: number, opts?: { large?: boolean }): boolean // >=3 large else >=4.5
export function pickLegibleColor(
  against: string,
  palette: string[],
  opts?: { large?: boolean },
): string // always AA-passing vs `against`
```

## Out of scope (later slices)

Wiring contrast into `resolveTokens` / template rendering (§6 palette application),
logo SVG recolor (§7), the highlight-vs-accent check (§5), and the cross-persona
"nothing renders below threshold" integration test. This slice ships the engine + its
own unit tests only.

## Verification

Unit tests (`src/core/contrast.test.ts`) asserting: known anchors (black/white = 21:1,
identical colors = 1:1), the AA boundary (a pair just above/below 4.5), `meetsAA`
large vs normal thresholds, `pickLegibleColor` returning the highest-contrast passing
palette color when one exists, and — critically — that it returns an AA-passing color
even when no palette color passes, across hard backgrounds **including mid-gray
`#777777`** (where the ramp must reach near-pure black/white).
