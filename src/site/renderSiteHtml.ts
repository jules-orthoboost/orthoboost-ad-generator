// Standalone landing-page generator. Pure string in/out: the same function
// drives the in-app iframe preview and the zip export, so they cannot diverge.
// Visual system follows DESIGN.md / PRODUCT.md (editorial-premium, headline-led,
// no eyebrow, brand tokens own the surface).

export interface SiteTokens {
  brand: string
  ink: string
  surface: string
  accent: string
  onBrand: string
  displayFont: string
  bodyFont: string
}

export interface SiteInput {
  clientName: string
  headline?: string
  subhead?: string
  offer?: string
  cta?: string
  logoSrc: string
  photoSrc?: string
  tokens: SiteTokens
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function renderSiteHtml(input: SiteInput): string {
  const t = input.tokens
  const clientName = esc(input.clientName)
  const headline = input.headline ? esc(input.headline) : ''
  const subhead = input.subhead ? esc(input.subhead) : ''
  const offer = input.offer ? esc(input.offer) : ''
  const cta = input.cta ? esc(input.cta) : 'Book a consult'
  const fontFamilies = [t.displayFont, t.bodyFont]
    .filter((f, i, a) => a.indexOf(f) === i)
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`)
    .join('&')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${clientName}${headline ? ` — ${headline}` : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${fontFamilies}&display=swap" rel="stylesheet">
<style>
:root {
  --brand: ${t.brand};
  --ink: ${t.ink};
  --surface: ${t.surface};
  --accent: ${t.accent};
  --on-brand: ${t.onBrand};
  --display: '${t.displayFont}', Georgia, serif;
  --body: '${t.bodyFont}', system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; }
body { font-family: var(--body); color: var(--ink); background: var(--surface); line-height: 1.55; }
img { max-width: 100%; display: block; }
a { color: inherit; }

.nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; padding: 0.85rem clamp(1.25rem, 5vw, 3.5rem); background: var(--surface);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); }
.nav img { height: 44px; width: auto; }
.nav a.cta { font-weight: 700; font-size: 0.95rem; text-decoration: none; background: var(--brand);
  color: var(--on-brand); padding: 0.6rem 1.25rem; border-radius: 999px; white-space: nowrap; }

.hero { display: grid; gap: clamp(2rem, 5vw, 4rem); align-items: center;
  padding: clamp(3rem, 8vw, 6.5rem) clamp(1.25rem, 5vw, 3.5rem); max-width: 1180px; margin: 0 auto; }
@media (min-width: 880px) { .hero { grid-template-columns: 1.1fr 0.9fr; } }
.hero h1 { font-family: var(--display); font-weight: 800; letter-spacing: -0.025em; line-height: 1.04;
  font-size: clamp(2.4rem, 6vw, 4.6rem); text-wrap: balance; max-width: 16ch; }
.hero .sub { margin-top: 1.1rem; font-size: clamp(1.05rem, 2vw, 1.3rem); max-width: 38ch;
  color: color-mix(in srgb, var(--ink) 82%, var(--surface)); text-wrap: pretty; }
.offer { display: inline-block; margin-top: 1.4rem; font-family: var(--display); font-weight: 700;
  font-size: clamp(1.2rem, 2.5vw, 1.6rem); color: var(--accent);
  border-bottom: 3px solid var(--accent); padding-bottom: 0.15rem; }
.hero .actions { margin-top: 2rem; }
.hero a.cta { display: inline-block; font-weight: 700; font-size: 1.05rem; text-decoration: none;
  background: var(--brand); color: var(--on-brand); padding: 0.95rem 2rem; border-radius: 999px;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--brand) 35%, transparent); }
.hero .media { border-radius: 18px; overflow: hidden; aspect-ratio: 4 / 5;
  box-shadow: 0 24px 60px color-mix(in srgb, var(--ink) 22%, transparent); }
.hero .media img { width: 100%; height: 100%; object-fit: cover; }

.band { background: color-mix(in srgb, var(--brand) 6%, var(--surface));
  padding: clamp(2.5rem, 6vw, 4rem) clamp(1.25rem, 5vw, 3.5rem); }
.band ul { max-width: 1180px; margin: 0 auto; display: grid; gap: 1.25rem 3rem; list-style: none; padding: 0; }
@media (min-width: 720px) { .band ul { grid-template-columns: repeat(3, 1fr); } }
.band li { font-size: 1.02rem; }
.band li strong { display: block; font-family: var(--display); font-size: 1.15rem; margin-bottom: 0.2rem; }

footer { background: var(--ink); color: var(--surface); padding: clamp(2.5rem, 6vw, 4rem) clamp(1.25rem, 5vw, 3.5rem); }
footer .inner { max-width: 1180px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 1.5rem;
  align-items: center; justify-content: space-between; }
footer .name { font-family: var(--display); font-weight: 700; font-size: 1.3rem; }
footer a.cta { font-weight: 700; text-decoration: none; background: var(--on-brand); color: var(--ink);
  padding: 0.8rem 1.75rem; border-radius: 999px; }

@media (prefers-reduced-motion: no-preference) {
  .hero > * { animation: rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .hero .media { animation-delay: 120ms; }
  @keyframes rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
}
</style>
</head>
<body>
<nav class="nav">
  <img src="${input.logoSrc}" alt="${clientName}">
  ${cta ? `<a class="cta" href="#contact">${cta}</a>` : ''}
</nav>

<main class="hero">
  <div>
    ${headline ? `<h1>${headline}</h1>` : ''}
    ${subhead ? `<p class="sub">${subhead}</p>` : ''}
    ${offer ? `<span class="offer">${offer}</span>` : ''}
    <div class="actions"><a class="cta" href="#contact">${cta}</a></div>
  </div>
  ${input.photoSrc ? `<div class="media"><img src="${input.photoSrc}" alt=""></div>` : ''}
</main>

<section class="band">
  <ul>
    <li><strong>Free first consult</strong>Meet the team, get a plan, no obligation.</li>
    <li><strong>Flexible payment plans</strong>Treatment that fits the family budget.</li>
    <li><strong>Scheduling that works</strong>Before-school and after-work appointments.</li>
  </ul>
</section>

<footer id="contact">
  <div class="inner">
    <span class="name">${clientName}</span>
    <!-- placeholder — replace href with the client's real booking link -->
    <a class="cta" href="#contact">${cta}</a>
  </div>
</footer>
</body>
</html>
`
}
