// OrthoBoost batch render harness — en masse, grouped by persona.
// Usage: node harness/render-batch.mjs <batch-config.json>
// The batch config is what the app's Export step downloads: a persona + a list of
// deliverables, each with fully-resolved content (shared copy + per-client offer/photo).
// Builds + serves the app, drives headless Chromium over the batch render route,
// and screenshots each deliverable to out/<persona>/<name>.png.
import { readFileSync, mkdirSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { build, preview } from 'vite'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'out')
const TMP = join(OUT, '.frames')
const CANVAS = { Story: { w: 1080, h: 1920 }, Post: { w: 1080, h: 1350 } }
const framesCap = process.env.FRAMES_CAP ? Number(process.env.FRAMES_CAP) : Infinity

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

const configPath = process.argv[2]
if (!configPath) {
  console.error('usage: node harness/render-batch.mjs <batch-config.json>')
  process.exit(1)
}
const config = JSON.parse(readFileSync(configPath, 'utf8'))
if (!config.persona || !Array.isArray(config.deliverables)) {
  console.error('Not a batch config (need { persona, deliverables: [...] }).')
  process.exit(1)
}

async function waitReady(page) {
  await page.waitForFunction(() => document.body.dataset.renderReady === '1', null, { timeout: 15000 })
}

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  const personaDir = join(OUT, config.persona)
  mkdirSync(personaDir, { recursive: true })

  console.log(`Building app…`)
  await build({ root: ROOT, logLevel: 'warn' })
  // Serve the batch config alongside the built app so the render route can fetch it.
  writeFileSync(join(ROOT, 'dist', '_batch.json'), JSON.stringify(config))

  const server = await preview({ root: ROOT, preview: { port: 4318 }, logLevel: 'warn' })
  const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, '')

  const browser = await chromium.launch()
  const context = await browser.newContext({ deviceScaleFactor: 1 })
  const page = await context.newPage()
  const hasFfmpeg = await ffmpegAvailable()
  mkdirSync(TMP, { recursive: true })
  const report = []

  console.log(`Rendering ${config.deliverables.length} deliverables for ${config.persona}…`)
  for (let i = 0; i < config.deliverables.length; i++) {
    const d = config.deliverables[i]
    const dims = CANVAS[d.size]
    if (!dims) {
      report.push(`FAIL ${d.name} — unknown size ${d.size}`)
      continue
    }
    const clip = { x: 0, y: 0, width: dims.w, height: dims.h }
    await page.setViewportSize({ width: dims.w, height: dims.h })
    try {
      if (d.creativeType === 'Video') {
        if (!hasFfmpeg) {
          report.push(`SKIP ${d.name}.mp4 (ffmpeg not found)`)
          continue
        }
        const fps = d.fps ?? 30
        const total = Math.min(Math.round(((d.durationMs ?? 5000) / 1000) * fps), framesCap)
        for (let f = 0; f < total; f++) {
          await page.goto(`${baseUrl}/render?batch=_batch.json&i=${i}&frame=${f}&fps=${fps}`)
          await waitReady(page)
          await page.screenshot({ path: join(TMP, `f-${String(f).padStart(4, '0')}.png`), clip })
        }
        await run('ffmpeg', [
          '-y', '-framerate', String(fps), '-i', join(TMP, 'f-%04d.png'),
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          join(personaDir, `${d.name}.mp4`),
        ])
        rmSync(TMP, { recursive: true, force: true })
        mkdirSync(TMP, { recursive: true })
        report.push(`OK   ${config.persona}/${d.name}.mp4`)
      } else {
        await page.goto(`${baseUrl}/render?batch=_batch.json&i=${i}`)
        await waitReady(page)
        await page.screenshot({ path: join(personaDir, `${d.name}.png`), clip })
        report.push(`OK   ${config.persona}/${d.name}.png`)
      }
    } catch (e) {
      report.push(`FAIL ${d.name} — ${e.message}`)
    }
  }

  rmSync(TMP, { recursive: true, force: true })
  await browser.close()
  await server.httpServer.close()
  writeFileSync(join(OUT, 'REPORT.txt'), report.join('\n') + '\n')
  // Keep the config next to the output for traceability.
  cpSync(configPath, join(OUT, 'batch.json'))
  console.log('\n' + report.join('\n'))
  console.log(`\nWrote deliverables to ${join(OUT, config.persona)}`)
  if (report.some((r) => r.startsWith('FAIL'))) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
