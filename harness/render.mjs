// OrthoBoost render harness.
// Usage: node harness/render.mjs <manifest.json> [--images-only]
// Builds + serves the app, drives headless Chromium over each deliverable,
// screenshots statics -> PNG and (when ffmpeg is present) steps virtual time -> MP4.
// Outputs land in out/ ; CI uploads out/ as the artifact (auto-zipped).
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { build, preview } from 'vite'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'out')
const TMP = join(OUT, '.frames')
const CANVAS = { Story: { w: 1080, h: 1920 }, Post: { w: 1080, h: 1350 } }

const manifestPath = process.argv[2]
const imagesOnly = process.argv.includes('--images-only')
const framesCap = process.env.FRAMES_CAP ? Number(process.env.FRAMES_CAP) : Infinity
if (!manifestPath) {
  console.error('usage: node harness/render.mjs <manifest.json> [--images-only]')
  process.exit(1)
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))

// Mirrors src/core/naming.ts (kept local so the harness needs no TS loader).
const pascal = (s) =>
  s.split(/[^a-zA-Z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('')
const deliverableName = (d) =>
  [d.adSetType, `${pascal(d.theme)}-${d.year}`, d.creativeType, d.version, d.size, pascal(d.clientName)].join('_')

const ffmpegAvailable = () =>
  new Promise((res) => {
    const p = spawn('ffmpeg', ['-version'])
    p.on('error', () => res(false))
    p.on('exit', (code) => res(code === 0))
  })

const run = (cmd, args) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.on('error', rej)
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))))
  })

async function waitReady(page) {
  await page.waitForFunction(() => document.body.dataset.renderReady === '1', null, { timeout: 15000 })
}

async function main() {
  const manifest = readJson(manifestPath)
  const campaign = readJson(join(ROOT, 'data', 'campaigns', `${manifest.campaignSlug}.json`))
  const kit = readJson(join(ROOT, 'data', 'brand-kits', `${campaign.clientSlug}.json`))
  const grammar = readJson(
    join(ROOT, 'data', 'templates', 'lofi', `${campaign.hifiTemplateSlug}.json`),
  ).videoGrammar
  const nameParts = { adSetType: campaign.adSetType, theme: campaign.theme, year: campaign.year, clientName: kit.clientName }

  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(TMP, { recursive: true })

  console.log('Building app…')
  await build({ root: ROOT, logLevel: 'warn' })
  const server = await preview({ root: ROOT, preview: { port: 4317 }, logLevel: 'warn' })
  const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, '')
  const renderUrl = (q) => `${baseUrl}/render?${new URLSearchParams(q)}`

  const browser = await chromium.launch()
  const context = await browser.newContext({ deviceScaleFactor: 1 })
  const page = await context.newPage()
  const hasFfmpeg = await ffmpegAvailable()
  const report = []

  for (const d of manifest.requested) {
    const name = deliverableName({ ...nameParts, creativeType: d.creativeType, version: d.version, size: d.size })
    const { w, h } = CANVAS[d.size]
    const clip = { x: 0, y: 0, width: w, height: h }
    await page.setViewportSize({ width: w, height: h })
    try {
      if (d.creativeType === 'Image') {
        await page.goto(renderUrl({ campaign: manifest.campaignSlug, version: d.version, size: d.size }))
        await waitReady(page)
        await page.screenshot({ path: join(OUT, `${name}.png`), clip })
        report.push(`OK   ${name}.png`)
      } else if (imagesOnly) {
        report.push(`SKIP ${name}.mp4 (--images-only)`)
      } else if (!hasFfmpeg) {
        report.push(`SKIP ${name}.mp4 (ffmpeg not found)`)
      } else {
        const fps = grammar.fps
        const total = Math.min(Math.round((grammar.durationMs / 1000) * fps), framesCap)
        for (let f = 0; f < total; f++) {
          await page.goto(
            renderUrl({ campaign: manifest.campaignSlug, version: d.version, size: d.size, frame: f, fps }),
          )
          await waitReady(page)
          await page.screenshot({ path: join(TMP, `f-${String(f).padStart(4, '0')}.png`), clip })
        }
        await run('ffmpeg', [
          '-y', '-framerate', String(fps), '-i', join(TMP, 'f-%04d.png'),
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          join(OUT, `${name}.mp4`),
        ])
        rmSync(TMP, { recursive: true, force: true })
        mkdirSync(TMP, { recursive: true })
        report.push(`OK   ${name}.mp4`)
      }
    } catch (e) {
      report.push(`FAIL ${name} — ${e.message}`)
    }
  }

  await browser.close()
  await server.httpServer.close()
  rmSync(TMP, { recursive: true, force: true })
  writeFileSync(join(OUT, 'REPORT.txt'), report.join('\n') + '\n')
  console.log('\n' + report.join('\n'))
  console.log(`\nWrote deliverables to ${OUT}`)
  if (report.some((r) => r.startsWith('FAIL'))) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
