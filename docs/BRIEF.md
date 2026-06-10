# Project Brief — OrthoBoost Ad Generator

> Captured 2026-06-09 from the original project description. This is the source-of-truth brief; design decisions live in `docs/plans/`.

## Domain model

### Persona — 1 per client (shared)
Defines how a practice sounds/looks: positioning, messaging behavior, patient base. Built once, used across every client assigned to that persona. May include typography, imagery, layout, visual tone, iconography, texture, design principles, and relevant "don'ts" as design guidelines. Personas are pre-determined and provided per client.

**Note for initial phase:** ignore typography, imagery, and notes within personas — those are brand-kit concerns.

### Brand kit — 1 per client (~30–40 currently)
Defines the client. Assigns a persona, then overrides the template with only what's truly theirs.

### Template
The generated layout for an ad or piece of content. Driven by HTML/CSS and rendered out to the needed file type (PNG/JPG/MP4/etc.). Minimum required metadata per template:

- **Placement matrix** — safe areas, appropriate margins, etc.
- **Video grammar** — length, beats, looping/non-looping, reduced-motion variants, etc.

## Deliverables per campaign

Two A/B versions (V1, V2) of each ad. Each version has a 4:5 and a 9:16 variant, each as one static and one animated file — **8 total** (4 per version).

Each ad needs: copy, an image, and a logo.

Also a **site template** per campaign: nav bar, footer, and hero section following the same copy/offer/photo as the ad set.

## File naming

```
{Ad Set Type}_{Creative Theme-YYYY}_{Creative Type}_{Version}_{Size}_{Client Name}
```

| Field | Values |
|---|---|
| Ad Set Type | `Seasonal` or `Evergreen` |
| Creative Theme-YYYY | Summer / Back To School / New Years / etc. + current year |
| Creative Type | `Video` or `Image` |
| Version | `V1` or `V2` |
| Size | `Story` (9:16) or `Post` (4:5) |
| Client Name | Relevant orthodontics office name |

## System requirements

- A script that defers ad generation to a **procedural set of rules** — templates "plug things in"; no LLM reasoning/image generation at render time.
- Hosted as a **web app** where the user selects persona, brand kit, and ad template.
- Many templates available; each carries placement matrix + video grammar at minimum.
- **Client-side, in-browser rendering** preferred. If browser limitations block it, fall back to an alternative — likely a Playwright harness.
- **Gated steps** based on requirements; very user friendly.
- **Modular**: support adding personas, brand kits/rules, clients, etc. Highly modifiable, theoretically infinitely scalable.
- Synthesis of new low/high-fidelity templates is **Claude-driven**.

## Phasing (as proposed in brief)

1. Ingest all personas; create **low-fidelity templates** (placement, structure).
2. Build an array of **high-fidelity templates** derived from selected low-fi templates.
3. Insert content: copy, photos, other needed imagery.
4. Render all deliverables in-browser.

## Open questions

Tracked during design phase — see `docs/plans/` once the design doc lands.
