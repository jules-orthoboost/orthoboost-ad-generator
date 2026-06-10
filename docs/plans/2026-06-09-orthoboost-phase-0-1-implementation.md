# OrthoBoost Ad Generator — Phase 0 + 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the static SPA + shared core (schemas, naming, token merge), ingest persona definitions, and ship 5 lo-fi layout archetypes with an in-app archetype inspector, deployed to GitHub Pages.

**Architecture:** React + Vite + TypeScript SPA on GitHub Pages. All entities are zod-validated JSON files in the repo, loaded at build time via Vite glob imports. A `src/core/` module (naming, schemas, token merge, gate logic) is shared later by the Playwright render harness. No backend, no LLM calls.

**Tech Stack:** Vite 6, React 18, TypeScript, zod, vitest, GitHub Actions (Pages deploy).

**Design doc:** `docs/plans/2026-06-09-orthoboost-ad-generator-design.md`

---

## Conventions

- Run all commands from the repo root.
- Test runner: `npx vitest run <file>` (watch mode off).
- Commit after every green task. Use `feat:`/`chore:`/`test:` prefixes.
- All JSON data files are validated by the schemas in `src/core/schemas.ts`; if you add a field, add it to the schema first (TDD).

---

### Task 1: Scaffold Vite app

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` (via scaffolder, then adjusted)

**Step 1: Scaffold**

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install zod
npm install -D vitest
```

(Scaffolding into a non-empty dir: if the scaffolder balks, scaffold into `tmp-scaffold/` and move files up, keeping existing `README.md`, `docs/`, `.gitignore`.)

**Step 2: Configure Vite for Pages + vitest**

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/orthoboost-ad-generator/", // GitHub Pages project path
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

**Step 3: Verify**

Run: `npm run build` → succeeds. `npm run dev` → default app serves.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS app with vitest"
```

---

### Task 2: Deliverable naming function (TDD)

The shared naming function implements
`{AdSetType}_{Theme-YYYY}_{CreativeType}_{Version}_{Size}_{ClientName}`.

**Files:**
- Create: `src/core/naming.ts`
- Test: `src/core/naming.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { deliverableName } from "./naming";

describe("deliverableName", () => {
  it("builds the canonical file name", () => {
    expect(
      deliverableName({
        adSetType: "Seasonal",
        theme: "Back To School",
        year: 2026,
        creativeType: "Video",
        version: "V1",
        size: "Story",
        clientName: "Smith Orthodontics",
      })
    ).toBe("Seasonal_BackToSchool-2026_Video_V1_Story_SmithOrthodontics");
  });

  it("supports Evergreen + Image + Post", () => {
    expect(
      deliverableName({
        adSetType: "Evergreen",
        theme: "Summer",
        year: 2026,
        creativeType: "Image",
        version: "V2",
        size: "Post",
        clientName: "Bracket Co",
      })
    ).toBe("Evergreen_Summer-2026_Image_V2_Post_BracketCo");
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/core/naming.test.ts`
Expected: FAIL — cannot resolve `./naming`.

**Step 3: Implement**

```ts
export type AdSetType = "Seasonal" | "Evergreen";
export type CreativeType = "Video" | "Image";
export type Version = "V1" | "V2";
export type Size = "Story" | "Post"; // 9:16 / 4:5

export interface DeliverableId {
  adSetType: AdSetType;
  theme: string;
  year: number;
  creativeType: CreativeType;
  version: Version;
  size: Size;
  clientName: string;
}

const pascal = (s: string) => s.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toUpperCase());

export function deliverableName(d: DeliverableId): string {
  return [
    d.adSetType,
    `${pascal(d.theme)}-${d.year}`,
    d.creativeType,
    d.version,
    d.size,
    pascal(d.clientName),
  ].join("_");
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run src/core/naming.test.ts` → PASS.

**Step 5: Commit**

```bash
git add src/core/naming.ts src/core/naming.test.ts
git commit -m "feat: canonical deliverable naming function"
```

---

### Task 3: Core schemas — persona

**Files:**
- Create: `src/core/schemas.ts`
- Test: `src/core/schemas.test.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { PersonaSchema } from "./schemas";

describe("PersonaSchema", () => {
  it("accepts a minimal persona", () => {
    const p = PersonaSchema.parse({
      slug: "family-first",
      name: "Family First",
      positioning: "Warm, community-rooted practice for busy families.",
      messagingBehavior: ["Lead with convenience", "Plain language, no jargon"],
      patientBase: "Parents booking for kids 8-15; some adult aligner cases.",
      designPrinciples: ["Generous whitespace", "Rounded, soft shapes"],
      donts: ["No clinical/medical imagery", "No countdown-timer urgency"],
    });
    expect(p.slug).toBe("family-first");
  });

  it("rejects a bad slug", () => {
    expect(() => PersonaSchema.parse({ slug: "Family First", name: "x", positioning: "x", messagingBehavior: [], patientBase: "x", designPrinciples: [], donts: [] })).toThrow();
  });
});
```

**Step 2: Run** → FAIL (no module).

**Step 3: Implement**

```ts
import { z } from "zod";

export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case slug");

// Typography/imagery intentionally absent in Phase 1 — brand-kit concerns (see design doc).
export const PersonaSchema = z.object({
  slug,
  name: z.string().min(1),
  positioning: z.string().min(1),
  messagingBehavior: z.array(z.string()),
  patientBase: z.string().min(1),
  designPrinciples: z.array(z.string()),
  donts: z.array(z.string()),
});
export type Persona = z.infer<typeof PersonaSchema>;
```

**Step 4: Run** → PASS.

**Step 5: Commit** — `feat: persona schema`

---

### Task 4: Core schemas — lo-fi archetype (zones, placement matrix, video grammar)

**Files:**
- Modify: `src/core/schemas.ts`
- Test: `src/core/schemas.test.ts` (extend)

**Step 1: Failing test**

```ts
import { LofiTemplateSchema } from "./schemas";

describe("LofiTemplateSchema", () => {
  it("accepts an archetype with zones for both sizes and video grammar", () => {
    const t = LofiTemplateSchema.parse({
      slug: "hero-banner-cta",
      name: "Hero / Banner / CTA",
      description: "Full-bleed photo, headline band, CTA pill bottom-center.",
      slots: ["headline", "subhead", "cta", "offer", "photo", "logo"],
      zones: {
        Story: [
          { slot: "photo", x: 0, y: 0, w: 1080, h: 1920, layer: 0 },
          { slot: "headline", x: 90, y: 420, w: 900, h: 300, layer: 1, maxLines: 3 },
          { slot: "cta", x: 290, y: 1380, w: 500, h: 110, layer: 2 },
          { slot: "logo", x: 440, y: 300, w: 200, h: 80, layer: 2 },
        ],
        Post: [
          { slot: "photo", x: 0, y: 0, w: 1080, h: 1350, layer: 0 },
          { slot: "headline", x: 90, y: 220, w: 900, h: 260, layer: 1, maxLines: 3 },
          { slot: "cta", x: 290, y: 1090, w: 500, h: 110, layer: 2 },
          { slot: "logo", x: 440, y: 100, w: 200, h: 80, layer: 2 },
        ],
      },
      placement: {
        Story: { safeTop: 250, safeBottom: 340, margin: 64 },
        Post: { safeTop: 0, safeBottom: 0, margin: 64 },
      },
      videoGrammar: {
        durationMs: 10000,
        fps: 30,
        loop: true,
        reducedMotion: "static",
        beats: [
          { atMs: 0, slot: "photo", effect: "fade-in" },
          { atMs: 600, slot: "headline", effect: "rise-in" },
          { atMs: 1400, slot: "cta", effect: "pop-in" },
        ],
      },
    });
    expect(t.zones.Story).toHaveLength(4);
  });

  it("rejects a zone outside the canvas", () => {
    // Story canvas is 1080x1920; zone overflows right edge
    expect(() =>
      LofiTemplateSchema.parse({
        slug: "bad", name: "Bad", description: "x", slots: ["photo"],
        zones: { Story: [{ slot: "photo", x: 600, y: 0, w: 600, h: 100, layer: 0 }], Post: [] },
        placement: { Story: { safeTop: 0, safeBottom: 0, margin: 0 }, Post: { safeTop: 0, safeBottom: 0, margin: 0 } },
        videoGrammar: { durationMs: 10000, fps: 30, loop: true, reducedMotion: "static", beats: [] },
      })
    ).toThrow(/canvas/);
  });
});
```

**Step 2: Run** → FAIL.

**Step 3: Implement** (append to `schemas.ts`)

```ts
export const CANVAS = {
  Story: { w: 1080, h: 1920 },
  Post: { w: 1080, h: 1350 },
} as const;
export type SizeKey = keyof typeof CANVAS;

export const SlotName = z.enum(["headline", "subhead", "cta", "offer", "photo", "logo", "badge"]);

const ZoneSchema = z.object({
  slot: SlotName,
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  layer: z.number().int().min(0),
  maxLines: z.number().int().positive().optional(),
});

const PlacementSchema = z.object({
  safeTop: z.number().int().min(0),
  safeBottom: z.number().int().min(0),
  margin: z.number().int().min(0),
});

const BeatSchema = z.object({
  atMs: z.number().int().min(0),
  slot: SlotName,
  effect: z.enum(["fade-in", "rise-in", "pop-in", "slide-left", "slide-right", "none"]),
});

const VideoGrammarSchema = z.object({
  durationMs: z.number().int().positive(),
  fps: z.number().int().positive(),
  loop: z.boolean(),
  reducedMotion: z.enum(["static", "simplified"]),
  beats: z.array(BeatSchema),
});

const zonesInCanvas = (size: SizeKey) => (zones: z.infer<typeof ZoneSchema>[]) =>
  zones.every((z_) => z_.x + z_.w <= CANVAS[size].w && z_.y + z_.h <= CANVAS[size].h);

export const LofiTemplateSchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string().min(1),
  slots: z.array(SlotName).min(1),
  zones: z.object({
    Story: z.array(ZoneSchema).refine(zonesInCanvas("Story"), { message: "zone exceeds Story canvas" }),
    Post: z.array(ZoneSchema).refine(zonesInCanvas("Post"), { message: "zone exceeds Post canvas" }),
  }),
  placement: z.object({ Story: PlacementSchema, Post: PlacementSchema }),
  videoGrammar: VideoGrammarSchema,
});
export type LofiTemplate = z.infer<typeof LofiTemplateSchema>;
```

**Step 4: Run** `npx vitest run src/core/schemas.test.ts` → PASS.

**Step 5: Commit** — `feat: lo-fi archetype schema with placement matrix and video grammar`

---

### Task 5: Data loading via Vite glob (personas + lo-fi templates)

**Files:**
- Create: `src/core/data.ts`
- Create: `data/personas/.gitkeep`, `data/templates/lofi/.gitkeep`
- Test: `src/core/data.test.ts`

**Step 1: Failing test** — `loadAll` validates every JSON against its schema and reports the offending file path on error.

```ts
import { describe, it, expect } from "vitest";
import { validateAll } from "./data";
import { PersonaSchema } from "./schemas";

describe("validateAll", () => {
  it("returns parsed entities keyed by slug", () => {
    const out = validateAll(PersonaSchema, {
      "/data/personas/family-first.json": {
        slug: "family-first", name: "Family First", positioning: "x",
        messagingBehavior: [], patientBase: "x", designPrinciples: [], donts: [],
      },
    });
    expect(out["family-first"].name).toBe("Family First");
  });

  it("names the bad file in the error", () => {
    expect(() => validateAll(PersonaSchema, { "/data/personas/bad.json": { slug: "BAD" } }))
      .toThrow(/bad\.json/);
  });
});
```

**Step 2: Run** → FAIL.

**Step 3: Implement**

```ts
import type { z } from "zod";

export function validateAll<S extends z.ZodTypeAny>(
  schema: S,
  files: Record<string, unknown>
): Record<string, z.infer<S>> {
  const out: Record<string, z.infer<S>> = {};
  for (const [path, raw] of Object.entries(files)) {
    const res = schema.safeParse(raw);
    if (!res.success) {
      throw new Error(`${path}: ${res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    }
    out[res.data.slug] = res.data;
  }
  return out;
}

// App-side loaders (not unit-tested; exercised by build):
export function loadPersonas() {
  return validateAll(
    PersonaSchema,
    import.meta.glob("/data/personas/*.json", { eager: true, import: "default" })
  );
}
export function loadLofiTemplates() {
  return validateAll(
    LofiTemplateSchema,
    import.meta.glob("/data/templates/lofi/*.json", { eager: true, import: "default" })
  );
}
```

(Import `PersonaSchema`/`LofiTemplateSchema` at top. `import.meta.glob` requires the test for `validateAll` to stay pure — don't unit test the loaders.)

**Step 4: Run** → PASS. Also `npm run build` → PASS.

**Step 5: Commit** — `feat: schema-validated data loading`

---

### Task 6: Author the 5 lo-fi archetypes

**Files:** create one JSON per archetype in `data/templates/lofi/`, each conforming to `LofiTemplateSchema`, Meta safe areas respected (Story: safeTop 250, safeBottom 340, margin 64; Post: margin 64):

1. `hero-banner-cta.json` — full-bleed photo, headline band, CTA pill (zones as in Task 4's test).
2. `split-stack.json` — photo top half, copy block bottom half, logo in copy block.
3. `offer-card.json` — centered card over photo: offer + headline + CTA inside card.
4. `testimonial-frame.json` — photo with quote-style headline, small CTA, prominent logo.
5. `badge-burst.json` — photo, corner badge slot (offer), headline lower third, CTA.

Each has distinct `videoGrammar.beats` (staggered reveals; all loop, 10000ms/30fps, reducedMotion "static").

**Steps:**
1. Write a validation test `src/core/lofi-data.test.ts` that globs `data/templates/lofi/*.json` via `fs.readdirSync`/`JSON.parse` and parses each with `LofiTemplateSchema` (this runs in node, so use `fs`, not `import.meta.glob`).
2. Run → FAIL (no files).
3. Author the 5 JSON files.
4. Run → PASS.
5. Commit — `feat: five lo-fi layout archetypes`

---

### Task 7: Persona ingestion

Chris provides 11 personas. For each, create `data/personas/<slug>.json` per `PersonaSchema`, **omitting typography/imagery/notes** (brand-kit concerns).

**Steps:**
1. Extend `src/core/lofi-data.test.ts` (rename to `src/core/repo-data.test.ts`) to also validate every persona file.
2. Add persona files as provided. If personas haven't been provided yet, add 2 realistic placeholder personas marked `"placeholder-"` slug prefix and a TODO in README; swap when real ones arrive.
3. Run tests → PASS. Commit — `feat: persona data`

---

### Task 8: Archetype inspector UI

A minimal but polished page proving the data pipeline: list personas and archetypes; selecting an archetype draws its zones to scale for Story and Post side-by-side (colored labeled rectangles, safe areas shaded, margins shown), plus a video-grammar timeline strip (beats on a 0–10s track).

**Files:**
- Create: `src/pages/Inspector.tsx`, `src/components/ZoneCanvas.tsx`, `src/components/BeatTimeline.tsx`
- Modify: `src/App.tsx` (render Inspector; routing can wait until the campaign builder phase)

**Steps:**
1. Implement `ZoneCanvas` (pure SVG: canvas rect, shaded safe-area bands, zone rects with slot labels, scaled to fit ~420px tall).
2. Implement `BeatTimeline` (horizontal track, one marker per beat labeled `slot @ s`).
3. Wire into `App.tsx` with `loadPersonas()` / `loadLofiTemplates()`.
4. Verify: `npm run dev`, click through all 5 archetypes, both sizes render, no console errors. `npm run build` passes.
5. Commit — `feat: archetype inspector UI`

(No unit tests for presentational SVG; the data they render is already schema-tested. Visual snapshot tests arrive with the Playwright harness in Phase 4.)

---

### Task 9: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Workflow**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2:** Push, enable Pages (Settings → Pages → Source: GitHub Actions), verify the site at `https://<user>.github.io/orthoboost-ad-generator/`.

**Step 3: Commit** — `chore: GitHub Pages deploy workflow`

---

## Out of scope (subsequent plans)

- Phase 2: hi-fi HTML/CSS templates + brand kit schema/editor + token merge
- Phase 3: campaign builder with 6 gated steps + GitHub API persistence
- Phase 4: render manifest + Actions/Playwright/ffmpeg harness + zip artifact
- Phase 5: site template preview + standalone zip export
