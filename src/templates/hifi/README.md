# Hi-fi template conventions

Each template is `manifest.ts` + `Template.tsx` + `template.css`, registered in
`index.ts`, backed by a lo-fi archetype in `data/templates/lofi/<slug>.json`.
Brand identity (logo, colors, fonts, value props, contact) comes from the brand
kit via `tokens`; per-ad copy comes from `content`.

## Text must never overflow the canvas

User copy is variable length, so **all single-line variable text must auto-fit**.
Wrap it in [`<FitText>`](./FitText.tsx) — it keeps the text on one line and
shrinks the font-size to fit a width budget. This is the standard; apply it to
**every new template** and keep it on the existing ones.

```tsx
import { FitText } from '../FitText'

<FitText as="span" className="xx-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
  {content.cta}
</FitText>
```

- `deps` = every value that changes the text — the content field(s) **and `size`**.
- Give the fitted class a **`max-width`** (the safe width) in CSS. That is the fit
  budget. If the element already sits in a width-constrained parent (a card, a
  fixed-width column), `<FitText>` falls back to the parent width and you can skip
  `max-width`. Canvas width is 1080 for both Post and Story, so a horizontal
  budget is usually size-independent (one base `max-width`).
- For a line with differently-sized parts (a price + its unit), size the parts in
  `em` so they scale together, and fit the row (see `joe-value-card` price, which
  uses the [`useFitText`](./useFitText.ts) hook directly).

**Apply to:** CTAs, offers/prices, eyebrows/badges — anything single-line.

**Do _not_** force-fit multi-line copy (headlines, subheads). Those should wrap:
use `text-wrap: balance` (headlines) / `pretty` (subheads) + a `max-width`. A
shrink-to-fit-**height** mode for multi-line blocks is not built yet — add it
there if a headline needs to fit a fixed-height box.
