// Imports the 11 personas from the live Brand-Personas site into data/personas/*.json.
// Typography and Imagery sections are intentionally skipped — brand-kit concerns.
// Usage: node scripts/import-personas.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://jules-orthoboost.github.io/Brand-Personas'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'personas')

const SKIPPED_SECTIONS = new Set(['Typography', 'Imagery'])

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

function overviewCard(html, label) {
  const re = new RegExp(
    `<div class="overview-card-label">${label}</div>\\s*<div class="overview-card-content">([\\s\\S]*?)</div>`,
  )
  const m = html.match(re)
  if (!m) throw new Error(`overview card "${label}" not found`)
  return decode(m[1])
}

function accordionSections(html) {
  const sections = {}
  const re =
    /<button class="accordion-btn"[^>]*>\s*<span>([^<]+)<\/span>[\s\S]*?<ul>([\s\S]*?)<\/ul>/g
  for (const m of html.matchAll(re)) {
    const items = [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) => decode(li[1]))
    sections[decode(m[1])] = items
  }
  return sections
}

async function importPersona(slug, accentColor) {
  const res = await fetch(`${BASE}/${slug}.html`)
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`)
  const html = await res.text()

  const name = decode(html.match(/<h1 class="hero-name">([^<]+)<\/h1>/)[1])
  const archetype = decode(
    html.match(/<p class="hero-subtitle">(?:<span[^>]*><\/span>)?([^<]+)<\/p>/)[1],
  )

  const sections = accordionSections(html)
  for (const skipped of SKIPPED_SECTIONS) delete sections[skipped]

  const resources = [
    ...html.matchAll(/<a href="(https?:[^"]+)"[^>]*class="resource-link">[\s\S]*?<\/svg>\s*([^<]+)/g),
  ].map((m) => ({ label: decode(m[2]), url: m[1] }))

  return {
    slug,
    name,
    archetype,
    accentColor,
    positioning: overviewCard(html, 'Positioning'),
    messagingBehavior: overviewCard(html, 'Messaging Behavior'),
    patientBase: overviewCard(html, 'Patient Base').split(/,\s*/).filter(Boolean),
    exampleClients: overviewCard(html, 'Example Clients').split(/,\s*/).filter(Boolean),
    layout: sections['Layout'] ?? [],
    visualTone: sections['Visual Tone'] ?? [],
    iconography: sections['Iconography'] ?? [],
    texture: sections['Texture'] ?? [],
    designPrinciples: sections['Design Principles'] ?? [],
    donts: sections['What to Avoid'] ?? [],
    ...(resources.length ? { resources } : {}),
  }
}

async function main() {
  const index = await (await fetch(`${BASE}/index.html`)).text()
  // Each card: accent bar color, then the card-link href with the persona slug.
  const cards = [
    ...index.matchAll(
      /card-accent-bar" style="background:(#[0-9a-fA-F]{6});"[\s\S]*?<a href="([a-z0-9-]+)\.html" class="card-link"/g,
    ),
  ].map((m) => ({ accent: m[1].toLowerCase(), slug: m[2] }))
  if (cards.length === 0) throw new Error('no persona cards found on index page')
  console.log(`Found ${cards.length} personas: ${cards.map((c) => c.slug).join(', ')}`)

  mkdirSync(OUT, { recursive: true })
  for (const { slug, accent } of cards) {
    const persona = await importPersona(slug, accent)
    writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(persona, null, 2) + '\n')
    console.log(`  wrote ${slug}.json (accent ${accent})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
