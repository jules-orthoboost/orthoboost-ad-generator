# Remove V1/V2 Versions — Design

- **Date:** 2026-06-23
- **Status:** Approved (ready for implementation plan)
- **Scope:** Slice 1 of the "Ad Generator build brief". The other brief items
  (SVG importer, contrast/WCAG engine, logo recolor, persona presets, word-level
  highlighting, verification harness) are **separate future slices** — see
  [Out of scope](#out-of-scope).

## Problem

The generator carries a dual-version (`V1`/`V2`) **content model**: every campaign
authors two parallel copy variants, surfaced through a `V1 / V2` toggle in the
copy step and multiplied into two sets of export deliverables. We want this gone.

But "version" also appears in the **export filename convention**
(`{AdSetType}_{Theme-Year}_{CreativeType}_{Version}_{Size}_{Client}`), and that
marker should stay so exported files keep their version token.

## Key decision: two independent "version" axes

`version` lives on two axes that turn out to be cleanly separable:

| Axis | Where | Decision |
|------|-------|----------|
| **Content** — the dual V1/V2 *copy variants* | `gates.ts` draft, `CampaignSchema.versions`, `CopyLibraryEntry.personas[slug].{V1,V2}`, the copy-step toggle, `RenderView` content selection, export ×2 fan-out | **Collapse to one** |
| **Naming** — the `_V1_` token in export filenames | `naming.ts`, `RenderManifestSchema.requested[].version`, `harness/render.mjs` `d.version`, batch-config `deliverable.version`, ExportStep label | **Keep** |

The naming axis is *already* independent of rendering: `harness/render.mjs` uses
`d.version` only to build the output filename and delegates the actual creative to
`RenderView` over the URL. So we keep the entire naming axis untouched and only
remove the content fork.

## Other decisions (locked during brainstorming)

- **7a — version label at export:** ExportStep exposes a single editable
  **"Version label"** field, default `"V1"`, used *only* by `deliverableName(...)`.
  It no longer multiplies deliverables (the two would be byte-identical), which
  also halves the export count.
- **V2 copy is discarded** in the data migration. Each campaign/copy file keeps its
  former `V1` content as the single surviving version. This is the accepted
  consequence of removing the axis.

## In scope

Collapse the content axis across types, schema, UI, committed data, and tests;
preserve the naming axis and the harness.

## Out of scope

These are the remaining brief items, each its own future spec → plan → build:
SVG template importer (author-time CLI → committed JSON), WCAG **AA** contrast
engine, logo recolor rule, persona presets, word-level highlighting, and the
verification harness. Confirmed defaults for those (for later): WCAG **AA**
(4.5:1 / 3:1); ingestion = **author-time CLI → committed JSON**; highlight =
background highlighter; logo recolor = single-color swap (multi-color untouched);
photo-background contrast = scrim/overlay; naming prefixes `field/ slot/ persona/`
mapped onto the existing slot vocabulary (needs 2–3 real Figma layer names at
importer time). **Not** part of this slice.

## Detailed changes

### A. Core types & logic (collapse content axis)

**`src/core/gates.ts`**
- Delete `export type Version = 'V1' | 'V2'` (line ~24). `naming.ts` keeps its own.
- `FlowDraft.shared: { V1; V2 }` → `shared: PersonaCopyVersion`.
- `FlowDraft.perClient: Record<string, { V1; V2 }>` → `Record<string, PerClientVersion>`.
- `emptyPerClient()` → keep the name; change its return type to a single
  `PerClientVersion` (`{}`).
- `resolveDraftContent(draft, version, brandSlug)` → `resolveDraftContent(draft, brandSlug)`;
  read `draft.shared` and `draft.perClient[brandSlug]` directly.
- `copyGate(d)`: drop the `for (const v of ['V1','V2'])` loops; check
  `d.shared.headline` once and `d.perClient[b]?.offer` once per brand.

**`src/core/data.ts`**
- `CopyLibraryEntry.personas: Record<string, { V1?; V2? }>` →
  `Record<string, PersonaCopyVersion>`.
- `sharedCopy(lib, theme, year, personaSlug, version)` → drop `version`; return
  `lib[copyKey(...)]?.personas?.[personaSlug]`.

**`src/core/schemas.ts`**
- `CampaignSchema`: replace `versions: z.object({ V1, V2 })` with a flat
  `content: SlotContentSchema` plus optional `notes: z.string().optional()`.
  Remove `CampaignVersionSchema` and its `CampaignVersion` type (inlined now).
- **`RenderManifestSchema` is unchanged** — its `version` enum is the harness's
  filename token.

### B. UI (remove toggle + version props)

**`src/pages/Campaign/CopyStep.tsx`**
- Remove `version` state and the `<Segmented options={['V1','V2']}>` control.
- `setShared` / `updatePC` / `setOverride` stop indexing by version.
- Read `draft.shared[field]` and `draft.perClient[slug]` directly.
- Drop the `version` prop on `<DeliverablePreview>` and the `({version})` label text.
- Remove the now-unused `Version` import.

**`src/pages/Campaign/DeliverablePreview.tsx`**
- Drop the `version` prop; call `resolveDraftContent(draft, kit.slug)`.

**`src/pages/Campaign/CampaignStep.tsx`**
- `shared = lib ? { V1: pick(lib.V1), V2: pick(lib.V2) } : d.shared` →
  `shared = lib ? pick(lib) : d.shared` (`lib` is now a `PersonaCopyVersion`).

**`src/pages/Campaign/CampaignBuilder.tsx`**
- Initial draft `shared: { V1: {}, V2: {} }` → `shared: {}`.

**`src/pages/Campaign/ExportStep.tsx`**
- Remove the `versions: Version[] = ['V1','V2']` fan-out; deliverables are no
  longer multiplied by version.
- Add a single **"Version label"** input (default `"V1"`), used only in
  `deliverableName({ ..., version: label })`.
- `resolveDraftContent(draft, kit.slug)` (no version arg).
- Update the `total` math and the `StepIntro` copy (drop "× versions").
- Drop `version="V1"` on the preview `<DeliverablePreview>`.

**`src/pages/Campaign/AnimationStep.tsx`**
- Drop `version="V1"` on `<DeliverablePreview>`.

**`src/pages/Campaign/ui.tsx`**
- Keep the generic `Segmented` primitive; remove its V1/V2-specific comment.
  (It's reusable; don't delete it.)

**`src/pages/RenderView.tsx`**
- `CampaignRender`: read `campaign.content` instead of `campaign.versions[version].content`.
- `sharedCopy(...)` call drops the version arg.
- Stop using the `version` URL param for content selection; the param may still
  arrive from the harness and is simply ignored. `BatchDeliverable.version` stays
  in the batch type (naming only; not used for rendering).

### C. Preserved untouched (naming axis)

- `src/core/naming.ts` — `Version`, `DeliverableId.version`, `deliverableName()`.
- `harness/render.mjs`, `harness/render-batch.mjs` — use `d.version` for filenames,
  delegate content to `RenderView`. No content code reads `campaign.versions`.
- `harness/manifest.*.json` fixtures — stay valid against the unchanged
  `RenderManifestSchema`. Fixtures requesting `V2` will now render identical-content
  files; harmless. Trimming their V2 entries is optional cleanup, not required.

### D. Data migration

- **6 × `data/campaigns/*.json`** (`aloha-bts-2026`, `demo-back-to-school-2026`,
  `demo-green-dental`, `joe-bts-2026`, `meason-bts-2026`, `rogers-disc-demo`):
  `versions: { V1: { content, notes? }, V2: {...} }` → `content: {...}` (keep V1,
  drop V2), matching the new `CampaignSchema`.
- **1 × `data/copy/back-to-school-2026.json`**:
  `personas: { <slug>: { V1: {...}, V2: {...} } }` →
  `personas: { <slug>: { headline, subhead, cta, disclaimer } }` (keep V1, drop V2).

### E. Tests

- `src/core/schemas.test.ts` — fixtures at lines ~163/167 use the old `.versions`
  shape; rewrite to `content`. Keep the `RenderManifestSchema` tests.
- `src/core/gates.test.ts` — version-branching / per-client-override tests → single version.
- `src/core/data.test.ts` — `sharedCopy` signature change; loaders.
- `src/core/persist.test.ts` — Campaign round-trip fixture `versions` → `content`.
- `src/core/repo-data.test.ts` — should pass once data is migrated (counts
  unchanged: 11 personas, ≥5 lofi, ≥1 kit). Verify it doesn't assert the old
  campaign shape.
- `src/smoke.test.tsx` — verify it still renders the builder; adjust any version refs.
- **`src/core/naming.test.ts` — unchanged** (version stays in filenames).

## Verification

1. `npx tsc -b` (or the project's type-check) is clean — the type changes ripple
   through every consumer, so the compiler is the primary completeness check.
2. Full `npm test` is green. This **gates the GitHub Pages deploy**, and
   `smoke.test.tsx` / `repo-data.test.ts` hard-code counts — run the *whole* suite,
   not a subset.
3. Grep `src` for residual `V1` / `V2` / `\.versions` / `resolveDraftContent(.*,.*,`
   — only `naming.ts`, `RenderManifestSchema`, harness fixtures, and naming tests
   should remain.
4. Manually drive the builder (`npm run dev`): persona → kit → campaign → copy
   (no toggle, single copy set) → export (one "Version label" field, no ×2 count).
5. Re-run a harness render (e.g. `manifest.rogers-disc.json`) to confirm filenames
   still carry the `_V1_` token and creatives render.

## Risks

- **Type ripple:** the draft/schema shape change touches ~12 source files + 6 tests.
  Mitigated by leaning on `tsc` to surface every consumer.
- **Data drift:** the 6 campaigns + 1 copy file must be migrated in lockstep with
  the schema or `repo-data.test.ts` / the build fails. Migrate data in the same change.
- **Deploy coupling:** any commit to `main` auto-deploys; a stale hard-coded test
  count breaks the deploy. Branch for the work; run full `npm test` before merge;
  commit with `git -c core.autocrlf=false` (CRLF gotcha).
- **Lost V2 copy:** intentional and accepted. Not recoverable post-migration except
  from git history.
