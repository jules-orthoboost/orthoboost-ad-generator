# OrthoBoost Ad Generator — Design

**Date:** 2026-06-09
**Status:** Approved
**Brief:** see [`docs/BRIEF.md`](../BRIEF.md)

## Decisions (locked with Chris)

| Question | Decision |
|---|---|
| Claude's role | Dev-time only. Claude authors lo-fi archetypes and hi-fi templates as code in this repo. The running app makes **zero** LLM calls. |
| Final video rendering | GitHub Actions harness: Playwright + ffmpeg. In-browser is preview only. |
| Data storage | JSON files in the repo. No database. |
| Hosting | GitHub Pages, **public** repo. (Caveat acknowledged: client assets/offers are world-readable. Escape hatch: private repo + Netlify/Cloudflare Pages.) |
| Persistence from the UI | App commits JSON via the GitHub Contents API using a fine-grained PAT the user enters once (stored in browser only, never in the repo). |
| Render runner | GitHub Actions, triggered by the app committing a render manifest. |
| Copy source | Typed/pasted per campaign into template-defined slots. |
| Image assets | Repo asset library: per-client logo folders + shared theme photo library, served by Pages. Uploads go through the same GitHub API commit flow. |
| Platform specs | Meta (FB/IG) only: Story 9:16 (1080×1920), Post 4:5 (1080×1350), Meta safe areas. |
| Site template deliverable | Renders in-app as a preview; downloadable as a self-contained HTML/CSS zip. |
| Initial scope | 11 personas (provided by Chris); ~5 starter lo-fi archetypes to prove the pipeline end-to-end. |

## Architecture

Static React + Vite + TypeScript SPA on GitHub Pages. All entities are versioned files:

```
data/personas/<slug>.json        # 11 to start
data/brand-kits/<client>.json    # 1 per client (~30–40)
data/templates/lofi/<slug>.json  # layout archetypes (zones, placement matrix, video grammar)
templates/hifi/<slug>/           # HTML/CSS implementations (+ template manifest)
data/campaigns/<id>.json         # campaign content
assets/clients/<client>/         # logos
assets/photos/<theme>/           # shared theme photo library
renders/                         # render manifests + (optionally) committed outputs
```

Modularity property: adding a persona, client, brand kit, or template is adding a file. No code changes for new data.

## Domain model

### Persona (`data/personas/`)
Positioning, messaging behavior, patient base, layout/visual-tone guidelines, design principles, and "don'ts." **Initial phase ignores typography/imagery/notes** — those belong to brand kits. Personas are provided, not synthesized.

### Brand kit (`data/brand-kits/`)
One per client. Contains: client display name + slug, persona reference, and overrides only for what's truly theirs — colors, typography, logo asset refs, client-specific don'ts. Everything not overridden inherits from persona/template defaults.

### Lo-fi template (`data/templates/lofi/`)
A layout archetype, defined as data:
- **Zones**: named regions (headline, subhead, CTA, offer, photo, logo) with geometry per size (9:16 and 4:5).
- **Placement matrix**: Meta safe areas (Story: ~250px top / ~340px bottom UI overlay zones), margins, minimum logo size, text max-widths.
- **Video grammar**: duration (default 10s), fps (default 30), beats (timed reveals per zone), looping (default true), reduced-motion variant (static or simplified).
- **Slot contract**: which content fields the archetype requires (drives the gated form).

### Hi-fi template (`templates/hifi/`)
An HTML/CSS implementation of one lo-fi archetype. Parameterized entirely with CSS custom properties + content slots; the engine injects brand-kit tokens and campaign content. Each hi-fi template declares which archetype it implements and which personas it suits (used for filtering in the UI). Animations are CSS/WAAPI driven from the archetype's beats so browser preview and Playwright render are pixel-identical.

### Campaign (`data/campaigns/`)
Client ref, ad set type (`Seasonal`/`Evergreen`), theme + year, chosen hi-fi template, and **two content versions (V1, V2)** — each with the slot values (copy fields), photo selection, and any per-version tweaks.

## Rendering pipeline

**Preview (in-browser):** the SPA renders templates live at exact pixel dimensions, scaled to fit. Animation playback, reduced-motion toggle, and all-8-variants QA grid. Quick static PNG export in-browser is a nice-to-have, not the official path.

**Finals (GitHub Actions):**
1. App commits `renders/<campaign-id>.manifest.json` (campaign ref + requested deliverables) via GitHub API → triggers workflow.
2. Workflow builds the app, serves it locally, and drives headless Chromium via Playwright against dedicated `/render/...` routes.
3. Statics: full-page screenshot → PNG.
4. Animations: CDP virtual time stepped frame-by-frame (deterministic, no dropped frames) → frames piped to ffmpeg → H.264 MP4, faststart, yuv420p.
5. Outputs named by the shared naming function:
   `{AdSetType}_{Theme-YYYY}_{CreativeType}_{Version}_{Size}_{ClientName}`
6. 8 deliverables zipped and published as a workflow artifact (and optionally committed to `renders/`).

The naming function, manifest schema, and zone/safe-area validation live in a shared package used by both the SPA and the harness.

## Workflow (gated steps)

1. **Client** — pick client; gate: brand kit validates (persona assigned, logo present, required tokens set).
2. **Campaign setup** — ad set type, theme, year; gate: all set.
3. **Template** — choose hi-fi template, filtered by the client's persona; gate: selection made.
4. **Content** — V1 + V2 copy per the template's slot contract, photo from library; logo auto-pulled from brand kit; gate: every required slot filled for both versions, copy fits zone constraints.
5. **Preview/QA** — 8-variant grid (V1/V2 × Story/Post × static/animated) + site template preview + reduced-motion check; gate: user marks approved.
6. **Render & export** — commit manifest, trigger Action, surface progress, download zip. Site template downloadable as standalone HTML/CSS zip here too.

## Site template

Same engine, page-level template: nav bar, hero (same copy/offer/photo as the ads), footer. Previewed in step 5; exported as a self-contained zip (inlined CSS, copied assets) in step 6.

## Error handling

- **Schema validation** (zod) on every JSON entity at load; the UI surfaces which file/field is invalid instead of crashing.
- **Gates** make missing requirements explicit — each gate lists exactly what's unmet.
- **GitHub API failures** (bad token, rate limit, conflict): retry with rebase-on-conflict for JSON commits; clear error states in UI.
- **Render harness**: per-deliverable try/catch; partial failures produce the successful files plus a failure report in the artifact.

## Testing

- Unit: naming function, schema validation, token merge (persona → brand kit → campaign), gate logic.
- Visual: Playwright snapshot tests per hi-fi template × size against committed goldens.
- Pipeline smoke: CI renders one fixture campaign end-to-end (1 static + 1 short video) on every push.

## Phasing

1. **Phase 0 — Scaffold**: Vite app, schemas, shared package, data loading, Pages deploy workflow.
2. **Phase 1 — Personas + lo-fi**: ingest 11 personas; author ~5 lo-fi archetypes with Meta placement matrices and video grammar; archetype inspector UI.
3. **Phase 2 — Hi-fi templates**: 1–2 hi-fi implementations per archetype, token-driven; brand kit editor + first real brand kits.
4. **Phase 3 — Campaign builder**: the 6 gated steps, preview/QA grid, GitHub API persistence.
5. **Phase 4 — Render pipeline**: Actions + Playwright + ffmpeg harness, naming, zip artifact.
6. **Phase 5 — Site template**: page template, in-app preview, standalone zip export.
