# OrthoBoost Ad Generator — Phase 2–5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Hi-fi template tasks (Phase 2, Tasks 6–8) REQUIRE the `impeccable` skill** (`/impeccable craft`). Do not hand-roll template CSS; route the visual build through impeccable so the creative does not look generic.

**Goal:** Take the app from "archetype inspector" (Phase 0+1, done) to a working end-to-end ad-generation workflow: token-driven hi-fi HTML/CSS templates rendered against a brand kit, a gated campaign builder, a GitHub Actions render harness producing the 8 named deliverables, and a downloadable site template.

**Architecture:** The existing static React + Vite + TS SPA on GitHub Pages. New entities stay as zod-validated JSON in `data/`; the only new *code* (not data) is the hi-fi template components in `src/templates/hifi/` and the render harness. A pure `resolveTokens` merge (persona → brand kit → campaign) feeds CSS custom properties into both the in-browser preview and the Playwright render, so preview and final output are pixel-identical.

**Tech Stack:** Vite 8, React 19, TypeScript, zod 4, vitest 4 (existing). Adds for later phases: Playwright + ffmpeg (Phase 4 harness, runs only in CI), GitHub Contents API (Phase 3 persistence). Hi-fi template *visual* design is built with the `impeccable` skill.

---

## Scope of this document

This is a **master plan covering four independent subsystems**. Per writing-plans scope rules, each phase produces working, testable software on its own and would normally be its own plan.

- **Phase 2 is fully executable below** — TDD, task-by-task, with complete code. Start here.
- **Phases 3–5 are decomposed roadmaps** — task breakdown, responsibilities, and the schemas that are already stable. Their exact component/harness code depends on Phase 2's resolved-token and template-registry contracts, so writing literal final code now would be speculative. **When Phase 2 lands, expand the chosen next phase into its own full executable plan** (re-run writing-plans against the "Phase N roadmap" section here).

This matches how Phase 0+1 was structured: one detailed plan, executed, before the next was written.

---

## Conventions (unchanged from Phase 0+1)

- Run all commands from the repo root (`orthoboost-ad-generator/`).
- Test runner: `npx vitest run <file>` (watch mode off). Full suite: `npm test`.
- Commit after every green task. Use `feat:`/`chore:`/`test:` prefixes.
- All JSON data files are validated by schemas in `src/core/schemas.ts`; add the schema field first (TDD), then the data.
- Build must stay green: `npm run build` (`tsc -b && vite build`) after any task that touches `src/`.
- **No-eyebrows rule (standing):** ad templates omit the small tracked-caps eyebrow/kicker label by default; the headline leads and is the largest type. (Also an impeccable absolute ban.)
- **Personas are fictional archetypes, never real client offices.** Brand kits are clients. The mock brand kit name must read as an obvious placeholder.

---

# PHASE 2 — Hi-fi templates + brand kits + token merge

**Phase goal:** Render a real, on-brand ad in the browser at exact Meta pixel dimensions for both sizes, driven by a brand kit + sample copy, with beats-based animation and a reduced-motion fallback. Prove the token→template pipeline with one mock brand kit and two hi-fi templates, surfaced in a new "Templates" tab.

## File structure (Phase 2)

| File | Responsibility |
|---|---|
| `src/core/schemas.ts` (modify) | Add `BrandKitSchema`, `HifiTemplateManifestSchema`, `SlotContentSchema`, `HexColor` |
| `src/core/tokens.ts` (create) | `resolveTokens(persona, brandKit)` → `ResolvedTokens`; CSS-var mapping. Pure, shared by preview + harness |
| `src/core/tokens.test.ts` (create) | Merge-precedence unit tests |
| `src/core/data.ts` (modify) | `loadBrandKits()` glob loader |
| `src/core/repo-data.test.ts` (modify) | Validate every brand-kit JSON; assert each `personaSlug` resolves |
| `data/brand-kits/mock-ortho-co.json` (create) | The single mock brand kit (placeholder client) |
| `assets/clients/mock-ortho-co/logo.svg` (create) | Placeholder logo for the mock kit |
| `assets/photos/back-to-school/*.jpg` (create) | 1–2 shared sample photos for preview |
| `src/templates/hifi/types.ts` (create) | `TemplateRenderProps`, `HifiTemplateComponent`, registry types |
| `src/templates/hifi/TemplateFrame.tsx` (create) | Fixed-canvas wrapper: sets px box, injects CSS vars, scales to fit |
| `src/templates/hifi/useBeats.ts` (create) | Hook turning `Beat[]` + `playing` into per-slot animation state (WAAPI/CSS), reduced-motion aware |
| `src/templates/hifi/hero-banner-cta/manifest.ts` (create) | Manifest for template #1 |
| `src/templates/hifi/hero-banner-cta/Template.tsx` (create) | Hi-fi component #1 (built with impeccable) |
| `src/templates/hifi/hero-banner-cta/template.css` (create) | Template #1 styles (CSS-var driven) |
| `src/templates/hifi/offer-card/manifest.ts` + `Template.tsx` + `template.css` (create) | Hi-fi component #2 (built with impeccable) |
| `src/templates/hifi/index.ts` (create) | Code registry: `{ slug: { manifest, Component } }` |
| `src/templates/hifi/registry.test.ts` (create) | Asserts every manifest validates, `archetype` resolves to a lo-fi slug, slots are a subset of the archetype's slots |
| `src/pages/Templates.tsx` (create) | New tab: pick template + size, render via `TemplateFrame` with mock kit + sample content, play/pause + reduced-motion toggle |
| `src/pages/Inspector.tsx` (modify) | Add "Templates" and "Brand Kits" tabs |
| `src/components/BrandKitCard.tsx` (create) | Read-only brand-kit display (swatches, fonts, logo, resolved tokens) |
| `src/index.css` (modify) | Styles for the two new tabs |
| `src/smoke.test.tsx` (modify) | Assert each registered template renders both sizes without throwing |

---

### Task 1: Brand kit + hi-fi manifest + slot-content schemas (TDD)

**Files:**
- Modify: `src/core/schemas.ts`
- Test: `src/core/schemas.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `src/core/schemas.test.ts`:

```ts
import { BrandKitSchema, HifiTemplateManifestSchema, SlotContentSchema } from './schemas'

describe('BrandKitSchema', () => {
  it('accepts a kit with a brand color, persona ref, and logo', () => {
    const k = BrandKitSchema.parse({
      slug: 'mock-ortho-co',
      clientName: 'Mock Ortho Co',
      personaSlug: 'dr-b-nye',
      colors: { brand: '#1f6feb', accent: '#29bbf6' },
      typography: { displayFont: 'Fraunces', bodyFont: 'Inter' },
      logo: { assetPath: 'assets/clients/mock-ortho-co/logo.svg' },
    })
    expect(k.colors.brand).toBe('#1f6feb')
  })

  it('rejects a non-hex brand color', () => {
    expect(() =>
      BrandKitSchema.parse({
        slug: 'bad',
        clientName: 'Bad',
        personaSlug: 'dr-b-nye',
        colors: { brand: 'blue' },
        logo: { assetPath: 'x.svg' },
      }),
    ).toThrow()
  })
})

describe('HifiTemplateManifestSchema', () => {
  it('accepts a manifest referencing an archetype and suited personas', () => {
    const m = HifiTemplateManifestSchema.parse({
      slug: 'hero-banner-cta',
      name: 'Hero Banner CTA',
      archetype: 'hero-banner-cta',
      suitedPersonas: ['dr-b-nye', 'dr-a-joe'],
      slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
    })
    expect(m.slots).toContain('headline')
  })
})

describe('SlotContentSchema', () => {
  it('accepts partial copy + a photo asset path', () => {
    const c = SlotContentSchema.parse({ headline: 'Back to school, back to braces', photo: 'assets/photos/back-to-school/a.jpg' })
    expect(c.headline).toContain('braces')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/core/schemas.test.ts`
Expected: FAIL — `BrandKitSchema` etc. not exported.

- [ ] **Step 3: Implement** (append to `src/core/schemas.ts`)

```ts
export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'hex color')

export const BrandKitSchema = z.object({
  slug,
  clientName: z.string().min(1),
  personaSlug: slug,
  colors: z.object({
    brand: HexColor,
    ink: HexColor.optional(),
    surface: HexColor.optional(),
    accent: HexColor.optional(),
    onBrand: HexColor.optional(),
  }),
  typography: z
    .object({ displayFont: z.string().min(1), bodyFont: z.string().min(1) })
    .optional(),
  logo: z.object({
    assetPath: z.string().min(1),
    aspect: z.number().positive().optional(),
  }),
  radius: z.number().int().min(0).optional(),
  donts: z.array(z.string()).optional(),
})
export type BrandKit = z.infer<typeof BrandKitSchema>

export const HifiTemplateManifestSchema = z.object({
  slug,
  name: z.string().min(1),
  archetype: slug, // references a lo-fi template slug
  suitedPersonas: z.array(slug),
  slots: z.array(SlotName).min(1),
})
export type HifiTemplateManifest = z.infer<typeof HifiTemplateManifestSchema>

// Per-version copy. `logo` is intentionally absent — it comes from the brand kit.
export const SlotContentSchema = z.object({
  headline: z.string().optional(),
  subhead: z.string().optional(),
  cta: z.string().optional(),
  offer: z.string().optional(),
  badge: z.string().optional(),
  photo: z.string().optional(), // asset path
})
export type SlotContent = z.infer<typeof SlotContentSchema>
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/core/schemas.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/schemas.ts src/core/schemas.test.ts
git commit -m "feat: brand kit, hi-fi manifest, and slot-content schemas"
```

---

### Task 2: Token merge — persona → brand kit (TDD)

The pure function shared by the preview UI and the Phase 4 render harness. Precedence: base defaults < persona < brand kit.

**Files:**
- Create: `src/core/tokens.ts`
- Test: `src/core/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { resolveTokens } from './tokens'
import type { Persona, BrandKit } from './schemas'

const persona = {
  slug: 'dr-b-nye',
  name: 'Dr. B. Nye',
  archetype: 'Science-Driven Holistic Clinic',
  accentColor: '#dd6b20',
  positioning: 'x',
  messagingBehavior: 'x',
  patientBase: ['Adults'],
  exampleClients: [],
  layout: [],
  visualTone: [],
  iconography: [],
  texture: [],
  designPrinciples: [],
  donts: [],
} satisfies Persona

const kit = {
  slug: 'mock-ortho-co',
  clientName: 'Mock Ortho Co',
  personaSlug: 'dr-b-nye',
  colors: { brand: '#1f6feb', ink: '#10243f' },
  typography: { displayFont: 'Fraunces', bodyFont: 'Inter' },
  logo: { assetPath: 'assets/clients/mock-ortho-co/logo.svg' },
  radius: 24,
} satisfies BrandKit

describe('resolveTokens', () => {
  it('takes brand color and fonts from the kit', () => {
    const t = resolveTokens(persona, kit)
    expect(t.brand).toBe('#1f6feb')
    expect(t.ink).toBe('#10243f')
    expect(t.displayFont).toBe('Fraunces')
    expect(t.radius).toBe(24)
  })

  it('falls back to the persona accent when the kit omits accent', () => {
    const t = resolveTokens(persona, kit)
    expect(t.accent).toBe('#dd6b20')
  })

  it('falls back to base defaults when both omit a token', () => {
    const t = resolveTokens(persona, kit)
    expect(t.surface).toBe('#ffffff') // base default
    expect(t.onBrand).toBe('#ffffff')
  })

  it('the kit accent overrides the persona accent', () => {
    const t = resolveTokens(persona, { ...kit, colors: { ...kit.colors, accent: '#00b894' } })
    expect(t.accent).toBe('#00b894')
  })

  it('maps tokens to CSS custom properties', () => {
    const t = resolveTokens(persona, kit)
    const vars = t.cssVars
    expect(vars['--brand']).toBe('#1f6feb')
    expect(vars['--radius']).toBe('24px')
    expect(vars['--display-font']).toContain('Fraunces')
  })
})
```

- [ ] **Step 2: Run** → FAIL (no module).

- [ ] **Step 3: Implement**

```ts
import type { Persona, BrandKit } from './schemas'

export interface ResolvedTokens {
  brand: string
  ink: string
  surface: string
  accent: string
  onBrand: string
  displayFont: string
  bodyFont: string
  radius: number
  logoPath: string
  cssVars: Record<string, string>
}

const BASE = {
  brand: '#163055',
  ink: '#1a2332',
  surface: '#ffffff',
  accent: '#29bbf6',
  onBrand: '#ffffff',
  displayFont: 'Inter',
  bodyFont: 'Inter',
  radius: 16,
}

export function resolveTokens(persona: Persona, kit: BrandKit): ResolvedTokens {
  const c = kit.colors
  const ty = kit.typography
  const resolved = {
    brand: c.brand,
    ink: c.ink ?? BASE.ink,
    surface: c.surface ?? BASE.surface,
    accent: c.accent ?? persona.accentColor ?? BASE.accent,
    onBrand: c.onBrand ?? BASE.onBrand,
    displayFont: ty?.displayFont ?? BASE.displayFont,
    bodyFont: ty?.bodyFont ?? BASE.bodyFont,
    radius: kit.radius ?? BASE.radius,
    logoPath: kit.logo.assetPath,
  }
  const stack = (f: string) => `${f}, system-ui, sans-serif`
  return {
    ...resolved,
    cssVars: {
      '--brand': resolved.brand,
      '--ink': resolved.ink,
      '--surface': resolved.surface,
      '--accent': resolved.accent,
      '--on-brand': resolved.onBrand,
      '--display-font': stack(resolved.displayFont),
      '--body-font': stack(resolved.bodyFont),
      '--radius': `${resolved.radius}px`,
    },
  }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** — `feat: persona→brand-kit token merge`

---

### Task 3: Mock brand kit data + loader (TDD)

**Files:**
- Create: `data/brand-kits/mock-ortho-co.json`
- Create: `assets/clients/mock-ortho-co/logo.svg`
- Modify: `src/core/data.ts`
- Modify: `src/core/repo-data.test.ts`

- [ ] **Step 1: Write the failing test** (append to `src/core/repo-data.test.ts`)

```ts
import { BrandKitSchema } from './schemas'

describe('brand kits', () => {
  it('every brand kit validates, matches its file name, and refs an existing persona', () => {
    const personaSlugs = new Set(
      readdirSync(join(root, 'data', 'personas'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, '')),
    )
    const files = jsonFiles(join(root, 'data', 'brand-kits'))
    expect(files.length).toBeGreaterThanOrEqual(1)
    for (const [name, raw] of files) {
      const parsed = BrandKitSchema.parse(raw)
      expect(`${parsed.slug}.json`).toBe(name)
      expect(personaSlugs.has(parsed.personaSlug)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run** → FAIL (no `data/brand-kits` dir).

- [ ] **Step 3: Author the data and logo**

`data/brand-kits/mock-ortho-co.json` (placeholder client; swap in real client kits later — they are just more files):

```json
{
  "slug": "mock-ortho-co",
  "clientName": "Mock Ortho Co",
  "personaSlug": "dr-b-nye",
  "colors": { "brand": "#1f6feb", "ink": "#10243f", "accent": "#16b8a6" },
  "typography": { "displayFont": "Fraunces", "bodyFont": "Inter" },
  "logo": { "assetPath": "assets/clients/mock-ortho-co/logo.svg", "aspect": 2.6 },
  "radius": 22,
  "donts": ["No stock-photo cheesiness", "No countdown-timer urgency"]
}
```

`assets/clients/mock-ortho-co/logo.svg` — a simple wordmark placeholder (clearly a stand-in):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100" role="img" aria-label="Mock Ortho Co">
  <rect width="260" height="100" fill="none"/>
  <circle cx="42" cy="50" r="26" fill="#1f6feb"/>
  <path d="M30 50h24M42 38v24" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
  <text x="84" y="46" font-family="Inter, sans-serif" font-size="26" font-weight="800" fill="#10243f">Mock Ortho</text>
  <text x="84" y="74" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="#16b8a6">CO · placeholder</text>
</svg>
```

- [ ] **Step 4: Add the loader** (modify `src/core/data.ts`)

```ts
import { PersonaSchema, LofiTemplateSchema, BrandKitSchema } from './schemas'

export function loadBrandKits() {
  return validateAll(
    BrandKitSchema,
    import.meta.glob('/data/brand-kits/*.json', { eager: true, import: 'default' }),
  )
}
```

- [ ] **Step 5: Run** → PASS. Then `npm test` → all green.

- [ ] **Step 6: Commit** — `feat: mock brand kit + loader`

---

### Task 4: Hi-fi render contract + template registry types

No business logic yet — the typed contract every hi-fi template implements, shared by preview and harness.

**Files:**
- Create: `src/templates/hifi/types.ts`

- [ ] **Step 1: Implement** (no test — pure types; exercised by Tasks 6–9)

```ts
import type { JSX } from 'react'
import type { Beat, SizeKey, Slot, SlotContent } from '../../core/schemas'
import type { ResolvedTokens } from '../../core/tokens'
import type { HifiTemplateManifest } from '../../core/schemas'

export interface TemplateRenderProps {
  size: SizeKey
  tokens: ResolvedTokens
  content: SlotContent
  logoPath: string
  beats: Beat[]
  durationMs: number
  /** preview playback; the harness drives frames via virtual time */
  playing: boolean
  reducedMotion: boolean
}

export type HifiTemplateComponent = (props: TemplateRenderProps) => JSX.Element

export interface RegisteredTemplate {
  manifest: HifiTemplateManifest
  Component: HifiTemplateComponent
}

export type SlotKey = Slot
```

- [ ] **Step 2: Verify** `npx tsc -b` → no errors.

- [ ] **Step 3: Commit** — `feat: hi-fi template render contract`

---

### Task 5: TemplateFrame wrapper + beats hook

`TemplateFrame` renders a child template into an exact-pixel canvas box, injects `tokens.cssVars`, and scales the whole box with a CSS transform to fit a target height (preview only; the harness renders at 1:1). `useBeats` converts beats into per-slot reveal state.

**Files:**
- Create: `src/templates/hifi/TemplateFrame.tsx`
- Create: `src/templates/hifi/useBeats.ts`

- [ ] **Step 1: Implement `useBeats.ts`**

```ts
import { useEffect, useState } from 'react'
import type { Beat, Slot } from '../../core/schemas'

/** Map of slot -> whether its entrance beat has fired. */
export type RevealState = Partial<Record<Slot, boolean>>

export function useBeats(beats: Beat[], playing: boolean, reducedMotion: boolean): RevealState {
  const allShown: RevealState = Object.fromEntries(beats.map((b) => [b.slot, true]))
  const [state, setState] = useState<RevealState>(reducedMotion || !playing ? allShown : {})

  useEffect(() => {
    if (reducedMotion || !playing) {
      setState(allShown)
      return
    }
    setState({})
    const timers = beats.map((b) =>
      setTimeout(() => setState((s) => ({ ...s, [b.slot]: true })), b.atMs),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reducedMotion, JSON.stringify(beats)])

  return state
}
```

- [ ] **Step 2: Implement `TemplateFrame.tsx`**

```tsx
import type { ReactNode } from 'react'
import { CANVAS, type SizeKey } from '../../core/schemas'
import type { ResolvedTokens } from '../../core/tokens'

interface Props {
  size: SizeKey
  tokens: ResolvedTokens
  /** target rendered height in px; the canvas scales to fit. Omit for 1:1 (harness). */
  fitHeight?: number
  children: ReactNode
}

export function TemplateFrame({ size, tokens, fitHeight, children }: Props) {
  const canvas = CANVAS[size]
  const scale = fitHeight ? fitHeight / canvas.h : 1
  return (
    <div
      className="tpl-frame-outer"
      style={{ width: canvas.w * scale, height: canvas.h * scale }}
    >
      <div
        className="tpl-frame"
        style={{
          width: canvas.w,
          height: canvas.h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ...(tokens.cssVars as React.CSSProperties),
        }}
        data-size={size}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add base frame CSS** to `src/index.css`

```css
.tpl-frame-outer { position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.18); }
.tpl-frame { position: relative; overflow: hidden; font-family: var(--body-font); color: var(--ink); background: var(--surface); }
```

- [ ] **Step 4: Verify** `npm run build` → PASS.

- [ ] **Step 5: Commit** — `feat: TemplateFrame + beats reveal hook`

---

### Task 6: First hi-fi template — `hero-banner-cta` (built with impeccable)

> **REQUIRED SKILL: `impeccable`.** Run `/impeccable craft hero-banner-cta hi-fi ad template`. This template is the reference implementation; its craft sets the bar for the rest.

**Impeccable setup for this repo (do once):**
- [ ] Run `node .claude/skills/impeccable/scripts/context.mjs` from the repo root. If it reports `NO_PRODUCT_MD`, follow `reference/init.md` to create `PRODUCT.md` (+ `DESIGN.md`) describing the **ad-template visual system**: register = **brand** (the design *is* the product), fixed Meta canvases (Story 1080×1920, Post 1080×1350), tokens come from `resolveTokens`, headline-led hierarchy, no eyebrow.
- [ ] Read `reference/brand.md` (this is a campaign/creative surface, not app UI).

**Fixed-canvas adaptations to impeccable's defaults (important):**
- The "viewport" is the fixed 1080-px canvas, not a responsive web page. Verify at exact Story and Post dimensions, not at breakpoints.
- All color/typography come from CSS vars (`var(--brand)`, `var(--display-font)`, etc.) so the brand kit drives them. Do **not** hardcode brand colors.
- Respect the lo-fi archetype's safe areas: keep all text/logo/CTA inside `placement[size]` safe-top/safe-bottom/margin (Story safeTop 250, safeBottom 340, margin 64).
- Headline is the largest element; **no eyebrow/kicker**. CTA is a solid pill in `--brand`/`--accent` with `--on-brand` text (verify ≥4.5:1 contrast).
- Motion is driven by the beats hook, not invented. Each slot's reveal maps to its beat effect; provide a `prefers-reduced-motion` static state (the hook already supplies it via `reducedMotion`).

**Files:**
- Create: `src/templates/hifi/hero-banner-cta/manifest.ts`
- Create: `src/templates/hifi/hero-banner-cta/Template.tsx`
- Create: `src/templates/hifi/hero-banner-cta/template.css`

- [ ] **Step 1: Manifest**

```ts
import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'hero-banner-cta',
  name: 'Hero Banner CTA',
  archetype: 'hero-banner-cta',
  suitedPersonas: ['dr-b-nye', 'dr-a-joe', 'dr-c-yang'],
  slots: ['headline', 'subhead', 'cta', 'photo', 'logo'],
}
```

- [ ] **Step 2: Build `Template.tsx` + `template.css` with impeccable.**

Contract the component MUST satisfy (verified in Task 8 smoke test + screenshots):
- Signature: `export const Component: HifiTemplateComponent = (props) => {...}` importing `TemplateRenderProps` from `../types`.
- Full-bleed `photo` (background `cover`), a readable scrim/treatment behind the headline band, centered `logo`, headline + subhead in the upper-middle, CTA pill bottom-center — matching the `hero-banner-cta` lo-fi zones for the given `size`.
- Uses `useBeats(props.beats, props.playing, props.reducedMotion)` and applies a per-slot `data-shown` / class for the reveal; entrance effects map to beat `effect` (`fade-in`, `rise-in`, `pop-in`).
- All sizing in px against the 1080-canvas; switch layout values on `props.size`.
- `@media (prefers-reduced-motion: reduce)` in `template.css` removes transitions (belt-and-suspenders with the hook).
- Reads copy from `props.content` (fall back to nothing if a slot is empty — never render a placeholder string in the live ad).

- [ ] **Step 3: Visual verification (impeccable polish loop).** Render in the browser (Task 8 wires the page; build that first if iterating visually) at both sizes with the mock kit + sample copy. Screenshot Story and Post. Check: headline legible over photo, safe areas respected, contrast ≥4.5:1, no eyebrow, animation reveals in beat order, reduced-motion shows the final frame. Iterate until it looks genuinely good, not templated.

- [ ] **Step 4: Verify** `npm run build` → PASS.

- [ ] **Step 5: Commit** — `feat: hi-fi template — hero-banner-cta`

---

### Task 7: Second hi-fi template — `offer-card` (built with impeccable)

> **REQUIRED SKILL: `impeccable`.** `/impeccable craft offer-card hi-fi ad template`. Reuse the contract and token vars from Task 6; this proves the pipeline generalizes to a structurally different archetype (a centered card over the photo). Distinct layout and distinct beat choreography — do not clone Task 6's look.

**Files:**
- Create: `src/templates/hifi/offer-card/manifest.ts`, `Template.tsx`, `template.css`

- [ ] **Step 1: Manifest**

```ts
import type { HifiTemplateManifest } from '../../../core/schemas'

export const manifest: HifiTemplateManifest = {
  slug: 'offer-card',
  name: 'Offer Card',
  archetype: 'offer-card',
  suitedPersonas: ['dr-b-nye', 'dr-mcstuffins', 'dr-v-frizzle'],
  slots: ['offer', 'headline', 'cta', 'photo', 'logo'],
}
```

- [ ] **Step 2: Build component + CSS with impeccable**, same contract as Task 6, matching the `offer-card` lo-fi zones: a centered surface card (`--surface`, `--radius`) over the photo containing `offer` (emphasis), `headline`, and `cta`; logo top. Card must not collide with safe areas.

- [ ] **Step 3: Visual verification** as in Task 6.

- [ ] **Step 4: Verify** `npm run build` → PASS.

- [ ] **Step 5: Commit** — `feat: hi-fi template — offer-card`

---

### Task 8: Template registry + smoke test

**Files:**
- Create: `src/templates/hifi/index.ts`
- Create: `src/templates/hifi/registry.test.ts`
- Modify: `src/smoke.test.tsx`

- [ ] **Step 1: Registry**

```ts
import type { RegisteredTemplate } from './types'
import { manifest as heroManifest } from './hero-banner-cta/manifest'
import { Component as HeroComponent } from './hero-banner-cta/Template'
import { manifest as offerManifest } from './offer-card/manifest'
import { Component as OfferComponent } from './offer-card/Template'

export const HIFI_TEMPLATES: Record<string, RegisteredTemplate> = {
  [heroManifest.slug]: { manifest: heroManifest, Component: HeroComponent },
  [offerManifest.slug]: { manifest: offerManifest, Component: OfferComponent },
}
```

- [ ] **Step 2: Failing registry test**

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { HifiTemplateManifestSchema } from '../../core/schemas'
import { HIFI_TEMPLATES } from './index'

const root = join(__dirname, '..', '..', '..')
const lofiSlugs = new Set(
  readdirSync(join(root, 'data', 'templates', 'lofi'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(root, 'data', 'templates', 'lofi', f), 'utf8')).slug),
)

describe('hi-fi registry', () => {
  it('every manifest validates, refs a real archetype, and uses a subset of its slots', () => {
    for (const { manifest } of Object.values(HIFI_TEMPLATES)) {
      HifiTemplateManifestSchema.parse(manifest)
      expect(lofiSlugs.has(manifest.archetype)).toBe(true)
    }
  })
})
```

- [ ] **Step 3: Run** → expect PASS (manifests from Tasks 6–7 are valid). If the archetype subset assertion is wanted, extend the test to load the lo-fi JSON's `slots` and assert `manifest.slots ⊆ archetype.slots`.

- [ ] **Step 4: Smoke test** — append to `src/smoke.test.tsx` a render-without-throw for each template at both sizes, using `resolveTokens` with the mock kit and a fixture persona, empty/partial content, `playing: false`. (Uses the existing test renderer in that file.)

- [ ] **Step 5: Run** `npm test` → all green. `npm run build` → PASS.

- [ ] **Step 6: Commit** — `feat: hi-fi template registry + smoke tests`

---

### Task 9: "Templates" + "Brand Kits" tabs in the app

Surface the work: a Templates tab that renders a chosen hi-fi template with the mock kit and sample copy, for both sizes, with play/pause and reduced-motion toggles; a Brand Kits tab showing the kit and its resolved tokens.

**Files:**
- Create: `src/pages/Templates.tsx`
- Create: `src/components/BrandKitCard.tsx`
- Modify: `src/pages/Inspector.tsx` (add two tabs to the existing `Tab` union + nav + panels)
- Modify: `src/index.css`

- [ ] **Step 1: `Templates.tsx`** — load `HIFI_TEMPLATES`, `loadBrandKits()`, `loadPersonas()`, `loadLofiTemplates()`. State: selected template slug, selected size, `playing`, `reducedMotion`. Resolve tokens from the mock kit's persona + kit. Pull `beats`/`durationMs` from the linked lo-fi archetype's `videoGrammar`. Render `<TemplateFrame size tokens fitHeight={560}><Component .../></TemplateFrame>`. Sample copy constant per template slug (e.g. headline "Back to school, back to braces", subhead, cta "Book a free consult", offer "$500 off"). Photo from `assets/photos/back-to-school/`.

- [ ] **Step 2: `BrandKitCard.tsx`** — given a kit + its persona, show client name, persona link, color swatches (brand/ink/surface/accent), font names, logo (`<img src>` from `assetPath`), and the resolved `cssVars` as a small spec list. Read-only (editing is Phase 3).

- [ ] **Step 3: Wire tabs** into `Inspector.tsx`: extend `type Tab = 'archetypes' | 'personas' | 'templates' | 'brandkits'`; add nav buttons (`Templates (n)`, `Brand Kits (n)`) and the two panels.

- [ ] **Step 4: Add sample photos** to `assets/photos/back-to-school/` (1–2 royalty-free JPGs, ≤300 KB each, committed). Reference by path; served by Vite/Pages.

- [ ] **Step 5: Verify** `npm run dev` → click Templates, switch templates + sizes, play animation (reveals fire in beat order), toggle reduced motion (jumps to final frame), Brand Kits tab renders the kit. No console errors. `npm run build` → PASS.

- [ ] **Step 6: Commit** — `feat: templates + brand-kits inspector tabs`

---

### Phase 2 done-when
- `npm test` green; `npm run build` green; CI deploy still green.
- Two hi-fi templates render on-brand at both sizes from the mock kit, with beats animation + reduced-motion fallback, surfaced in the app.
- Adding a brand kit or a hi-fi template is additive (a file / a folder + a registry line). Real client kits drop into `data/brand-kits/` with no code change.

---

# PHASE 3 — Campaign builder (gated steps + GitHub persistence) — ROADMAP

> Expand into its own executable plan when Phase 2 lands. Depends on: `resolveTokens`, `HIFI_TEMPLATES`, `SlotContentSchema`.

**Phase goal:** The six gated steps from the design doc, producing a validated `data/campaigns/<id>.json` and a preview/QA grid of all variants, persisted via the GitHub Contents API.

**Stable schema to add (`src/core/schemas.ts`):**

```ts
export const CampaignVersionSchema = z.object({
  content: SlotContentSchema,           // copy + photo for this version
  notes: z.string().optional(),
})
export const CampaignSchema = z.object({
  slug,                                 // campaign id
  clientSlug: slug,                     // -> brand kit
  adSetType: z.enum(['Seasonal', 'Evergreen']),
  theme: z.string().min(1),
  year: z.number().int(),
  hifiTemplateSlug: slug,               // -> HIFI_TEMPLATES
  versions: z.object({ V1: CampaignVersionSchema, V2: CampaignVersionSchema }),
})
```

**Tasks (decompose at expansion time):**
1. `CampaignSchema` + `CampaignVersionSchema` (TDD) + `loadCampaigns()`.
2. **Gate logic** in `src/core/gates.ts` (TDD): pure predicates per step — `clientGate(kit)` (persona assigned, logo present, required tokens set), `setupGate`, `templateGate`, `contentGate(template, version)` (every required slot filled for both versions; copy fits zone `maxLines` — needs a fit estimator), `renderGate`. Each returns `{ ok, missing[] }`.
3. **Copy-fit estimator** (TDD): given text, a zone's w/h and `maxLines`, estimate whether it fits (char-width heuristic per font-size); drives the content gate and inline form warnings.
4. **Stepper UI** (`src/pages/Campaign/…`): Client → Setup → Template (filtered by the client persona's suited templates) → Content (V1/V2 forms from the template's slot contract, photo picker, live fit warnings) → Preview (QA grid: all 8 variants via `TemplateFrame`, reduced-motion toggle) → Render & export. Steps unlock as gates pass.
5. **GitHub Contents API persistence** (`src/core/github.ts`): fine-grained PAT entered once, stored in `localStorage` only (never committed); commit `data/campaigns/<id>.json` + uploaded assets (logos/photos) via the same flow. Read-back to confirm.
6. Wire campaign list into the app; deploy.

**Open decisions to resolve at expansion:** photo upload UX (commit-via-API vs. pre-committed library only); campaign id scheme; how copy-fit interacts with real font metrics (heuristic now, Phase 4 harness is the source of truth).

---

# PHASE 4 — Render harness (Playwright + ffmpeg in CI) — ROADMAP

> Expand into its own plan after Phase 3. This is the part that turns previews into the 8 delivered files. Runs **only in GitHub Actions**, not in the browser.

**Phase goal:** A committed render manifest triggers an Action that drives headless Chromium against dedicated render routes and emits 8 named, zipped deliverables.

**Stable schema to add:**

```ts
export const RenderManifestSchema = z.object({
  campaignSlug: slug,
  requested: z.array(z.object({
    version: z.enum(['V1', 'V2']),
    size: z.enum(['Story', 'Post']),
    creativeType: z.enum(['Image', 'Video']),
  })),
})
```

**Tasks (decompose at expansion time):**
1. `RenderManifestSchema` (TDD) + manifest write step in the campaign builder (commit `renders/<campaign>.manifest.json` via the Phase 3 GitHub flow → triggers the workflow).
2. **Dedicated render routes** in the SPA (`/render/:campaign/:version/:size`) that mount one `TemplateFrame` at 1:1 (no fit-scale, no app chrome), reading the campaign + kit. A `?frame=N` param sets virtual time for video frames (drive the beats hook deterministically from a prop, not wall-clock).
3. **Playwright harness** (`harness/render.mjs`): build app, serve locally, for each requested deliverable navigate to its route. Statics → full-page screenshot → PNG. Videos → step CDP virtual time frame-by-frame at `videoGrammar.fps`, screenshot each → pipe to ffmpeg → H.264 MP4 (faststart, yuv420p, even dimensions). **Refactor the beats hook in Phase 2/3 so playback can be driven by an injected `nowMs` prop** — note this dependency back to Task 5.
4. **Naming + packaging**: name every output with the existing `deliverableName()`; zip the 8 files; upload as a workflow artifact (optionally commit to `renders/`). Per-deliverable try/catch → partial success + a failure report in the zip.
5. **CI wiring** (`.github/workflows/render.yml`): triggered on push to `renders/*.manifest.json` + `workflow_dispatch`. Install Playwright browsers + ffmpeg.
6. **Pipeline smoke test**: CI renders one fixture campaign end-to-end (1 static + 1 short video) on every push to catch regressions.

**Open decisions:** virtual-time stepping API (CDP `Emulation.setVirtualTimePolicy` vs. injected clock); whether finals are committed or artifact-only (design doc says artifact, optional commit).

---

# PHASE 5 — Site template + standalone zip export — ROADMAP

> Expand into its own plan after Phase 4. Smallest phase.

**Phase goal:** A landing-page template (nav, hero, footer) sharing the campaign's copy/offer/photo, previewed in-app and downloadable as a self-contained HTML/CSS zip.

**Tasks (decompose at expansion time):**
1. **Site template component** (`src/templates/site/<slug>/`) — same token-var contract as hi-fi ad templates (`resolveTokens` vars), responsive web layout (here normal responsive rules + impeccable `reference/brand.md` apply, unlike the fixed ad canvas). Built with `impeccable craft`. No eyebrow; headline-led hero.
2. **In-app preview** route/tab rendering the site template with the campaign's tokens + content.
3. **Standalone export** (`src/core/siteExport.ts`): inline CSS + assets (logo/photo as data URIs or bundled files) into a self-contained folder; zip in-browser (e.g. a tiny zip lib) and trigger download. No server.
4. Wire the export button into the campaign builder's Render & export step; deploy.

**Open decisions:** how many site archetypes at launch (start with one); asset inlining vs. relative-path bundle.

---

## Self-review notes (author check against the design doc)

- **Spec coverage:** design-doc domain model — Persona (done P0/1), Brand kit (P2 Task 1/3), Lo-fi (done), Hi-fi (P2 Tasks 4–8), Campaign (P3), render manifest (P4), site template (P5). Workflow's 6 gated steps → P3 Task 4. Rendering pipeline (preview + Actions/Playwright/ffmpeg) → P2 preview + P4. Naming function → already exists, reused in P4 Task 4. Testing (naming/schema/token-merge/gate logic units + pipeline smoke) → token-merge P2 Task 2, gates P3 Task 2, pipeline smoke P4 Task 6. No gaps found.
- **Token-name consistency:** `resolveTokens`, `ResolvedTokens`, `cssVars`, `HIFI_TEMPLATES`, `TemplateRenderProps`, `useBeats` used consistently across P2 tasks and referenced identically in P4 (route mounts `TemplateFrame`; beats hook gains an injected-clock prop — flagged in P4 Task 3 as a change back to P2 Task 5).
- **Placeholder scan:** Phase 2 steps carry real code. Visual template bodies (P2 Tasks 6–7 Step 2) are intentionally specified as a *contract + impeccable craft*, not literal CSS — the design content is the skill's job and would be slop if pre-written here; the contract is concrete and the smoke test enforces it. Phases 3–5 are explicitly roadmaps to be expanded, not executable steps — stated up front in "Scope of this document."
