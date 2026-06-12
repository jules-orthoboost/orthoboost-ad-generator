# OrthoBoost Ad Generator

A modular web app for procedurally generating ad creative and landing-page content for orthodontics practices. Ads are assembled from **personas**, **brand kits**, and **templates** by a rules-driven engine — no LLM in the render path. Template synthesis (low- and high-fidelity) is Claude-driven; rendering is deterministic and happens in-browser.

## Core concepts

| Concept | Cardinality | Role |
|---|---|---|
| **Persona** | 1 per client (shared across clients) | How a practice sounds/looks: positioning, messaging behavior, patient base. Built once, reused by every client assigned to it. |
| **Brand kit** | 1 per client (~30–40 today) | Defines the client: assigns a persona, then overrides the template with only what's truly theirs (logo, colors, typography, imagery). |
| **Template** | Many | HTML/CSS-driven layout for an ad or content piece, rendered to PNG/JPG/MP4 etc. Carries a placement matrix (safe areas, margins) and video grammar (length, beats, looping, reduced motion). |

## Output spec

Each campaign produces **8 deliverables** — two A/B versions (V1/V2), each with:

- 9:16 **Story** (static + animated)
- 4:5 **Post** (static + animated)

File naming:

```
{Ad Set Type}_{Creative Theme-YYYY}_{Creative Type}_{Version}_{Size}_{Client Name}
```

- **Ad Set Type** — `Seasonal` or `Evergreen`
- **Creative Theme-YYYY** — e.g. `Summer-2026`, `BackToSchool-2026`, `NewYears-2026`
- **Creative Type** — `Video` or `Image`
- **Version** — `V1` or `V2`
- **Size** — `Story` (9:16) or `Post` (4:5)
- **Client Name** — the orthodontics office

Each ad needs copy, an image, and a logo. Every campaign also ships a matching **site template** (nav bar, hero, footer) using the same copy/offer/photo.

## Principles

- **Procedural, not generative** — templates "plug in" content via rules; no LLM reasoning at render time
- **Client-side rendering** in-browser where possible (Playwright harness as server-side fallback)
- **Gated workflow** — steps unlock as requirements are met (persona → brand kit → template → content → render)
- **Modular & scalable** — adding personas, brand kits, clients, and templates is data, not code

## Rendering finals

Previews render in-browser; the delivered PNG/MP4 files are produced by the render harness
(Playwright + ffmpeg) from a committed campaign.

- **Locally:** `npm run render harness/manifest.example.json` (add `--images-only` to skip video,
  or set `FRAMES_CAP=N` to cap video frames). Outputs land in `out/`, named with the canonical
  deliverable scheme.
- **In CI:** dispatch the **Render finals** workflow (or push a `renders/<id>.manifest.json`); the
  8 finals are uploaded as the `finals` artifact. A lightweight **Render pipeline smoke** runs on
  every push to catch harness regressions.

The harness drives dedicated chrome-less `/render` routes at 1:1; animation is computed from an
injectable virtual clock, so frames are deterministic and previews match finals pixel-for-pixel.

## Status

Phases 0–4 built: data model + inspector, hi-fi templates + brand kits, the gated campaign
builder, and the render harness. See [`docs/BRIEF.md`](docs/BRIEF.md) for the brief and
`docs/plans/` for the phase plans.
