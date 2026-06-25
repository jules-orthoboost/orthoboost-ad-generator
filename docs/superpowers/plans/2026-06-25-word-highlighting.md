# Word-Level Highlighting (§5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users highlight specific words within headline/subhead; render them as an accent rounded-rect with AA-legible text, stored as `{start,end}` offsets that survive render and export.

**Architecture:** A `Range` type + optional `SlotContent.highlights` carry offsets through the existing draft → render → export pipeline. A shared `<Highlighted>` component renders a string with ranges as styled `<mark>`s, computing the legible text color via the contrast engine. The 6 templates render headline/subhead through it (joe maps ranges per line). The copy step authors ranges from textarea selections.

**Tech Stack:** React 19, TypeScript, Zod, Vitest. Consumes `src/core/contrast.ts`.

**Spec:** `docs/superpowers/specs/2026-06-25-word-highlighting-design.md`

## Global Constraints

- **Highlights ride `SlotContent`** — once `SlotContent.highlights` exists and `resolveDraftContent` populates it, RenderView (campaign + batch) and the export config pass it through unchanged. Do not add a parallel pipeline.
- **Contrast:** highlighted text color = `pickLegibleColor(tokens.accent, [tokens.brand, tokens.ink, tokens.surface, tokens.accent, tokens.onBrand])`. Background = `tokens.accent`.
- **Out-of-bounds ranges are clipped at render** (never throw); the helper renders plain text when `ranges` is empty/undefined.
- **joe-value-card keeps its line-2 auto-accent**; highlights layer on top, mapped to per-line offsets.
- **Full `npm test` gates the deploy.** Run the whole suite. Type-check `npx tsc -b`.
- **CRLF:** commit with `git -c core.autocrlf=false`; end each message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Render side — `Range` type, `<Highlighted>`, template adoption

**Files:**
- Modify: `src/core/schemas.ts`
- Create: `src/templates/hifi/Highlighted.tsx`
- Test: `src/templates/hifi/Highlighted.test.tsx`
- Modify: `src/templates/hifi/{offer-card,hero-banner-cta,rogers-disc,rogers-photocard,rogers-fullbleed}/Template.tsx`
- Modify: `src/templates/hifi/joe-value-card/Template.tsx`

**Interfaces:**
- Produces: `Range` (`{ start: number; end: number }`); `SlotContent.highlights?: { headline?: Range[]; subhead?: Range[] }`; `Highlighted` component (`{ text, ranges?, tokens, offset? }`).

- [ ] **Step 1: Add the `Range` type and `highlights` to `src/core/schemas.ts`**

After `SlotName`/before `SlotContentSchema`, add:
```ts
export const RangeSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
})
export type Range = z.infer<typeof RangeSchema>

export const HighlightsSchema = z.object({
  headline: z.array(RangeSchema).optional(),
  subhead: z.array(RangeSchema).optional(),
})
```
Add one field to `SlotContentSchema` (keep all existing fields):
```ts
  // Word-level highlight ranges per field (character offsets into the rendered text).
  highlights: HighlightsSchema.optional(),
```

- [ ] **Step 2: Write the failing `<Highlighted>` test**

Create `src/templates/hifi/Highlighted.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Highlighted } from './Highlighted'
import type { ResolvedTokens } from '../../core/tokens'

const tokens = {
  brand: '#1f6feb', ink: '#10243f', surface: '#ffffff', accent: '#ffd166', onBrand: '#ffffff',
  displayFont: 'Inter', bodyFont: 'Inter', radius: 16, logoPath: '', clientName: 'X',
  valueProps: [], cssVars: {},
} as ResolvedTokens

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>)

describe('Highlighted', () => {
  it('renders plain text with no ranges', () => {
    const out = html(<Highlighted text="Back to school" tokens={tokens} />)
    expect(out).toBe('Back to school')
    expect(out).not.toContain('<mark')
  })

  it('wraps a single range in a mark and keeps the surrounding text', () => {
    const out = html(<Highlighted text="Back to school" ranges={[{ start: 5, end: 7 }]} tokens={tokens} />)
    expect(out).toContain('Back ')
    expect(out).toContain('<mark')
    expect(out).toContain('to')
    expect(out).toContain(' school')
  })

  it('clips out-of-bounds ranges instead of throwing', () => {
    const out = html(<Highlighted text="Hi" ranges={[{ start: 1, end: 99 }]} tokens={tokens} />)
    expect(out).toContain('<mark')
    expect(out).toContain('i')
  })

  it('normalizes unsorted/overlapping ranges', () => {
    const out = html(
      <Highlighted text="abcdef" ranges={[{ start: 4, end: 6 }, { start: 0, end: 2 }, { start: 1, end: 3 }]} tokens={tokens} />,
    )
    // 'ab' (+overlap to c) ... 'ef' highlighted; no crash, two or three marks.
    expect((out.match(/<mark/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('subtracts the offset (per-line rendering)', () => {
    // Global range 10..12 on a line that starts at global offset 8 -> local 2..4.
    const out = html(<Highlighted text="abcdef" ranges={[{ start: 10, end: 12 }]} tokens={tokens} offset={8} />)
    expect(out).toContain('<mark')
    expect(out).toContain('cd')
  })
})
```

- [ ] **Step 3: Run the test — verify it fails**

Run: `npm test -- src/templates/hifi/Highlighted.test.tsx`
Expected: FAIL — `Highlighted` does not exist.

- [ ] **Step 4: Implement `src/templates/hifi/Highlighted.tsx`**

```tsx
import type { ReactNode } from 'react'
import type { ResolvedTokens } from '../../core/tokens'
import type { Range } from '../../core/schemas'
import { pickLegibleColor } from '../../core/contrast'

interface Props {
  text: string
  ranges?: Range[]
  tokens: ResolvedTokens
  /** Subtracted from each range's start/end — lets a per-line caller pass global offsets. */
  offset?: number
}

/**
 * Render `text` with the given character ranges wrapped in an accent highlight
 * (rounded-rect background + AA-legible text color). Ranges are clamped to the
 * string, sorted, and de-overlapped; out-of-range or empty ranges are ignored.
 */
export function Highlighted({ text, ranges, tokens, offset = 0 }: Props): ReactNode {
  if (!ranges || ranges.length === 0) return text
  const norm = ranges
    .map((r) => ({ start: Math.max(0, r.start - offset), end: Math.min(text.length, r.end - offset) }))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start - b.start)
  if (norm.length === 0) return text

  const hlColor = tokens.accent
  const textColor = pickLegibleColor(hlColor, [
    tokens.brand, tokens.ink, tokens.surface, tokens.accent, tokens.onBrand,
  ])

  const out: ReactNode[] = []
  let cursor = 0
  norm.forEach((r, i) => {
    const start = Math.max(r.start, cursor)
    if (start >= r.end) return // fully covered by a prior (overlapping) range
    if (start > cursor) out.push(text.slice(cursor, start))
    out.push(
      <mark
        key={i}
        style={{
          background: hlColor,
          color: textColor,
          borderRadius: '0.18em',
          padding: '0 0.1em',
          WebkitBoxDecorationBreak: 'clone',
          boxDecorationBreak: 'clone',
        }}
      >
        {text.slice(start, r.end)}
      </mark>,
    )
    cursor = r.end
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return out
}
```

- [ ] **Step 5: Run the test — verify it passes**

Run: `npm test -- src/templates/hifi/Highlighted.test.tsx`
Expected: PASS.

- [ ] **Step 6: Adopt `<Highlighted>` in the 5 plain-string templates**

In each of these files, (a) `import { Highlighted } from '../Highlighted'`, (b) ensure `tokens` is destructured from the component props (add it if absent), and (c) replace the bare text child with the helper. The transformation, for headline:
```tsx
// before:  <h1 className="...">{content.headline}</h1>
// after:
<h1 className="...">
  <Highlighted text={content.headline ?? ''} ranges={content.highlights?.headline} tokens={tokens} />
</h1>
```
and the identical change for subhead (using `content.highlights?.subhead`). Apply to:

| File | headline class | subhead class |
|------|----------------|---------------|
| `offer-card/Template.tsx` | `oc-headline` | (no subhead — skip) |
| `hero-banner-cta/Template.tsx` | `hbc-headline` | `hbc-subhead` (add `tokens` to its destructure — it currently omits it) |
| `rogers-disc/Template.tsx` | `rd-headline` | `rd-subhead` |
| `rogers-photocard/Template.tsx` | `rp-headline` | `rp-subhead` |
| `rogers-fullbleed/Template.tsx` | `rf-headline` | `rf-subhead` |

(`content.headline`/`content.subhead` are already guarded by `content.headline && (...)`, so inside the guard they are defined; the `?? ''` is belt-and-suspenders for the helper's `text` prop type.)

- [ ] **Step 7: Adopt in joe-value-card, preserving the line-2 accent**

In `src/templates/hifi/joe-value-card/Template.tsx`, import `Highlighted`. Replace the `headlineLines` computation and the headline `<h1>` body. Old:
```tsx
const headlineLines = (content.headline ?? '').split('\n').filter(Boolean)
...
{headlineLines.map((line, i) => (
  <span key={i} className={i === 0 ? 'jvc-hl' : 'jvc-hl jvc-hl-accent'}>
    {line}
  </span>
))}
```
New — keep the line split + index-based accent class, but track each line's global start offset and render through the helper:
```tsx
const rawLines = (content.headline ?? '').split('\n')
let off = 0
const lines = rawLines.map((line) => {
  const start = off
  off += line.length + 1 // +1 for the '\n' that split removed
  return { line, start }
}).filter((l) => l.line)
...
{lines.map(({ line, start }, i) => (
  <span key={i} className={i === 0 ? 'jvc-hl' : 'jvc-hl jvc-hl-accent'}>
    <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
  </span>
))}
```
And the subhead `{content.subhead}` becomes:
```tsx
<Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
```
(`tokens` is already destructured in joe-value-card.)

- [ ] **Step 8: Type-check, full suite, commit**

Run: `npx tsc -b` (clean) and `npm test` (whole suite green — `smoke.test.tsx` renders every template without highlights, exercising the no-ranges path).
```bash
git -c core.autocrlf=false add src/core/schemas.ts src/templates/hifi
git -c core.autocrlf=false commit -m "feat: render word-level highlights in templates via <Highlighted>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Authoring side — draft, resolve, copy-step editor

**Files:**
- Modify: `src/core/gates.ts`
- Test: `src/core/gates.test.ts`
- Modify: `src/pages/Campaign/CopyStep.tsx`

**Interfaces:**
- Consumes: `Range` from `schemas.ts`; `SlotContent.highlights` from Task 1.
- Produces: `FlowDraft.sharedHighlights?: { headline?: Range[]; subhead?: Range[] }`; `resolveDraftContent` attaches `highlights` to its result.

- [ ] **Step 1: Extend `FlowDraft` and `resolveDraftContent` in `src/core/gates.ts`**

Add the import:
```ts
import type { LofiTemplate, SizeKey, SlotContent, Range } from './schemas'
```
Add the field to `FlowDraft` (after `perClient`):
```ts
  /** Word-level highlight ranges for the shared headline/subhead. */
  sharedHighlights?: { headline?: Range[]; subhead?: Range[] }
```
In `resolveDraftContent`, after computing `ov`, build the highlights and include them. A field's highlights are included only when the client is NOT overriding that field (offsets must match the rendered text):
```ts
  const hl = draft.sharedHighlights
  const highlights = hl
    ? {
        headline: ov.headline === undefined ? hl.headline : undefined,
        subhead: ov.subhead === undefined ? hl.subhead : undefined,
      }
    : undefined
```
and add `highlights,` to the returned `SlotContent` object (alongside `photo`). (`ov` is `{}` when the client is not "make different", so `ov.headline` is `undefined` and shared highlights apply; when overriding with a value, that field's highlights are dropped.)

- [ ] **Step 2: Write failing tests in `src/core/gates.test.ts`**

Add to the existing file (the `base` fixture already exists):
```ts
it('attaches shared highlights to resolved content', () => {
  const draft: FlowDraft = { ...base, sharedHighlights: { headline: [{ start: 0, end: 2 }] } }
  expect(resolveDraftContent(draft, 'aloha-orthodontics').highlights?.headline).toEqual([{ start: 0, end: 2 }])
})

it('drops a field’s highlights when the client overrides that field', () => {
  const draft: FlowDraft = {
    ...base,
    sharedHighlights: { headline: [{ start: 0, end: 2 }] },
    perClient: {
      'aloha-orthodontics': { offer: 'X', makeDifferent: true, override: { headline: 'Custom' } },
    },
  }
  expect(resolveDraftContent(draft, 'aloha-orthodontics').highlights?.headline).toBeUndefined()
})
```

- [ ] **Step 3: Run the tests — verify they fail, then pass after Step 1**

Run: `npm test -- src/core/gates.test.ts`
Expected: the two new tests FAIL before Step 1's `highlights` wiring is in place and PASS after. (Implement Step 1 first if writing strictly test-first; either way both must be green here.)

- [ ] **Step 4: Add the highlight editor to `src/pages/Campaign/CopyStep.tsx`**

Import `useRef` (add to the React import) and the `Range` type:
```ts
import { useRef, type ChangeEvent } from 'react'
import type { Range } from '../../core/schemas'
```
Inside `CopyStep`, add refs and the highlightable set + handlers (place near the other `setShared`/`updatePC` helpers):
```ts
  const HIGHLIGHTABLE = ['headline', 'subhead'] as const
  const fieldRefs = {
    headline: useRef<HTMLTextAreaElement>(null),
    subhead: useRef<HTMLTextAreaElement>(null),
  }

  const addHighlight = (field: 'headline' | 'subhead') => {
    const el = fieldRefs[field].current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start == null || end == null || start >= end) return
    setDraft((d) => {
      const cur = d.sharedHighlights?.[field] ?? []
      const next: Range[] = [...cur, { start, end }]
      return { ...d, sharedHighlights: { ...d.sharedHighlights, [field]: next } }
    })
  }

  const removeHighlight = (field: 'headline' | 'subhead', i: number) =>
    setDraft((d) => {
      const cur = d.sharedHighlights?.[field] ?? []
      return { ...d, sharedHighlights: { ...d.sharedHighlights, [field]: cur.filter((_, j) => j !== i) } }
    })
```
In the shared-fields `.map`, attach the ref to the headline/subhead textareas and render the highlight controls beneath them. Where the multiline `<Textarea ... />` is rendered, for a highlightable field, add `ref={fieldRefs[field as 'headline' | 'subhead']}` and, after the `<Textarea>`, render:
```tsx
{(HIGHLIGHTABLE as readonly string[]).includes(field) && (
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <button
      type="button"
      onClick={() => addHighlight(field as 'headline' | 'subhead')}
      className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-700"
    >
      Highlight selection
    </button>
    {(draft.sharedHighlights?.[field as 'headline' | 'subhead'] ?? []).map((r, i) => (
      <span key={i} className="inline-flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-zinc-900">
        {(value as string).slice(r.start, r.end) || '…'}
        <button type="button" onClick={() => removeHighlight(field as 'headline' | 'subhead', i)} className="font-bold">
          ×
        </button>
      </span>
    ))}
  </div>
)}
```
(`value` is the field's current string already computed in the map: `const value = draft.shared[field] ?? ''`. `field` iterates `SHARED_FIELDS`; only headline/subhead are multiline and highlightable.)

- [ ] **Step 5: Type-check, full suite, commit**

Run: `npx tsc -b` (clean) and `npm test` (whole suite green).
```bash
git -c core.autocrlf=false add src/core/gates.ts src/core/gates.test.ts src/pages/Campaign/CopyStep.tsx
git -c core.autocrlf=false commit -m "feat: author word-level highlights in the copy step

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** `Range` + `SlotContent.highlights` → T1 S1. `<Highlighted>` (accent rounded-rect, contrast-corrected text, clip out-of-bounds) → T1 S4 + test S2. All 6 templates incl. joe line-mapping → T1 S6–S7. Draft storage + resolve (with override-drop) → T2 S1–S3. Editor (select → button → chips) → T2 S4. Export passthrough is automatic (highlights ride `SlotContent`). Verification items all map to tests.

**Placeholder scan:** none — full code for the helper, schema, joe mapping, resolve logic, editor handlers, and tests; the 5 near-identical templates use one shown transformation + a per-file class table (a mechanical, fully-specified change, not a "similar to" hand-wave).

**Type consistency:** `Range`/`highlights` shapes identical across schemas, gates, helper, and editor. `Highlighted` props (`text, ranges?, tokens, offset?`) match every call site. `resolveDraftContent(draft, brandSlug)` signature unchanged (Task-1-of-V1/V2 contract preserved) — only its return gains `highlights`.
