# OrthoBoost Phase 3 — Campaign Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.
> UI steps that render ads REQUIRE the existing Phase 2 `TemplateFrame` + `HIFI_TEMPLATES`; do not re-implement rendering.

**Goal:** A gated, six-step campaign builder that turns a client + copy into a validated `data/campaigns/<id>.json`, previews all 8 variants, and saves the campaign (JSON download always; commit to the repo via GitHub API when a token is present).

**Architecture:** Same static React + Vite + TS SPA. A new `core/` layer adds the campaign schema, pure gate predicates, and a copy-fit estimator (all TDD). A new `src/pages/Campaign/` stepper holds an in-memory draft campaign and unlocks steps as gates pass. Persistence is client-side: a pure payload builder (tested) + a thin GitHub Contents-API call, with a no-token JSON-download fallback.

**Tech Stack:** Existing (Vite 8, React 19, zod 4, vitest 4). No new deps.

---

## Decisions (locked for this plan)

- **Photos:** Phase 3 uses the **pre-committed shared photo library** under `public/assets/photos/**` only. No in-app photo upload (that's a later increment). The content step picks from the library; the logo always comes from the brand kit.
- **Persistence:** **JSON download always works** (no token, no network). **Commit-to-repo** is the optional path via the GitHub Contents API using a fine-grained PAT pasted once and stored in `localStorage` only. The render manifest itself is Phase 4 — Phase 3 stops at saving the campaign.
- **Copy-fit:** a heuristic estimator drives live warnings and the content gate. The Phase 4 render is the real source of truth; the heuristic only needs to catch obviously-too-long copy.

---

## Conventions (unchanged)

- Run from repo root. Test: `npx vitest run <file>`; full: `npm test`. Build: `npm run build`.
- Commit after every green task (`feat:`/`test:`/`chore:`). Add schema fields before data (TDD).
- Personas are fictional; brand kits are clients ([[persona-vs-client-naming]]). No eyebrow in any rendered ad.

---

## File structure (Phase 3)

| File | Responsibility |
|---|---|
| `src/core/schemas.ts` (modify) | Add `CampaignVersionSchema`, `CampaignSchema` |
| `src/core/data.ts` (modify) | `loadCampaigns()`, `loadPhotoLibrary()` |
| `src/core/gates.ts` (create) | Pure step-gate predicates → `{ ok, missing }` |
| `src/core/gates.test.ts` (create) | Gate unit tests |
| `src/core/fit.ts` (create) | `estimateFit()` copy-fit heuristic |
| `src/core/fit.test.ts` (create) | Fit unit tests |
| `src/core/persist.ts` (create) | `buildContentsPayload()` (pure) + `commitCampaign()` (thin fetch) + `downloadJson()` |
| `src/core/persist.test.ts` (create) | Payload-builder unit tests |
| `src/pages/Campaign/CampaignBuilder.tsx` (create) | Stepper shell: draft state, step gating, nav |
| `src/pages/Campaign/steps.ts` (create) | Step definitions (id, title, gate) |
| `src/pages/Campaign/ClientStep.tsx` | Pick brand kit |
| `src/pages/Campaign/SetupStep.tsx` | Ad set type, theme, year |
| `src/pages/Campaign/TemplateStep.tsx` | Pick hi-fi template (filtered by persona) |
| `src/pages/Campaign/ContentStep.tsx` | V1/V2 copy forms + photo picker + fit warnings |
| `src/pages/Campaign/PreviewStep.tsx` | QA grid: all 8 variants |
| `src/pages/Campaign/ExportStep.tsx` | Deliverable names, JSON download, optional GitHub commit |
| `src/pages/Inspector.tsx` (modify) | Add a "Campaign" tab |
| `src/index.css` (modify) | Stepper + form + QA-grid styles |
| `src/smoke.test.tsx` (modify) | Smoke-render the builder |

---

### Task 1: Campaign schema (TDD)

**Files:** modify `src/core/schemas.ts`; extend `src/core/schemas.test.ts`.

- [ ] **Step 1: Failing test** (append to `src/core/schemas.test.ts`; add `CampaignSchema` to the import)

```ts
describe('CampaignSchema', () => {
  const base = {
    slug: 'smith-back-to-school-2026',
    clientSlug: 'mock-ortho-co',
    adSetType: 'Seasonal',
    theme: 'Back To School',
    year: 2026,
    hifiTemplateSlug: 'hero-banner-cta',
    versions: {
      V1: { content: { headline: 'A', cta: 'Book', photo: 'assets/photos/back-to-school/classroom-warm.svg' } },
      V2: { content: { headline: 'B', cta: 'Book', photo: 'assets/photos/back-to-school/smile-portrait.svg' } },
    },
  }
  it('accepts a complete campaign', () => {
    expect(CampaignSchema.parse(base).versions.V1.content.headline).toBe('A')
  })
  it('requires both versions', () => {
    const bad = structuredClone(base) as Record<string, unknown>
    delete (bad.versions as Record<string, unknown>).V2
    expect(() => CampaignSchema.parse(bad)).toThrow()
  })
  it('rejects a bad ad set type', () => {
    expect(() => CampaignSchema.parse({ ...base, adSetType: 'Holiday' })).toThrow()
  })
})
```

- [ ] **Step 2: Run** → FAIL. `npx vitest run src/core/schemas.test.ts`

- [ ] **Step 3: Implement** (append to `src/core/schemas.ts`)

```ts
export const CampaignVersionSchema = z.object({
  content: SlotContentSchema,
  notes: z.string().optional(),
})
export type CampaignVersion = z.infer<typeof CampaignVersionSchema>

export const CampaignSchema = z.object({
  slug,
  clientSlug: slug,
  adSetType: z.enum(['Seasonal', 'Evergreen']),
  theme: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  hifiTemplateSlug: slug,
  versions: z.object({ V1: CampaignVersionSchema, V2: CampaignVersionSchema }),
})
export type Campaign = z.infer<typeof CampaignSchema>
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `feat: campaign schema`

---

### Task 2: Copy-fit estimator (TDD)

A pure heuristic: will `text` fit a box `widthPx` wide at `fontSizePx`, within `maxLines`?

**Files:** create `src/core/fit.ts`, `src/core/fit.test.ts`.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { estimateFit } from './fit'

describe('estimateFit', () => {
  it('short text fits one line', () => {
    const r = estimateFit({ text: 'New braces', widthPx: 900, fontSizePx: 100, maxLines: 3 })
    expect(r.fits).toBe(true)
    expect(r.lines).toBe(1)
  })
  it('long text overflows the line cap', () => {
    const r = estimateFit({
      text: 'Back to school, back to confident smiles for the whole family this year',
      widthPx: 700,
      fontSizePx: 120,
      maxLines: 2,
    })
    expect(r.lines).toBeGreaterThan(2)
    expect(r.fits).toBe(false)
  })
  it('empty text fits with zero lines', () => {
    expect(estimateFit({ text: '', widthPx: 500, fontSizePx: 80, maxLines: 3 })).toEqual({
      fits: true,
      lines: 0,
      charsPerLine: expect.any(Number),
    })
  })
})
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** `src/core/fit.ts`

```ts
export interface FitInput {
  text: string
  widthPx: number
  fontSizePx: number
  maxLines?: number
  /** mean glyph advance as a fraction of font size; ~0.52 for typical sans display */
  charWidthRatio?: number
}
export interface FitResult {
  fits: boolean
  lines: number
  charsPerLine: number
}

/** Greedy word-wrap line count; no DOM, deterministic. */
export function estimateFit({
  text,
  widthPx,
  fontSizePx,
  maxLines,
  charWidthRatio = 0.52,
}: FitInput): FitResult {
  const charsPerLine = Math.max(1, Math.floor(widthPx / (fontSizePx * charWidthRatio)))
  const words = text.trim().split(/\s+/).filter(Boolean)
  let lines = words.length === 0 ? 0 : 1
  let len = 0
  for (const w of words) {
    const add = (len === 0 ? 0 : 1) + w.length
    if (len + add > charsPerLine) {
      lines += 1
      len = w.length
    } else {
      len += add
    }
  }
  const fits = maxLines === undefined ? true : lines <= maxLines
  return { fits, lines, charsPerLine }
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `feat: copy-fit estimator`

---

### Task 3: Step gates (TDD)

Pure predicates the stepper uses to unlock steps and show what's missing. They take plain draft data, never React state.

**Files:** create `src/core/gates.ts`, `src/core/gates.test.ts`.

Types the gates operate on (a partial draft):

```ts
// in gates.ts
import type { BrandKit, HifiTemplateManifest, LofiTemplate, SlotContent } from './schemas'

export interface GateResult { ok: boolean; missing: string[] }

export interface CampaignDraft {
  clientSlug?: string
  adSetType?: 'Seasonal' | 'Evergreen'
  theme?: string
  year?: number
  hifiTemplateSlug?: string
  versions: { V1: { content: SlotContent }; V2: { content: SlotContent } }
}
```

- [ ] **Step 1: Failing test** (`src/core/gates.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { clientGate, setupGate, templateGate, contentGate } from './gates'
import type { BrandKit, HifiTemplateManifest, LofiTemplate } from './schemas'

const kit = {
  slug: 'mock-ortho-co', clientName: 'Mock Ortho Co', personaSlug: 'dr-b-nye',
  colors: { brand: '#1f6feb' }, logo: { assetPath: 'assets/clients/mock-ortho-co/logo.svg' },
} as BrandKit

const manifest = {
  slug: 'hero-banner-cta', name: 'Hero', archetype: 'hero-banner-cta',
  suitedPersonas: ['dr-b-nye'], slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
} as HifiTemplateManifest

// minimal archetype with zones carrying width + maxLines
const archetype = {
  slug: 'hero-banner-cta', name: 'Hero', description: 'x', slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
  zones: {
    Story: [
      { slot: 'headline', x: 90, y: 460, w: 900, h: 300, layer: 1, maxLines: 3 },
      { slot: 'subhead', x: 140, y: 790, w: 800, h: 120, layer: 1, maxLines: 2 },
      { slot: 'cta', x: 290, y: 1380, w: 500, h: 110, layer: 2 },
    ],
    Post: [
      { slot: 'headline', x: 90, y: 240, w: 900, h: 260, layer: 1, maxLines: 3 },
      { slot: 'subhead', x: 140, y: 530, w: 800, h: 110, layer: 1, maxLines: 2 },
      { slot: 'cta', x: 290, y: 1090, w: 500, h: 110, layer: 2 },
    ],
  },
  placement: { Story: { safeTop: 250, safeBottom: 340, margin: 64 }, Post: { safeTop: 0, safeBottom: 0, margin: 64 } },
  videoGrammar: { durationMs: 10000, fps: 30, loop: true, reducedMotion: 'static', beats: [] },
} as unknown as LofiTemplate

it('clientGate fails with no kit, passes with a valid one', () => {
  expect(clientGate(undefined).ok).toBe(false)
  expect(clientGate(kit).ok).toBe(true)
})

it('setupGate needs all three fields', () => {
  expect(setupGate({}).ok).toBe(false)
  expect(setupGate({ adSetType: 'Seasonal', theme: 'Back To School', year: 2026 }).ok).toBe(true)
})

it('templateGate needs a selected, persona-suited template', () => {
  expect(templateGate(undefined, kit).ok).toBe(false)
  expect(templateGate(manifest, kit).ok).toBe(true)
  expect(templateGate({ ...manifest, suitedPersonas: ['other'] }, kit).missing[0]).toMatch(/persona/i)
})

it('contentGate requires every copy slot + photo for both versions', () => {
  const empty = { V1: { content: {} }, V2: { content: {} } }
  expect(contentGate(manifest, archetype, empty).ok).toBe(false)
  const full = {
    V1: { content: { headline: 'Hi', subhead: 'There', cta: 'Book', photo: 'p.svg' } },
    V2: { content: { headline: 'Hi', subhead: 'There', cta: 'Book', photo: 'q.svg' } },
  }
  expect(contentGate(manifest, archetype, full).ok).toBe(true)
})

it('contentGate flags copy that does not fit its zone', () => {
  const long = 'word '.repeat(60).trim()
  const full = {
    V1: { content: { headline: long, subhead: 'There', cta: 'Book', photo: 'p.svg' } },
    V2: { content: { headline: 'Hi', subhead: 'There', cta: 'Book', photo: 'q.svg' } },
  }
  const r = contentGate(manifest, archetype, full)
  expect(r.ok).toBe(false)
  expect(r.missing.join(' ')).toMatch(/headline/i)
})
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** `src/core/gates.ts`

```ts
import type { BrandKit, HifiTemplateManifest, LofiTemplate, SizeKey, SlotContent } from './schemas'
import { estimateFit } from './fit'

export interface GateResult { ok: boolean; missing: string[] }
const result = (missing: string[]): GateResult => ({ ok: missing.length === 0, missing })

export function clientGate(kit?: BrandKit): GateResult {
  const missing: string[] = []
  if (!kit) return result(['Select a client'])
  if (!kit.personaSlug) missing.push('Client has no persona assigned')
  if (!kit.logo?.assetPath) missing.push('Client brand kit has no logo')
  if (!kit.colors?.brand) missing.push('Client brand kit has no brand color')
  return result(missing)
}

export function setupGate(s: { adSetType?: string; theme?: string; year?: number }): GateResult {
  const missing: string[] = []
  if (!s.adSetType) missing.push('Choose an ad set type')
  if (!s.theme?.trim()) missing.push('Enter a theme')
  if (!s.year) missing.push('Enter a year')
  return result(missing)
}

export function templateGate(manifest: HifiTemplateManifest | undefined, kit?: BrandKit): GateResult {
  if (!manifest) return result(['Choose a template'])
  if (kit && !manifest.suitedPersonas.includes(kit.personaSlug)) {
    return result([`Template is not suited to the ${kit.personaSlug} persona`])
  }
  return result([])
}

const COPY_SLOTS = ['headline', 'subhead', 'offer', 'cta', 'badge'] as const

// Representative preview font size per slot for the fit heuristic (px on the 1080 canvas).
const SLOT_FONT_PX: Record<string, number> = { headline: 112, subhead: 44, offer: 130, cta: 44, badge: 40 }

export function contentGate(
  manifest: HifiTemplateManifest,
  archetype: LofiTemplate,
  versions: { V1: { content: SlotContent }; V2: { content: SlotContent } },
): GateResult {
  const missing: string[] = []
  const copySlots = manifest.slots.filter((s): s is (typeof COPY_SLOTS)[number] =>
    (COPY_SLOTS as readonly string[]).includes(s),
  )
  const needsPhoto = manifest.slots.includes('photo')

  for (const v of ['V1', 'V2'] as const) {
    const content = versions[v].content
    if (needsPhoto && !content.photo) missing.push(`${v}: pick a photo`)
    for (const slot of copySlots) {
      const text = (content[slot] ?? '').trim()
      if (!text) {
        missing.push(`${v}: ${slot} is empty`)
        continue
      }
      // fit against the tightest of the two sizes
      for (const size of ['Story', 'Post'] as SizeKey[]) {
        const zone = archetype.zones[size].find((z) => z.slot === slot)
        if (!zone) continue
        const r = estimateFit({
          text,
          widthPx: zone.w,
          fontSizePx: SLOT_FONT_PX[slot] ?? 48,
          maxLines: zone.maxLines,
        })
        if (!r.fits) missing.push(`${v}: ${slot} is too long for ${size} (${r.lines} lines)`)
      }
    }
  }
  return result(missing)
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `feat: campaign step gates`

---

### Task 4: Persistence payload builder + download + commit (TDD for the pure part)

**Files:** create `src/core/persist.ts`, `src/core/persist.test.ts`.

- [ ] **Step 1: Failing test** (pure payload builder only)

```ts
import { describe, it, expect } from 'vitest'
import { buildContentsPayload } from './persist'
import type { Campaign } from './schemas'

const campaign = { slug: 'demo', clientSlug: 'mock-ortho-co', adSetType: 'Seasonal', theme: 'X', year: 2026, hifiTemplateSlug: 'hero-banner-cta', versions: { V1: { content: {} }, V2: { content: {} } } } as Campaign

describe('buildContentsPayload', () => {
  it('targets data/campaigns/<slug>.json with base64 content and a message', () => {
    const p = buildContentsPayload(campaign)
    expect(p.path).toBe('data/campaigns/demo.json')
    expect(p.message).toMatch(/demo/)
    const decoded = JSON.parse(atob(p.contentBase64))
    expect(decoded.slug).toBe('demo')
  })
})
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** `src/core/persist.ts`

```ts
import type { Campaign } from './schemas'

export interface ContentsPayload {
  path: string
  message: string
  contentBase64: string
}

const toBase64 = (s: string) =>
  typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64')

export function buildContentsPayload(campaign: Campaign): ContentsPayload {
  const json = JSON.stringify(campaign, null, 2)
  return {
    path: `data/campaigns/${campaign.slug}.json`,
    message: `feat: campaign ${campaign.slug}`,
    contentBase64: toBase64(json),
  }
}

/** Browser download — always available, no token. */
export function downloadJson(campaign: Campaign): void {
  const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${campaign.slug}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface GitHubTarget { owner: string; repo: string; token: string }

/** Commit the campaign to the repo via the Contents API. Creates or updates. */
export async function commitCampaign(t: GitHubTarget, campaign: Campaign): Promise<{ ok: boolean; url?: string; error?: string }> {
  const p = buildContentsPayload(campaign)
  const api = `https://api.github.com/repos/${t.owner}/${t.repo}/contents/${p.path}`
  const headers = { Authorization: `Bearer ${t.token}`, Accept: 'application/vnd.github+json' }
  try {
    // look up existing sha (update vs create)
    let sha: string | undefined
    const head = await fetch(api, { headers })
    if (head.ok) sha = (await head.json()).sha
    const res = await fetch(api, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: p.message, content: p.contentBase64, sha }),
    })
    if (!res.ok) return { ok: false, error: `${res.status} ${res.statusText}` }
    const body = await res.json()
    return { ok: true, url: body.content?.html_url }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
```

- [ ] **Step 4: Run** `npx vitest run src/core/persist.test.ts` → PASS. **Step 5: Commit** — `feat: campaign persistence (download + GitHub commit)`

---

### Task 5: Data loaders — campaigns + photo library

**Files:** modify `src/core/data.ts`.

- [ ] **Step 1: Implement**

```ts
import { PersonaSchema, LofiTemplateSchema, BrandKitSchema, CampaignSchema } from './schemas'

export function loadCampaigns() {
  return validateAll(
    CampaignSchema,
    import.meta.glob('/data/campaigns/*.json', { eager: true, import: 'default' }),
  )
}

/** Served URLs for every photo in the committed library. */
export function loadPhotoLibrary(): string[] {
  const files = import.meta.glob('/public/assets/photos/**/*.{svg,jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
  return Object.values(files as Record<string, string>).sort()
}
```

- [ ] **Step 2: Verify** `npm run build` → PASS (glob resolves even with zero campaign files). **Step 3: Commit** — `feat: campaign + photo-library loaders`

---

### Task 6: Stepper shell + step definitions

**Files:** create `src/pages/Campaign/steps.ts`, `src/pages/Campaign/CampaignBuilder.tsx`.

`steps.ts` declares the ordered steps and a `gateFor(draft, deps)` that returns the `GateResult` per step id, composing the Task-3 gates. The builder holds the draft in `useState`, renders the current step component, computes each step's gate, disables **Next** until the current gate passes, and shows `missing[]` inline. A left rail lists steps with lock/check state.

- [ ] **Step 1:** `steps.ts` — export `STEP_IDS = ['client','setup','template','content','preview','export'] as const`, titles, and `gateFor(id, draft, { kit, manifest, archetype })`. `preview`/`export` gate on `contentGate` passing (you can't preview/export incomplete copy).
- [ ] **Step 2:** `CampaignBuilder.tsx` — draft state (seed `versions: { V1: { content: {} }, V2: { content: {} } }`), current-step index, resolve `kit`/`manifest`/`archetype` from draft via `loadBrandKits`/`HIFI_TEMPLATES`/`loadLofiTemplates`, render step body + footer nav (Back / Next), block Next when `!gate.ok`, render `missing` as a hint list. Pass `draft` + `setDraft` to step components.
- [ ] **Step 3: Verify** `npm run build` → PASS. **Step 4: Commit** — `feat: campaign builder stepper shell`

---

### Task 7: Steps 1–3 UI (Client, Setup, Template)

**Files:** create `ClientStep.tsx`, `SetupStep.tsx`, `TemplateStep.tsx`.

- [ ] **ClientStep** — list `loadBrandKits()` as selectable cards (client name + persona); set `draft.clientSlug`. Show `clientGate` missing.
- [ ] **SetupStep** — `adSetType` segmented control (Seasonal/Evergreen), `theme` text input, `year` number input (default current campaign year). Bind to draft.
- [ ] **TemplateStep** — list `HIFI_TEMPLATES` **filtered** to those whose `manifest.suitedPersonas` includes the selected kit's `personaSlug`; each option shows a tiny `TemplateFrame` thumbnail (fitHeight ~160) with the kit tokens + placeholder copy. Set `draft.hifiTemplateSlug`. If none suit, show a clear empty state.
- [ ] **Verify** `npm run build` → PASS. **Commit** — `feat: campaign steps 1-3 (client, setup, template)`

---

### Task 8: Step 4 UI — Content (copy forms + photo picker + live fit)

**Files:** create `ContentStep.tsx`.

- [ ] **Step 1:** V1/V2 sub-tabs. For each copy slot in the template manifest (excluding `photo`/`logo`), render a labeled input (textarea for `headline`/`subhead`, input for `cta`/`offer`/`badge`) bound to `draft.versions[v].content[slot]`. Live, per-field fit hint using `estimateFit` against the archetype zone for the tighter size; show "fits / N lines / too long" with color. Photo picker: a thumbnail grid from `loadPhotoLibrary()` setting `content.photo`. Logo is shown read-only from the kit ("comes from brand kit").
- [ ] **Step 2: Verify** `npm run build` → PASS. **Commit** — `feat: campaign content step with live fit warnings`

---

### Task 9: Step 5 UI — Preview QA grid (8 variants)

**Files:** create `PreviewStep.tsx`.

- [ ] **Step 1:** Resolve tokens from kit+persona. For each (version V1/V2) × (size Story/Post), render a `TemplateFrame` (fitHeight ~360) with the chosen `Component`, the version's content (photo resolved to a served URL, logo from kit), and the archetype's beats/duration. A global **Play** toggle and **Reduced motion** toggle drive all eight at once (static is the default frame). Label each tile with `deliverableName()` (Image + the size). This is the all-8 QA surface from the design doc (4 static shown; the Image/Video pairing is the same layout, so 4 tiles cover both creative types in preview).
- [ ] **Step 2: Verify** `npm run dev` — grid renders 4 tiles, both versions on-brand, play animates all. `npm run build` → PASS. **Commit** — `feat: campaign preview QA grid`

---

### Task 10: Step 6 UI — Export (names, download, optional commit)

**Files:** create `ExportStep.tsx`.

- [ ] **Step 1:** Build the `Campaign` object from the draft and `CampaignSchema.parse` it (surface validation errors). List the 8 `deliverableName()` strings (V1/V2 × Story/Post × Image/Video). **Download campaign JSON** button (always enabled) → `downloadJson`. A collapsible **"Save to repo"** panel: inputs for owner/repo (default `jules-orthoboost` / `orthoboost-ad-generator`) + a PAT field (stored in `localStorage` key `ob_gh_token`, never logged); **Commit** button calls `commitCampaign`, shows success link or error. Make clear the token stays in the browser.
- [ ] **Step 2: Verify** `npm run build` → PASS. **Commit** — `feat: campaign export step (download + GitHub commit)`

---

### Task 11: Wire the Campaign tab + smoke test

**Files:** modify `src/pages/Inspector.tsx`, `src/index.css`, `src/smoke.test.tsx`.

- [ ] **Step 1:** Add `'campaign'` to the `Tab` union, a nav button ("Campaign"), and render `<CampaignBuilder />` for that tab. Add stepper/form/QA-grid styles to `index.css`.
- [ ] **Step 2:** Extend `smoke.test.tsx` — `renderToString(<CampaignBuilder />)` renders without throwing and shows the first step.
- [ ] **Step 3: Verify** `npm test` → green; `npm run build` → green; `npm run dev` → click through all six steps end-to-end with the mock kit, download a campaign JSON. **Commit** — `feat: campaign builder tab + smoke test`

---

### Phase 3 done-when
- `npm test` green; `npm run build` green; deploy still green.
- A non-designer picks the mock client, fills V1+V2 copy (with live fit guidance), previews all variants on-brand, and downloads a valid `campaign.json` (or commits it to the repo with a token).
- Gates block forward progress until each step is genuinely complete.

## Out of scope (later)
- In-app photo/logo upload via the API (Phase 3 uses the committed library).
- The render **manifest** + Playwright/ffmpeg harness producing real PNG/MP4 finals — **Phase 4**.
- Site template export — **Phase 5**.

## Self-review
- Spec coverage vs design doc "Workflow (gated steps)": Client/Setup/Template/Content/Preview/Render-export → Tasks 7–10; gate logic → Task 3; copy-fit → Task 2; GitHub persistence → Task 4/10; campaign schema → Task 1. Render finals correctly deferred to Phase 4 (doc agrees: app commits a manifest, Action renders).
- Type consistency: `CampaignDraft`, `GateResult`, `estimateFit`/`FitResult`, `buildContentsPayload`/`ContentsPayload`, `commitCampaign` used identically across tasks. `contentGate(manifest, archetype, versions)` signature matches its caller in `steps.ts`.
- Placeholders: pure-logic tasks (1–5) carry full code; UI tasks (6–11) specify contracts + key wiring, consistent with how Phase 2 handled visual components. No TBDs.
