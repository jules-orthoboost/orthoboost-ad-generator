# Remove V1/V2 Versions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dual V1/V2 *content* model (toggle, two copy variants, ×2 export fan-out) while keeping `version` solely as a token in the export filename convention.

**Architecture:** `version` splits into two independent axes. The **content axis** (FlowDraft `shared`/`perClient`, `CampaignSchema.versions`, `CopyLibraryEntry.personas[slug].{V1,V2}`, the copy-step toggle, RenderView content selection, export ×2) collapses to a single copy set. The **naming axis** (`naming.ts`, `RenderManifestSchema`, the harness `d.version`, the batch-config `deliverable.version`, an ExportStep label) is untouched. Done as two tasks split at a real seam — Task 1 = the in-browser builder/FlowDraft; Task 2 = the committed Campaign/copy data + render path — each ending on a green `tsc` + full `npm test`.

**Tech Stack:** React 19, Vite, TypeScript, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-23-remove-v1-v2-versions-design.md`

## Global Constraints

- **Branch first.** `main` auto-deploys to GitHub Pages on push. Do all work on a feature branch; do not push to `main` until the user approves the merge.
- **Full `npm test` gates the deploy.** Run the *entire* suite (not a subset) before merge — `smoke.test.tsx` and `repo-data.test.ts` hard-code counts (11 personas, ≥5 lofi).
- **CRLF gotcha:** commit with `git -c core.autocrlf=false ...`.
- **Keep the naming axis intact:** `src/core/naming.ts`, `RenderManifestSchema`, `harness/*` and the `harness/manifest.*.json` fixtures are NOT modified.
- **V2 copy is intentionally discarded** in the data migration; keep each file's former V1 content as the single surviving version.
- `PersonaCopyVersion` = `{ headline?, subhead?, cta?, disclaimer? }` (defined in `src/core/data.ts`). `PerClientVersion` = the per-client offer/photo/override interface in `src/core/gates.ts` (its fields are unchanged; only its position in `FlowDraft` flattens).

---

### Task 1: Collapse the FlowDraft builder + export label

Flattens the in-browser authoring model from `{V1,V2}` to a single copy set, removes the copy-step toggle, and converts the export's ×2 fan-out into a single naming-only "Version label". Leaves the committed-data/render path (Task 2) on its original dual shape — they don't share a type, so the build stays green.

**Files:**
- Modify: `src/core/gates.ts`
- Test: `src/core/gates.test.ts`
- Modify: `src/pages/Campaign/CopyStep.tsx`
- Modify: `src/pages/Campaign/DeliverablePreview.tsx`
- Modify: `src/pages/Campaign/AnimationStep.tsx`
- Modify: `src/pages/Campaign/ExportStep.tsx`
- Modify: `src/pages/Campaign/CampaignBuilder.tsx`
- Modify: `src/pages/Campaign/CampaignStep.tsx`
- Modify: `src/pages/Campaign/ui.tsx`

**Interfaces:**
- Consumes (unchanged): `PersonaCopyVersion` from `src/core/data.ts`; `Version` (`'V1'|'V2'`), `deliverableName`, `CreativeType`, `Size` from `src/core/naming.ts`.
- Produces (Task 2 and the rest of the app rely on these exact signatures):
  - `interface FlowDraft { personaSlug?: string; brandSlugs: string[]; campaignSlug?: string; templateSlugs: string[]; shared: PersonaCopyVersion; perClient: Record<string, PerClientVersion>; animationStyle?: string }`
  - `resolveDraftContent(draft: FlowDraft, brandSlug: string): SlotContent`
  - `copyGate(d: FlowDraft): GateResult`
  - `emptyPerClient(): PerClientVersion`
  - The local `Version` type is **removed** from `gates.ts` (the only remaining `Version` is in `naming.ts`).

- [ ] **Step 1: Create the feature branch**

```bash
cd C:/Users/jules/Desktop/OrthoBoost/orthoboost-ad-generator
git checkout -b feat/remove-v1-v2-versions
```

- [ ] **Step 2: Update `src/core/gates.ts`**

Delete the `Version` type (line ~24). Replace the `FlowDraft` interface, `emptyPerClient`, `resolveDraftContent`, and `copyGate` with the single-version forms. Leave `PerClientVersion`, `COPY_SLOTS`, `SLOT_FONT_PX`, `fitProblem`, and the selection gates unchanged.

```ts
// DELETE this line entirely:
// export type Version = 'V1' | 'V2'

export interface FlowDraft {
  personaSlug?: string
  brandSlugs: string[]
  campaignSlug?: string
  templateSlugs: string[]
  shared: PersonaCopyVersion
  perClient: Record<string, PerClientVersion>
  animationStyle?: string
}

export const emptyPerClient = (): PerClientVersion => ({})

/** Final SlotContent for a brand: shared copy, overridden when the client is
 * "make different", plus that client's own offer + photo. */
export function resolveDraftContent(draft: FlowDraft, brandSlug: string): SlotContent {
  const shared = draft.shared
  const pc = draft.perClient[brandSlug] ?? {}
  const ov = pc.makeDifferent ? pc.override ?? {} : {}
  return {
    headline: ov.headline ?? shared.headline,
    subhead: ov.subhead ?? shared.subhead,
    cta: ov.cta ?? shared.cta,
    disclaimer: ov.disclaimer ?? shared.disclaimer,
    offer: pc.offer,
    offerLabel: pc.offerLabel,
    offerUnit: pc.offerUnit,
    offerFine: pc.offerFine,
    rating: pc.rating,
    socialProof: pc.socialProof,
    photo: pc.photo,
  }
}
```

And replace `copyGate`:

```ts
export function copyGate(d: FlowDraft): GateResult {
  const missing: string[] = []
  if (!d.shared.headline?.trim()) missing.push('Shared headline is empty')
  for (const b of d.brandSlugs) {
    if (!d.perClient[b]?.offer?.trim()) missing.push(`${b}: offer is empty`)
  }
  return result(missing)
}
```

- [ ] **Step 3: Update `src/core/gates.test.ts` to the single-version shape**

Replace the `base` fixture and the three affected tests. `fitProblem` and the selection-gate test stay.

```ts
const base: FlowDraft = {
  personaSlug: 'dr-m-rogers',
  brandSlugs: ['aloha-orthodontics'],
  campaignSlug: 'back-to-school-2026',
  templateSlugs: ['rogers-photocard'],
  shared: { headline: 'Hi', subhead: 'There', cta: 'Book' },
  perClient: {
    'aloha-orthodontics': { offer: 'Free consult' },
  },
}

it('copyGate needs a shared headline and a per-client offer', () => {
  expect(copyGate(base).ok).toBe(true)
  const noOffer = { ...base, perClient: { 'aloha-orthodontics': {} } }
  expect(copyGate(noOffer).ok).toBe(false)
  const noHead = { ...base, shared: { cta: 'Book' } }
  expect(copyGate(noHead).missing.join(' ')).toMatch(/headline/i)
})

it('resolveDraftContent merges shared copy with per-client offer/photo', () => {
  const c = resolveDraftContent(base, 'aloha-orthodontics')
  expect(c.headline).toBe('Hi')
  expect(c.offer).toBe('Free consult')
})

it('"make different" overrides shared copy for one client', () => {
  const draft: FlowDraft = {
    ...base,
    perClient: {
      'aloha-orthodontics': { offer: 'X', makeDifferent: true, override: { headline: 'Custom' } },
    },
  }
  expect(resolveDraftContent(draft, 'aloha-orthodontics').headline).toBe('Custom')
  // override ignored when the toggle is off
  const off = { ...draft.perClient['aloha-orthodontics'], makeDifferent: false }
  const draft2 = { ...draft, perClient: { 'aloha-orthodontics': off } }
  expect(resolveDraftContent(draft2, 'aloha-orthodontics').headline).toBe('Hi')
})
```

- [ ] **Step 4: Run the gates test — expect PASS**

Run: `npm test -- src/core/gates.test.ts`
Expected: PASS (all gate, copyGate, resolveDraftContent, fitProblem tests green).

- [ ] **Step 5: Update `src/pages/Campaign/CopyStep.tsx`**

Remove the `version` state, the `Segmented` toggle, and all `[version]` indexing; the `Version` and `Segmented` imports go too.

Import line (was `import { SectionLabel, Segmented, StepIntro } from './ui'`):
```ts
import { SectionLabel, StepIntro } from './ui'
```
Drop `Version` from the gates import (keep `fitProblem`, `type PerClientVersion`):
```ts
import { fitProblem, type PerClientVersion } from '../../core/gates'
```
Remove the `version` state line entirely (`const [version, setVersion] = useState<Version>('V1')`). `useState` is still used? No — after this it is not; change the React import to drop `useState`:
```ts
import { type ChangeEvent } from 'react'
```
Replace the three setters:
```ts
  const setShared = (field: keyof PersonaCopyVersion, value: string) =>
    setDraft((d) => ({ ...d, shared: { ...d.shared, [field]: value } }))

  const updatePC = (brand: string, patch: Partial<PerClientVersion>) =>
    setDraft((d) => {
      const cur = d.perClient[brand] ?? {}
      return { ...d, perClient: { ...d.perClient, [brand]: { ...cur, ...patch } } }
    })

  const setOverride = (brand: string, field: keyof PersonaCopyVersion, value: string) =>
    setDraft((d) => {
      const cur = d.perClient[brand] ?? {}
      const ov = { ...(cur.override ?? {}), [field]: value }
      return { ...d, perClient: { ...d.perClient, [brand]: { ...cur, override: ov } } }
    })
```
In the JSX:
- Delete the `<Segmented options={['V1', 'V2'] as const} value={version} onChange={setVersion} />` line.
- `draft.shared[version][field]` → `draft.shared[field]` (the shared-fields `.map`).
- `<SectionLabel>Per client — offer, photo &amp; overrides ({version})</SectionLabel>` → `<SectionLabel>Per client — offer, photo &amp; overrides</SectionLabel>`.
- `const pc = draft.perClient[slug]?.[version] ?? {}` → `const pc = draft.perClient[slug] ?? {}`.
- In the make-different block: `pc.override?.[field] ?? draft.shared[version][field] ?? ''` → `pc.override?.[field] ?? draft.shared[field] ?? ''`.
- In the live-preview block, drop the `version={version}` prop on `<DeliverablePreview ... />`.

- [ ] **Step 6: Update `src/pages/Campaign/DeliverablePreview.tsx`**

Drop the `version` prop and use the 1-arg `resolveDraftContent`. Remove the `Version` import.

```ts
import { resolveDraftContent, type FlowDraft } from '../../core/gates'
```
Remove `version` from the destructured props and the props type, then:
```ts
  const content = resolveDraftContent(draft, kit.slug)
```

- [ ] **Step 7: Update `src/pages/Campaign/AnimationStep.tsx`**

Delete the `version="V1"` prop on the `<DeliverablePreview ... />` (line ~52).

- [ ] **Step 8: Update `src/pages/Campaign/ExportStep.tsx`**

Remove the ×2 version fan-out; add a single naming-only "Version label" (a `Version` from `naming.ts`, default `'V1'`), reusing the kept `Segmented` primitive.

Add `useState` + `Segmented`:
```ts
import { useState } from 'react'
import { Segmented } from './ui'
```
Inside the component, after the early-return guard:
```ts
  const [version, setVersion] = useState<Version>('V1')
  const sizes: Size[] = ['Story', 'Post']
  const styleId = draft.animationStyle ?? 'none'
  const types: CreativeType[] = styleId === 'none' ? ['Image'] : ['Image', 'Video']
  const total = selKits.length * templates.length * sizes.length * types.length
```
(Delete the old `const versions: Version[] = ['V1', 'V2']` and the `* versions.length` factor.)

Replace `buildConfig`'s `deliverables` so there is no `versions.flatMap`, and `version` comes from the label state:
```ts
    deliverables: selKits.flatMap((kit) =>
      templates.flatMap((t) =>
        sizes.flatMap((size) =>
          types.map((creativeType) => ({
            name: deliverableName({
              adSetType: campaign.adSetType,
              theme: campaign.name,
              year: campaign.year,
              creativeType,
              version,
              size,
              clientName: kit.clientName,
            }),
            brand: kit.slug,
            template: t.manifest.slug,
            version,
            size,
            creativeType,
            ...(creativeType === 'Video' ? { durationMs: presetDuration(styleId), fps: 30 } : {}),
            content: resolveDraftContent(draft, kit.slug),
          })),
        ),
      ),
    ),
```
Update the `StepIntro` body to drop the "× versions" factor:
```tsx
      <StepIntro title={`Export — ${persona.name}`}>
        {selKits.length} brands × {templates.length} templates × {sizes.length} sizes
        {styleId !== 'none' ? ' × image + video' : ''} = {total} deliverables, grouped under {persona.name}.
      </StepIntro>
```
Add the label control just below `StepIntro` (before the download row):
```tsx
      <div className="mb-4 max-w-xs">
        <SectionLabel>Version label (filename only)</SectionLabel>
        <Segmented options={['V1', 'V2'] as const} value={version} onChange={setVersion} />
      </div>
```
Import `SectionLabel` alongside `StepIntro` and `Segmented` from `./ui`. Finally, drop `version="V1"` from the preview `<DeliverablePreview ... />`.

- [ ] **Step 9: Update `CampaignBuilder.tsx`, `CampaignStep.tsx`, `ui.tsx`**

`src/pages/Campaign/CampaignBuilder.tsx` (line ~30) — initial draft:
```ts
  shared: {},
```
`src/pages/Campaign/CampaignStep.tsx` (line ~19) — write a flat block, still reading V1 from the (still-dual in this task) copy library:
```ts
      const shared = lib ? pick(lib.V1) : d.shared
```
`src/pages/Campaign/ui.tsx` (line ~66) — update the stale comment on the kept generic primitive:
```ts
/** Compact two-or-more option toggle. */
```

- [ ] **Step 10: Type-check and run the full suite — expect green**

Run: `npx tsc -b`
Expected: no errors.
Run: `npm test`
Expected: PASS (whole suite — `gates.test.ts` updated; `schemas`/`persist`/`repo-data` still validate the untouched dual campaign data; `smoke.test.tsx` renders the flat-draft builder).

- [ ] **Step 11: Commit**

```bash
git -c core.autocrlf=false add -A
git -c core.autocrlf=false commit -m "refactor: collapse FlowDraft builder to a single copy version"
```

---

### Task 2: Collapse the committed Campaign/copy data + render path

Flattens the committed `Campaign` schema and copy library, the render path that reads them, the `CampaignStep` read, and migrates the 6 campaign + 1 copy JSON files. After this the codebase is fully single-version.

**Files:**
- Modify: `src/core/schemas.ts`
- Modify: `src/core/data.ts`
- Modify: `src/pages/RenderView.tsx`
- Modify: `src/pages/Campaign/CampaignStep.tsx`
- Test: `src/core/schemas.test.ts`
- Test: `src/core/persist.test.ts`
- Migrate: `data/campaigns/aloha-bts-2026.json`, `data/campaigns/demo-back-to-school-2026.json`, `data/campaigns/demo-green-dental.json`, `data/campaigns/joe-bts-2026.json`, `data/campaigns/meason-bts-2026.json`, `data/campaigns/rogers-disc-demo.json`
- Migrate: `data/copy/back-to-school-2026.json`

**Interfaces:**
- Consumes: Task 1's `FlowDraft`/`resolveDraftContent` (unchanged here); `PersonaCopyVersion` from `data.ts`.
- Produces:
  - `CampaignSchema` with a flat `content: SlotContentSchema` and optional `notes`; `versions`, `CampaignVersionSchema`, and the `CampaignVersion` type are removed.
  - `interface CopyLibraryEntry { campaignTheme: string; year: number; personas: Record<string, PersonaCopyVersion> }`
  - `sharedCopy(lib, theme, year, personaSlug): PersonaCopyVersion | undefined` (no `version` param).

- [ ] **Step 1: Update `src/core/schemas.ts`**

Remove `CampaignVersionSchema` / `CampaignVersion`; flatten `CampaignSchema`. `RenderManifestSchema` stays exactly as-is.

```ts
// DELETE the CampaignVersionSchema + CampaignVersion export block.

export const CampaignSchema = z.object({
  slug,
  clientSlug: slug,
  adSetType: z.enum(['Seasonal', 'Evergreen']),
  theme: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  hifiTemplateSlug: slug,
  content: SlotContentSchema,
  notes: z.string().optional(),
})
export type Campaign = z.infer<typeof CampaignSchema>
```

- [ ] **Step 2: Update `src/core/data.ts`**

Flatten `CopyLibraryEntry.personas` and drop the `version` arg from `sharedCopy`.

```ts
export interface CopyLibraryEntry {
  campaignTheme: string
  year: number
  personas: Record<string, PersonaCopyVersion>
}

/** Shared headline/subhead/cta for a persona on a campaign, or undefined if none authored. */
export function sharedCopy(
  lib: Record<string, CopyLibraryEntry>,
  theme: string,
  year: number,
  personaSlug: string,
): PersonaCopyVersion | undefined {
  return lib[copyKey(theme, year)]?.personas?.[personaSlug]
}
```

- [ ] **Step 3: Update `src/pages/RenderView.tsx`**

In `CampaignRender`, read the flat `campaign.content` and call `sharedCopy` without a version. Remove the `version` usage from content selection (the URL param may still arrive and is ignored).

```ts
  const content = campaign.content
  const shared = sharedCopy(copyLib, campaign.theme, campaign.year, kit.personaSlug)
```
The `version` prop on `CampaignRender` and the `version` URL param are no longer used for content — remove the `version` field from `CampaignRender`'s props/usage. (`BatchDeliverable.version` and the batch path stay untouched — naming only.)

- [ ] **Step 4: Update `src/pages/Campaign/CampaignStep.tsx`**

The copy library is now flat, so read it directly:
```ts
      const shared = lib ? pick(lib) : d.shared
```

- [ ] **Step 5: Update `src/core/schemas.test.ts`**

Replace the `CampaignSchema` `base` fixture and its three tests with the flat shape.

```ts
describe('CampaignSchema', () => {
  const base = {
    slug: 'smith-back-to-school-2026',
    clientSlug: 'mock-ortho-co',
    adSetType: 'Seasonal',
    theme: 'Back To School',
    year: 2026,
    hifiTemplateSlug: 'hero-banner-cta',
    content: { headline: 'A', cta: 'Book', photo: 'assets/photos/back-to-school/classroom-warm.svg' },
  }
  it('accepts a complete campaign', () => {
    expect(CampaignSchema.parse(base).content.headline).toBe('A')
  })
  it('rejects a bad ad set type', () => {
    expect(() => CampaignSchema.parse({ ...base, adSetType: 'Holiday' })).toThrow()
  })
  it('rejects a bad slug', () => {
    expect(() => CampaignSchema.parse({ ...base, slug: 'Bad Slug' })).toThrow()
  })
})
```
(The `RenderManifestSchema` describe block is unchanged — it keeps its `version` fields.)

- [ ] **Step 6: Update `src/core/persist.test.ts`**

Flatten the campaign fixture:
```ts
const campaign = {
  slug: 'demo',
  clientSlug: 'mock-ortho-co',
  adSetType: 'Seasonal',
  theme: 'X',
  year: 2026,
  hifiTemplateSlug: 'hero-banner-cta',
  content: {},
} as Campaign
```

- [ ] **Step 7: Migrate the 6 campaign JSON files**

For each `data/campaigns/*.json`: lift `versions.V1.content` up to a top-level `content`, carry over `versions.V1.notes` to a top-level `notes` if present, and delete the `versions` object entirely (drop V2).

Example — before:
```json
{
  "slug": "joe-bts-2026",
  "clientSlug": "everyday-orthodontics",
  "adSetType": "Seasonal",
  "theme": "Back To School",
  "year": 2026,
  "hifiTemplateSlug": "joe-value-card",
  "versions": {
    "V1": { "content": { "headline": "...", "offer": "..." } },
    "V2": { "content": { "headline": "...", "offer": "..." } }
  }
}
```
After:
```json
{
  "slug": "joe-bts-2026",
  "clientSlug": "everyday-orthodontics",
  "adSetType": "Seasonal",
  "theme": "Back To School",
  "year": 2026,
  "hifiTemplateSlug": "joe-value-card",
  "content": { "headline": "...", "offer": "..." }
}
```
Apply identically to: `aloha-bts-2026.json`, `demo-back-to-school-2026.json`, `demo-green-dental.json`, `joe-bts-2026.json`, `meason-bts-2026.json`, `rogers-disc-demo.json`. (Preserve each file's own V1 values verbatim — do not invent content.)

- [ ] **Step 8: Migrate the copy JSON file**

`data/copy/back-to-school-2026.json`: for every persona under `personas`, replace its `{ "V1": {...}, "V2": {...} }` object with the flat V1 fields. Example — before:
```json
"personas": {
  "dr-m-rogers": {
    "V1": { "headline": "...", "subhead": "...", "cta": "...", "disclaimer": "..." },
    "V2": { "headline": "...", "subhead": "...", "cta": "..." }
  }
}
```
After:
```json
"personas": {
  "dr-m-rogers": { "headline": "...", "subhead": "...", "cta": "...", "disclaimer": "..." }
}
```
Apply to every persona key in the file, keeping each persona's own V1 values.

- [ ] **Step 9: Type-check and run the full suite — expect green**

Run: `npx tsc -b`
Expected: no errors.
Run: `npm test`
Expected: PASS — including `repo-data.test.ts`, which re-parses all 6 migrated campaign files against the new flat `CampaignSchema` (any mis-migrated file fails here and names itself).

- [ ] **Step 10: Residual-reference sweep**

Run: `git grep -nE "\.versions|resolveDraftContent\([^,]+,[^,)]+,|\bV1\b|\bV2\b" -- src`
Expected: matches remain ONLY in `src/core/naming.ts` (the `Version` type) and `src/core/schemas.test.ts` + `src/pages/RenderView.tsx` (the `RenderManifest` / batch naming axis). No content-axis references remain. Investigate anything else.

- [ ] **Step 11: Manual smoke in the browser**

Run: `npm run dev`
Verify: persona → kit → campaign → Copy step shows a single copy set (no V1/V2 toggle); Export step shows one "Version label" control and a deliverable count with no ×2 versions factor; the live preview renders.

- [ ] **Step 12: Commit**

```bash
git -c core.autocrlf=false add -A
git -c core.autocrlf=false commit -m "refactor: collapse committed campaign/copy data to a single version"
```

---

## Self-Review

**Spec coverage:** §A (core types) → Task 1 Steps 2, Task 2 Step 1–2. §B (UI) → Task 1 Steps 5–9. §C (preserved naming axis) → enforced by Global Constraints + Task 2 Step 10 sweep. §D (data migration, 6+1 files) → Task 2 Steps 7–8. §E (tests) → Task 1 Step 3 (`gates.test`), Task 2 Steps 5–6 (`schemas.test`, `persist.test`); `data.test`/`repo-data.test`/`smoke.test` correctly left unchanged (no version refs / schema-driven). Verification plan → Task 1 Step 10, Task 2 Steps 9–11. All spec sections map to a task.

**Placeholder scan:** No TBD/TODO; every code step shows the exact new code; the data migration gives a full before/after plus the explicit file list and the "preserve V1 values verbatim" rule.

**Type consistency:** `resolveDraftContent(draft, brandSlug)`, `copyGate(d)`, `emptyPerClient()`, `FlowDraft.shared: PersonaCopyVersion`, `CopyLibraryEntry.personas: Record<string, PersonaCopyVersion>`, `sharedCopy(lib, theme, year, personaSlug)`, and `CampaignSchema.content` are used identically everywhere they appear across both tasks. The `Version` type survives only in `naming.ts`; ExportStep imports it from there for the label.
