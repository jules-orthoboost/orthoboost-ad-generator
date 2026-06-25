# Palette Contrast Pass (§6) — Design

- **Date:** 2026-06-23
- **Status:** Approved (ready for implementation plan)
- **Depends on:** the contrast engine (`src/core/contrast.ts`) — built on `feat/contrast-engine`; this slice branches off it.
- **Scope:** Wire the contrast engine into token resolution so text always clears WCAG AA against its background. **§7 logo recolor is deferred to the importer slice (#4)** — the existing logos are hand-tuned and recoloring needs SVG inlining; imported logos are where it's actually needed.

## Problem

Brand kits can set text/background colors that fail legibility (e.g. a pale `ink` on white, or white `onBrand` over a light brand color). The brief (§6) requires auto-enforcing AA on every palette change and persona switch.

## Why `resolveTokens` is the one place to do it

All color flows through `resolveTokens(persona, kit) → ResolvedTokens` (roles + `cssVars`). It's pure and shared by the browser preview and the export harness, and templates consume only `cssVars` (`var(--ink)`, `var(--on-brand)`, …). Correcting roles there fixes every template at once, with no per-template edits, and re-runs automatically on every persona/kit switch.

## Decisions (locked)

- Enforce the two **canonical text↔background contracts**:
  - `ink` vs `surface` (body text on background)
  - `onBrand` vs `brand` (text on brand-colored elements)
- **AA, normal text (4.5:1).** (`accent` is decorative / the §5 highlight color — out of scope here.)
- **Non-destructive:** backgrounds (`brand`, `surface`) are preserved; a text role is changed **only when it fails**, and then set to `pickLegibleColor(background, palette)` where `palette = unique([brand, ink, surface, accent, onBrand])`. The engine guarantees the result passes AA.
- `cssVars` are rebuilt from the corrected roles. `resolveTokens`'s signature is unchanged.

## Out of scope

§7 logo recolor (→ importer slice). `accent`-as-text contrast. Dominant-color sampling behind text over photos (the deferred scrim approach). Per-template element-level contrast (the role contracts are the generic contract templates already honor).

## Verification

`src/core/tokens.test.ts`:
- A kit whose `ink` fails vs `surface` → resolved `ink` differs and now clears AA.
- A kit whose `onBrand` fails vs `brand` → resolved `onBrand` now clears AA.
- A passing kit is left unchanged.
- **The brief's cross-persona guarantee:** load **all** brand kits, resolve each against its persona, and assert both `ink↔surface` and `onBrand↔brand` clear AA — i.e. no text role renders below threshold for any client.
