# OrthoBoost Phase 4 — Render Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Turn a committed render manifest into the named, downloadable finals: static PNGs always, and (in CI) H.264 MP4s, zipped as a workflow artifact — rendered from the same templates the app previews, pixel-identical.

**Architecture:** Add dedicated `/render` routes that mount one `TemplateFrame` at 1:1 with no app chrome. Refactor animation so any moment in time is a **pure function** (progress computed from `nowMs`, applied as inline styles, no CSS transitions) — this is what makes frame-by-frame video deterministic. A Node harness (`harness/render.mjs`) builds + serves the app, drives headless Chromium via Playwright over each requested deliverable, screenshots statics, steps virtual time for videos → ffmpeg → MP4, names everything with the existing `deliverableName()`, and zips.

**Tech Stack:** Existing + `playwright` (devDep, CI-installed browsers), `ffmpeg` (CI apt package). No runtime deps added to the app bundle.

---

## Decisions (locked)

- **Determinism via computed progress, not CSS transitions.** `revealStyle(effect, progress)` returns inline `{opacity, transform, filter}`. At virtual frame time T every element is fully resolved, so a screenshot is exact. The Phase 2 `data-shown` + CSS-transition approach is replaced (it was non-deterministic for capture).
- **Render route reads committed data.** The campaign must already exist in `data/campaigns/` (Phase 3 export commits it). The route looks it up by slug — no copy passed over the wire.
- **Statics are the floor.** PNG rendering needs only the final frame and works without ffmpeg. Video (frame-step + ffmpeg) layers on top and is the CI path.
- **Manifest triggers CI.** A committed `renders/<campaign>.manifest.json` triggers `render.yml`; the artifact is the zip. Optional commit of finals to `renders/` is out of scope here (artifact only).

---

## File structure (Phase 4)

| File | Responsibility |
|---|---|
| `src/core/schemas.ts` (modify) | `RenderManifestSchema` |
| `src/templates/hifi/motion.ts` (create) | `revealStyle(effect, progress)`, `slotProgress(beats, slot, nowMs)`, `useClock(playing)` |
| `src/templates/hifi/motion.test.ts` (create) | Pure motion-math tests |
| `src/templates/hifi/types.ts` (modify) | Add optional `frameNowMs?: number` to `TemplateRenderProps` |
| `src/templates/hifi/useBeats.ts` (delete) | Replaced by `motion.ts` |
| `src/templates/hifi/effects.css` (modify) | Drop JS-reveal transitions; keep reduced-motion guard |
| `src/templates/hifi/hero-banner-cta/Template.tsx` (modify) | Use `revealStyle` |
| `src/templates/hifi/offer-card/Template.tsx` (modify) | Use `revealStyle` |
| `src/pages/RenderView.tsx` (create) | 1:1 chrome-less render of one deliverable from URL params |
| `src/main.tsx` (modify) | If path ends `/render`, mount `RenderView` instead of `App` |
| `harness/render.mjs` (create) | Playwright driver: statics → PNG, video → frames → ffmpeg → MP4, zip |
| `harness/manifest.example.json` (create) | A runnable fixture manifest |
| `.github/workflows/render.yml` (create) | CI: install browsers + ffmpeg, run harness, upload zip |
| `package.json` (modify) | `playwright` devDep; `render` script |
| `data/campaigns/demo-back-to-school-2026.json` (create) | Fixture campaign for the smoke render |

---

### Task 1: Render manifest schema (TDD)

- [ ] **Step 1: Failing test** (append to `src/core/schemas.test.ts`, import `RenderManifestSchema`)

```ts
describe('RenderManifestSchema', () => {
  it('accepts a manifest listing deliverables', () => {
    const m = RenderManifestSchema.parse({
      campaignSlug: 'demo-back-to-school-2026',
      requested: [
        { version: 'V1', size: 'Story', creativeType: 'Image' },
        { version: 'V2', size: 'Post', creativeType: 'Video' },
      ],
    })
    expect(m.requested).toHaveLength(2)
  })
  it('rejects an unknown size', () => {
    expect(() =>
      RenderManifestSchema.parse({ campaignSlug: 'x', requested: [{ version: 'V1', size: 'Square', creativeType: 'Image' }] }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (append to `schemas.ts`)

```ts
export const RenderManifestSchema = z.object({
  campaignSlug: slug,
  requested: z
    .array(
      z.object({
        version: z.enum(['V1', 'V2']),
        size: z.enum(['Story', 'Post']),
        creativeType: z.enum(['Image', 'Video']),
      }),
    )
    .min(1),
})
export type RenderManifest = z.infer<typeof RenderManifestSchema>
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `feat: render manifest schema`

---

### Task 2: Deterministic motion module (TDD)

The pure heart of frame-accurate video.

**Files:** create `src/templates/hifi/motion.ts`, `src/templates/hifi/motion.test.ts`.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { slotProgress, revealStyle } from './motion'
import type { Beat } from '../../core/schemas'

const beats: Beat[] = [
  { atMs: 0, slot: 'photo', effect: 'fade-in' },
  { atMs: 800, slot: 'headline', effect: 'rise-in' },
]

describe('slotProgress', () => {
  it('is 0 before the beat, 1 well after', () => {
    expect(slotProgress(beats, 'headline', 0)).toBe(0)
    expect(slotProgress(beats, 'headline', 5000)).toBe(1)
  })
  it('is between 0 and 1 mid-reveal', () => {
    const p = slotProgress(beats, 'headline', 800 + 300)
    expect(p).toBeGreaterThan(0)
    expect(p).toBeLessThan(1)
  })
  it('is 1 for a slot with no beat (always present)', () => {
    expect(slotProgress(beats, 'cta', 0)).toBe(1)
  })
  it('is 1 everywhere when nowMs is Infinity (final frame)', () => {
    expect(slotProgress(beats, 'headline', Infinity)).toBe(1)
  })
})

describe('revealStyle', () => {
  it('fully shown at progress 1 has no transform and full opacity', () => {
    const s = revealStyle('rise-in', 1)
    expect(s.opacity).toBe(1)
    expect(s.transform ?? 'none').toBe('none')
  })
  it('hidden at progress 0 is transparent', () => {
    expect(revealStyle('fade-in', 0).opacity).toBe(0)
  })
})
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** `src/templates/hifi/motion.ts`

```ts
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Beat, Slot } from '../../core/schemas'

export const REVEAL_MS = 620
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

/** Progress 0..1 of a slot's entrance at virtual time nowMs. Slots without a beat are always 1. */
export function slotProgress(beats: Beat[], slot: Slot, nowMs: number): number {
  const beat = beats.find((b) => b.slot === slot)
  if (!beat) return 1
  if (!isFinite(nowMs)) return 1
  const t = (nowMs - beat.atMs) / REVEAL_MS
  if (t <= 0) return 0
  if (t >= 1) return 1
  return easeOutQuint(t)
}

/** Inline style for an entrance effect at a given progress. Deterministic; no CSS transition. */
export function revealStyle(effect: Beat['effect'], progress: number): CSSProperties {
  const p = Math.max(0, Math.min(1, progress))
  const inv = 1 - p
  switch (effect) {
    case 'none':
      return { opacity: 1 }
    case 'fade-in':
      return { opacity: p, filter: inv > 0 ? `blur(${(inv * 6).toFixed(2)}px)` : 'none' }
    case 'rise-in':
      return { opacity: p, transform: inv > 0 ? `translateY(${(inv * 44).toFixed(2)}px)` : 'none' }
    case 'pop-in':
      return { opacity: p, transform: inv > 0 ? `scale(${(1 - inv * 0.14).toFixed(3)})` : 'none' }
    case 'slide-left':
      return { opacity: p, transform: inv > 0 ? `translateX(${(inv * 64).toFixed(2)}px)` : 'none' }
    case 'slide-right':
      return { opacity: p, transform: inv > 0 ? `translateX(${(-inv * 64).toFixed(2)}px)` : 'none' }
  }
}

/**
 * Virtual clock. When frameNowMs is provided (harness), it is returned verbatim — deterministic.
 * Otherwise: Infinity when not playing or reduced-motion (final frame); a rAF wall-clock when playing.
 */
export function useClock(playing: boolean, reducedMotion: boolean, frameNowMs?: number): number {
  const [now, setNow] = useState(frameNowMs ?? Infinity)
  const start = useRef<number | null>(null)
  useEffect(() => {
    if (frameNowMs !== undefined) {
      setNow(frameNowMs)
      return
    }
    if (!playing || reducedMotion) {
      setNow(Infinity)
      return
    }
    let raf = 0
    start.current = null
    const tick = (ts: number) => {
      if (start.current === null) start.current = ts
      setNow(ts - start.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, reducedMotion, frameNowMs])
  return now
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `feat: deterministic motion module`

---

### Task 3: Wire templates to the motion module

**Files:** modify `types.ts` (+`frameNowMs`), both `Template.tsx`, `effects.css`; delete `useBeats.ts`.

- [ ] **Step 1:** `types.ts` — add `frameNowMs?: number` to `TemplateRenderProps` (doc: "harness-injected virtual time; preview leaves it undefined").
- [ ] **Step 2:** Each template — replace `useBeats` with:

```tsx
import { useClock, slotProgress, revealStyle } from '../motion'
// inside component:
const now = useClock(playing, reducedMotion, frameNowMs)
const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
```

Apply `style={{ ...sty('headline','rise-in') }}` (merge with any existing inline style, e.g. photo backgroundImage) to each animated element, dropping the `data-effect`/`data-shown` attributes. Keep the slot/effect pairing identical to each template's beats.

- [ ] **Step 3:** `effects.css` — remove the `[data-effect]` reveal/transition rules (now handled inline). Keep only the `@media (prefers-reduced-motion: reduce)` safety net (it still applies, since reduced motion → progress 1 → no transform anyway).
- [ ] **Step 4:** Delete `useBeats.ts`; remove its import from the smoke test if referenced.
- [ ] **Step 5: Verify** `npm test` green; `npm run build` green; `npm run dev` → Templates tab Play still animates, reduced motion still jumps to final frame.
- [ ] **Step 6: Commit** — `refactor: templates use deterministic motion (injectable clock)`

---

### Task 4: Render route

**Files:** create `src/pages/RenderView.tsx`; modify `src/main.tsx`.

- [ ] **Step 1:** `RenderView` — read `URLSearchParams` (`campaign`, `version`, `size`, `frame?`, `fps?`, `reduced?`). Load the campaign (`loadCampaigns()`), kit, persona, tokens, manifest, archetype, Component. Compute `frameNowMs = frame !== null ? (Number(frame) / Number(fps ?? 30)) * 1000 : undefined`. Render the template inside a `TemplateFrame` at **1:1** (no `fitHeight`), absolutely positioned at 0,0, page background transparent. On `document.fonts.ready`, set `document.body.dataset.renderReady = '1'` (the harness waits on this). Render a clear error block if the campaign/template is missing.
- [ ] **Step 2:** `main.tsx` — if `window.location.pathname.replace(/\/$/, '').endsWith('/render')`, `createRoot(...).render(<RenderView />)` (no `StrictMode` double-invoke, no app chrome); else the existing `<App/>`.
- [ ] **Step 3:** Add CSS: `body:has(.render-root){margin:0;background:transparent}` and `.render-root{position:absolute;inset:0}`.
- [ ] **Step 4: Verify** `npm run dev`, open `/orthoboost-ad-generator/render?campaign=<fixture>&version=V1&size=Story` → the ad fills the viewport at 1080-wide scale; `?frame=0&fps=30` shows the first animation frame; high frame shows final. `npm run build` → PASS.
- [ ] **Step 5: Commit** — `feat: 1:1 render route for the harness`

---

### Task 5: Fixture campaign + manifest

**Files:** create `data/campaigns/demo-back-to-school-2026.json`, `harness/manifest.example.json`.

- [ ] **Step 1:** Author a valid `CampaignSchema` campaign (client `mock-ortho-co`, template `hero-banner-cta`, V1/V2 copy + library photos). Validate via `npx vitest run src/core/repo-data.test.ts` after extending that test to also parse `data/campaigns/*.json` against `CampaignSchema`.
- [ ] **Step 2:** `harness/manifest.example.json` — `{ campaignSlug, requested: [all 8] }`.
- [ ] **Step 3: Commit** — `feat: fixture campaign + example render manifest`

---

### Task 6: Playwright harness — statics → PNG, then video → MP4

**Files:** create `harness/render.mjs`; modify `package.json` (add `playwright` devDep + `"render": "node harness/render.mjs"`).

- [ ] **Step 1:** Implement `harness/render.mjs`:
  1. Read a manifest path (argv) → `RenderManifest`. Read the campaign for `clientName` (resolve the brand kit) to build deliverable names.
  2. `vite build` then serve `dist/` on a local port (use Vite `preview` or a tiny static server).
  3. Launch Playwright Chromium, `deviceScaleFactor: 1`, viewport = canvas size per deliverable.
  4. **Static (Image):** navigate to `/render?campaign&version&size`, wait for `body[data-render-ready="1"]` + `document.fonts.ready`, screenshot the `.render-root` clip at exact canvas px → `out/<deliverableName>.png`.
  5. **Video:** for `frame = 0..durationMs/1000*fps`, navigate (or set a query param + reload) to `?frame=N&fps=F`, wait ready, screenshot → temp frame PNG; pipe frames to `ffmpeg -framerate F -i frame-%04d.png -c:v libx264 -pix_fmt yuv420p -movflags +faststart out/<name>.mp4`. Even dimensions guaranteed (1080×1920 / 1080×1350 both even).
  6. Name every output with `deliverableName()` (import from the built `src/core/naming` or a small local copy).
  7. Per-deliverable try/catch → write `out/REPORT.txt` with successes/failures; never abort the whole run on one failure.
  8. Zip `out/` → `renders/<campaignSlug>.zip` (use `archiver` or shell `zip`).
- [ ] **Step 2: Verify (statics locally):** `npx playwright install chromium` then `npm run render harness/manifest.example.json` → produces the 4 PNGs in `out/`. Eyeball one. (Video needs ffmpeg; verify in CI if not on PATH locally.)
- [ ] **Step 3: Commit** — `feat: Playwright render harness (PNG + MP4)`

---

### Task 7: CI render workflow

**Files:** create `.github/workflows/render.yml`.

- [ ] **Step 1:** Workflow triggered on `push` to `renders/*.manifest.json` + `workflow_dispatch` (input: manifest path). Steps: checkout → setup-node 22 → `npm ci` → `npx playwright install --with-deps chromium` → `sudo apt-get install -y ffmpeg` → `node harness/render.mjs <manifest>` → `actions/upload-artifact@v4` with `out/` (the 8 finals + REPORT).
- [ ] **Step 2:** Add `harness/manifest.example.json` copy step or accept the dispatch input defaulting to it.
- [ ] **Step 3: Commit** — `chore: CI render workflow`

---

### Task 8: Pipeline smoke + docs

- [ ] **Step 1:** Add a CI smoke (in `render.yml` or a tiny job) that renders **one static + one short video** from the fixture on every push to catch harness regressions (short: cap video frames to ~1s for the smoke).
- [ ] **Step 2:** README: a short "Rendering finals" section (commit a manifest or dispatch `render.yml`; download the artifact zip).
- [ ] **Step 3: Commit** — `docs: rendering finals + pipeline smoke`

---

### Phase 4 done-when
- `npm test` green; `npm run build` green; existing deploy still green.
- `npm run render harness/manifest.example.json` produces named PNGs locally; the CI `render.yml` produces the full zip (PNGs + MP4s) as an artifact.
- Frames are deterministic (same input → identical output); reduced-motion/static = final frame.

## Out of scope
- Committing finals back into `renders/` (artifact-only here).
- In-app trigger button wiring beyond Phase 3's export (a "Render" action can post the manifest via the GitHub API later).
- Phase 5 site template + zip export.

## Self-review
- Spec coverage vs design doc "Finals (GitHub Actions)": manifest → Task 1/5; build+serve+Playwright → Task 6; statics screenshot → Task 6.4; CDP/virtual-time video stepping → Tasks 2+6.5 (computed-progress + frame param is the deterministic equivalent of CDP virtual time, and is testable as pure math); naming → Task 6.6; zip artifact → Task 6.8/7; per-deliverable failure report → Task 6.7; pipeline smoke → Task 8. The Phase-2 note "refactor beats hook to injectable clock" is discharged by Tasks 2–3.
- Type consistency: `RenderManifest`, `slotProgress`/`revealStyle`/`useClock`, `frameNowMs`, `deliverableName` used consistently. `useClock` honors `frameNowMs` over `playing` — matches RenderView (Task 4) and preview callers (unchanged props).
- Placeholders: Tasks 1–4 carry full code; Tasks 5–8 are concrete steps with exact commands/contracts (harness is Node/Playwright glue, specified step-by-step). No TBDs.
