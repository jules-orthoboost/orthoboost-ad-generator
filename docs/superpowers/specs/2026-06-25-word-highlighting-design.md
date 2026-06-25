# Word-Level Highlighting (§5) — Design

- **Date:** 2026-06-25
- **Status:** Approved (ready for implementation plan)
- **Depends on:** the contrast engine (`src/core/contrast.ts`). Branches off `feat/palette-contrast` (contrast lineage).
- **Scope:** Highlight specific words within **headline** and **subhead** across all 6 hi-fi templates, with the highlight rendered as a rounded-rect background in the persona/brand accent color and AA-legible text on it. Authoring UI in the copy step. Ranges persist through render + export.

## Decisions (locked)

- **Fields:** headline + subhead.
- **Highlight style:** background highlighter — a CSS `<mark>` with the **accent** color as a rounded-rect background; `box-decoration-break: clone` so it survives line wraps. (Locked earlier.)
- **Contrast:** highlighted text color = `pickLegibleColor(accent, [brand, ink, surface, accent, onBrand])` so words on the accent stay AA-legible. Reuses the §6 engine.
- **Storage:** `{ start, end }` character offsets per field on `SlotContent.highlights`, so they ride the existing draft → render → export pipeline unchanged. Multiple ranges per field; out-of-bounds ranges are clipped at render.
- **joe-value-card:** keep its bespoke headline line-split + line-2 auto-accent as the base styling, and **layer explicit highlights on top** (ranges mapped to per-line offsets).
- **Editor:** plain `<Textarea>` + a "Highlight selection" button (reads `selectionStart`/`selectionEnd`) + removable chips. No rich-text editor.
- **Override interaction:** highlights apply to the shared copy text. When a client "makes different" and overrides a field, highlights for that field are dropped for that client (offsets wouldn't match the override text).

## Architecture

- **Data:** `Range` + `SlotContent.highlights?: { headline?: Range[]; subhead?: Range[] }` (Zod, in `schemas.ts`).
- **Render helper:** `src/templates/hifi/Highlighted.tsx` — `({ text, ranges, tokens, offset? }) => ReactNode`. Normalizes/clamps ranges, splits the string, wraps highlighted segments in a styled `<mark>`. Pure render; computes the legible text color via the contrast engine.
- **Templates:** the 5 plain-string templates render headline/subhead through `<Highlighted>`; joe maps ranges per line.
- **Authoring:** `FlowDraft.sharedHighlights?: { headline?: Range[]; subhead?: Range[] }`; `resolveDraftContent` attaches them to `SlotContent.highlights` (omitting a field's highlights when that client overrides it); `CopyStep` gains the highlight UI. RenderView/batch pass `SlotContent` through unchanged, so export is automatic.

## Out of scope

Highlighting of CTA/offer/disclaimer; per-client (non-shared) highlight authoring; highlight colors other than accent; the SVG importer (separate slice). §7 logo recolor remains in the importer slice.

## Verification

- Unit test `Highlighted` segmentation: no ranges → plain text; one range → 3 segments with a `<mark>`; out-of-bounds ranges clipped; overlapping/unsorted ranges normalized.
- `resolveDraftContent` attaches shared highlights; drops them for an overridden field.
- Templates still render (smoke) with and without highlights.
- Full `npm test` green (gates the deploy).
