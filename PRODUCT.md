# Product

## Register

brand

## Users

Two audiences, one pipeline:

- **Internal operators** (the OrthoBoost team) assemble campaigns: pick a client, a theme, a template, type copy, render. They are not designers; the system must make on-brand output the path of least resistance.
- **End viewers** are prospective orthodontics patients scrolling Meta (Facebook/Instagram) feeds and stories. Parents booking for kids, adults considering aligners, health-conscious professionals. The ad has ~1 second to earn attention and read as a credible local practice, not a discount mill.

The design IS the product: these are paid social creatives. Quality of art direction directly drives campaign performance.

## Product Purpose

Procedurally generate ad creative (and matching site templates) for ~30-40 orthodontics practices, assembled from **personas** (how a practice sounds/looks), **brand kits** (the client's colors/type/logo), and **templates** (layout archetypes). Hi-fi templates are token-driven HTML/CSS: one well-crafted template, recolored and retyped per client via `resolveTokens`, renders pixel-identically in-browser (preview) and via a Playwright/ffmpeg harness (finals). Success = a non-designer produces 8 polished, on-brand Meta deliverables that look bespoke, not templated.

## Brand Personality

Editorial, confident, human. Three words: **credible, warm, premium**. The baseline house style is editorial-premium — headline-led hierarchy, large confident type, generous negative space, refined photographic treatment — tuned per assigned persona (a family-focused clinic reads softer and warmer; a science-driven holistic clinic reads crisper and more structured). The headline leads and is the largest element. Never a small tracked-caps eyebrow above it.

## Anti-references

These are hard bans; the creative fails if it reads as any of them:

- **Generic AI / Canva ad slop** — templated stock photo + drop-shadow + gradient button. The default ad-builder look. The whole point is to not look like this.
- **Cheesy dental clichés** — forced grinning stock smiles, tooth mascots, sparkle/twinkle icons, clip-art braces.
- **Hard-sell urgency** — countdown timers, screaming percentage-off starbursts, ALL-CAPS pressure, "SALE" sunbursts.
- **Cluttered / busy** — competing focal points, tiny text, no breathing room. One clear focal point per ad.

## Design Principles

1. **One ad, one message.** A single headline-led idea per creative. If a viewer can't get it in one second, it's too busy.
2. **Brand owns the surface; the template is the armature.** Every color and typeface comes from the client's tokens (`var(--brand)`, `var(--display-font)`, …). A template that hardcodes color is broken.
3. **Photography does the emotional work.** Real, warm, specific imagery over the photo zone; the layout frames it, never fights it.
4. **Respect the platform.** Meta safe areas are non-negotiable: nothing important under the Story top/bottom UI bands. Legibility over the photo is engineered (scrim/treatment), never hoped for.
5. **Motion is choreography, not decoration.** Reveals follow the archetype's beats, in service of reading order (photo → logo → headline → offer → CTA). Always a reduced-motion final-frame fallback.

## Accessibility & Inclusion

- Headline/CTA text over photography must hit WCAG AA: body ≥4.5:1, large text ≥3:1, engineered via scrim or solid bands, not assumed.
- CTA pills use `--on-brand` text on `--brand`/`--accent`; verify contrast per resolved token set.
- Every animation has a `prefers-reduced-motion: reduce` fallback that shows the final composed frame (the `useBeats` hook already supplies this).
