# OrthoBoost Phase 5 — Site Template + Standalone Zip Export

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. The site template's visual build REQUIRES the `impeccable` skill (this is a responsive brand surface — `reference/brand.md` applies, unlike the fixed ad canvas). Steps use checkbox syntax.

**Goal:** Every campaign ships a matching landing page (nav, hero, footer) using the same tokens/copy/offer/photo as the ads — previewed in-app and downloadable as a fully self-contained HTML file inside a zip, no server required.

**Architecture:** The site template is **string-generating, not React**: a pure `renderSiteHtml(campaign, kit, persona, tokens, assets)` returns a complete standalone HTML document (inline CSS, data-URI assets, system/Google-font links). The in-app preview renders that exact string in a sandboxed `<iframe srcdoc>`, so preview === export by construction. A dependency-free ZIP writer (store-method, CRC32 — pure, TDD-able) packages `index.html` for download. Wired into the campaign builder's Export step.

**Tech Stack:** Existing only. No new deps (zip is ~60 lines of pure TS).

---

## Decisions (locked)

- **One site archetype at launch** (`launch-page`): nav (logo) → hero (headline, subhead, offer, CTA, photo) → details band → footer (client name, CTA repeat). More archetypes later are just more generator functions.
- **Self-contained export:** assets inlined as data URIs (logo SVG, photo); fonts via Google Fonts `<link>` (graceful system fallback offline). Single `index.html` in the zip.
- **Pure-string generation** so the same function serves preview, export, and tests. No DOM needed to test it.
- **CTA links to `#contact`** (an anchor on the footer) — real booking URLs are client data we don't have yet; the href is a single obvious placeholder to swap.

---

## File structure

| File | Responsibility |
|---|---|
| `src/core/zip.ts` (create) | `makeZip(files: {name, data}[]) → Uint8Array` (store method, CRC32) |
| `src/core/zip.test.ts` (create) | ZIP structure unit tests (signatures, CRC, byte-exact fields) |
| `src/site/renderSiteHtml.ts` (create) | Pure HTML generator (impeccable-crafted markup+CSS) |
| `src/site/renderSiteHtml.test.ts` (create) | Asserts tokens/copy/assets are embedded, no eyebrow, valid skeleton |
| `src/site/exportSite.ts` (create) | Fetch assets → data URIs → `renderSiteHtml` → `makeZip` → download |
| `src/pages/Campaign/SiteStep.tsx` (create) | Step 7 "Site": iframe preview + download button |
| `src/pages/Campaign/steps.ts` (modify) | Add `site` step (gate = contentGate, same as preview/export) |
| `src/pages/Campaign/CampaignBuilder.tsx` (modify) | Render SiteStep |
| `src/index.css` (modify) | Preview iframe styles |

---

### Task 1: Dependency-free ZIP writer (TDD)

- [ ] **Step 1: Failing test** (`src/core/zip.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { makeZip, crc32 } from './zip'

describe('crc32', () => {
  it('matches the known vector for "123456789"', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })
})

describe('makeZip', () => {
  it('produces a valid single-file archive', () => {
    const data = new TextEncoder().encode('<html>hi</html>')
    const zip = makeZip([{ name: 'index.html', data }])
    // local file header signature PK\x03\x04
    expect([...zip.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    // end-of-central-directory signature PK\x05\x06 present
    const tail = [...zip.slice(-22, -18)]
    expect(tail).toEqual([0x50, 0x4b, 0x05, 0x06])
    // stored payload present verbatim
    const text = new TextDecoder().decode(zip)
    expect(text).toContain('<html>hi</html>')
    expect(text).toContain('index.html')
  })
})
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `src/core/zip.ts` — standard store-method zip: CRC32 table, per-file local header (sig, version 20, method 0, CRC, sizes, name), central directory entries, EOCD record. Little-endian via `DataView`.
- [ ] **Step 4: Run** → PASS. Extra confidence: write a zip in a scratch dir and open it with the OS/`tar -tf` once, manually.
- [ ] **Step 5: Commit** — `feat: dependency-free zip writer`

---

### Task 2: Site HTML generator (impeccable + TDD for the contract)

> Visual craft via `impeccable` (brand register): headline-led hero, no eyebrow, OKLCH-aware use of the brand tokens, ≥4.5:1 body contrast, responsive (mobile-first, no overflow at 360px), `prefers-reduced-motion` honored for any entrance.

- [ ] **Step 1: Failing contract test** (`src/site/renderSiteHtml.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { renderSiteHtml } from './renderSiteHtml'

const html = renderSiteHtml({
  clientName: 'Mock Ortho Co',
  headline: 'Back to school, brighter smiles',
  subhead: 'Free consults all August.',
  offer: '$500 off',
  cta: 'Book a free consult',
  logoSrc: 'data:image/svg+xml;base64,AAA',
  photoSrc: 'data:image/svg+xml;base64,BBB',
  tokens: { brand: '#1f6feb', ink: '#10243f', surface: '#ffffff', accent: '#16b8a6', onBrand: '#ffffff', displayFont: 'Fraunces', bodyFont: 'Inter' },
})

describe('renderSiteHtml', () => {
  it('is a complete standalone document', () => {
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('</html>')
    expect(html).toContain('<style>') // CSS inlined
  })
  it('embeds copy, client name, and assets', () => {
    for (const s of ['Back to school, brighter smiles', 'Mock Ortho Co', '$500 off', 'Book a free consult', 'data:image/svg+xml;base64,AAA', 'data:image/svg+xml;base64,BBB'])
      expect(html).toContain(s)
  })
  it('uses brand tokens, not hardcoded colors', () => {
    expect(html).toContain('--brand: #1f6feb')
    expect(html).toContain('Fraunces')
  })
  it('omits the eyebrow pattern', () => {
    expect(html).not.toMatch(/letter-spacing:\s*0\.[2-9]/) // no wide-tracked kicker style
  })
})
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement with impeccable.** `SiteInput` interface (fields above, all copy optional except clientName). Output: doctype, viewport meta, Google Fonts link (display+body), one `<style>` block driven by `:root{--brand…}` custom properties, then: sticky minimal nav (logo img, CTA link) → hero (h1 headline ≤9rem clamp, subhead, offer emphasis chip, CTA button, photo as a framed media block) → a short details band (three plain-text reassurance items from fixed copy: flexible plans / family scheduling / free consult — no icon-card grid) → footer `#contact` (client name, CTA repeat, "placeholder — replace with booking link" comment). Escape all interpolated copy (`&<>"`). Reduced-motion guard for the one hero entrance.
- [ ] **Step 4: Run** → PASS. Eyeball: write the string to a scratch `.html`, open at 360px and desktop widths; check contrast, no overflow.
- [ ] **Step 5: Commit** — `feat: standalone site template generator (impeccable)`

---

### Task 3: Export pipeline (fetch → data URI → zip → download)

- [ ] **Step 1:** `src/site/exportSite.ts`:

```ts
import { makeZip } from '../core/zip'
import { renderSiteHtml, type SiteInput } from './renderSiteHtml'

async function toDataUri(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

export async function exportSiteZip(input: Omit<SiteInput, 'logoSrc' | 'photoSrc'> & { logoUrl: string; photoUrl?: string }, slug: string) {
  const logoSrc = await toDataUri(input.logoUrl)
  const photoSrc = input.photoUrl ? await toDataUri(input.photoUrl) : undefined
  const html = renderSiteHtml({ ...input, logoSrc, photoSrc })
  const zip = makeZip([{ name: 'index.html', data: new TextEncoder().encode(html) }])
  const blob = new Blob([zip], { type: 'application/zip' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${slug}-site.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}
```

- [ ] **Step 2:** `npm run build` → PASS. **Step 3: Commit** — `feat: site zip export pipeline`

---

### Task 4: Site step in the campaign builder

- [ ] **Step 1:** `steps.ts` — insert `'site'` between `preview` and `export` (STEP_IDS + title "Site"); its gate = same contentGate branch.
- [ ] **Step 2:** `SiteStep.tsx` — derive `SiteInput` from the draft's **V1** content + kit/persona tokens (V1 is the canonical site copy; note this in UI). Render `<iframe srcdoc={renderSiteHtml(...)} sandbox="" />` (preview uses served asset URLs, not data URIs — same generator) with a mobile/desktop width toggle, plus **Download site zip** → `exportSiteZip`. Wire into `CampaignBuilder.tsx`.
- [ ] **Step 3:** CSS: `.cb-site-frame` (responsive iframe shell, border, height ~640px).
- [ ] **Step 4:** Extend smoke test: builder still renders; (`renderSiteHtml` already covered by its own test).
- [ ] **Step 5: Verify** dev: walk to Site step, preview renders both widths, zip downloads and opens to a working page. `npm test` + `npm run build` green.
- [ ] **Step 6: Commit** — `feat: site step with iframe preview + zip download`

---

### Phase 5 done-when
- `npm test`, `npm run build`, deploy + render-smoke CI all green.
- Site step previews a real landing page from campaign data; the downloaded zip contains a single `index.html` that opens correctly from disk (assets inline).

## Self-review
- Design-doc coverage: "Site template … renders in-app as a preview; downloadable as a self-contained HTML/CSS zip" → Tasks 2–4. Same copy/offer/photo as ads → SiteInput from campaign V1 + kit tokens. ✔
- Consistency: `SiteInput`, `renderSiteHtml`, `makeZip`, `exportSiteZip` names used identically across tasks; preview and export share one generator. ✔
- Placeholders: Tasks 1–3 carry code/contracts; Task 2's visual body is impeccable's job with a concrete tested contract (same pattern as Phases 2–4). ✔
