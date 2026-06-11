# Design

Visual system for OrthoBoost hi-fi ad templates. Colors and typefaces are **not** fixed here — they are injected per client via `resolveTokens` as CSS custom properties. This document defines the structural design language the templates share: scale, spacing, treatment, and motion. Token names below are the contract every template consumes.

## Theme

Light-surface, photo-forward editorial. The "page" is a fixed Meta canvas (Story 1080×1920, Post 1080×1350), not a responsive web page. Each template is photo-led: a full-bleed or framed image carries the emotion, with a typographic system layered over it.

## Color (tokens, injected per brand kit)

Consumed as CSS variables; never hardcode. Defaults in `src/core/tokens.ts`.

- `--brand` — primary brand color. CTA fills, key accents, scrims.
- `--accent` — secondary highlight (offer emphasis, underlines). Falls back to the persona accent.
- `--ink` — primary text color for copy on light surfaces.
- `--surface` — card/panel background (offer-card surface, copy bands).
- `--on-brand` — text color on `--brand`/`--accent` fills (CTA label). Must clear AA against the fill.

Legibility over photography is engineered: a gradient scrim (`--brand` or black at low alpha) or a solid `--surface` band sits behind text. Never rely on the raw photo for contrast.

## Typography

- `--display-font` — headlines, offers. The voice. Used large.
- `--body-font` — subheads, CTA labels, fine print.
- Scale (px, on the 1080 canvas): headline 84–132, offer 96–160, subhead 36–48, CTA label 38–46, fine print 26–30. Hierarchy via scale + weight contrast (≥1.25 ratio between steps).
- Headline weight 700–800, `letter-spacing: -0.02em` to -0.03em (never tighter than -0.04em), `text-wrap: balance`, `line-height` 1.0–1.08.
- **No eyebrow / kicker.** The headline is the lead and the largest element. No small tracked-caps label above it (standing rule + impeccable ban).
- No ALL-CAPS body copy. CTA labels may be sentence case or small-caps, never shouting.

## Layout & spacing

- Work in px against the fixed canvas; switch values on `size` (Story vs Post).
- Honor `placement[size]`: Story safeTop 250 / safeBottom 340 / margin 64; Post margin 64. No headline, logo, offer, or CTA inside the safe bands.
- One focal point. Generous negative space is a feature, not waste.
- Logo: small, corner or top-center, never competing with the headline. Min legible size ~140px wide on canvas.
- CTA: solid pill in `--brand` (or `--accent`), `--on-brand` label, `--radius` corners, bottom third within safe area.

## Components / zones

Templates implement a lo-fi archetype's named zones (`headline`, `subhead`, `cta`, `offer`, `photo`, `logo`, `badge`) at the archetype's geometry. Each hi-fi template is a React component matching `TemplateRenderProps`; it reads copy from `content`, the image from the photo zone, and the logo from `logoUrl`. Empty slots render nothing — never a placeholder string in a live ad.

## Motion

- Driven by the archetype's `videoGrammar.beats` via the `useBeats` hook. Effects: `fade-in`, `rise-in`, `pop-in`, `slide-left/right`.
- Reading-order choreography: photo settles → logo → headline → subhead/offer → CTA.
- Ease-out only (no bounce/elastic). Transform + opacity + blur; avoid animating layout properties.
- `@media (prefers-reduced-motion: reduce)`: no transitions; show the final composed frame. The hook supplies this state, the CSS reinforces it.
