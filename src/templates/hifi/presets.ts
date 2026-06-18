import type { Beat } from '../../core/schemas'

/** A motion style that works across every template by re-timing and re-effecting
 * the template's entrance beats. Continuous-motion presets (breathe, ken-burns)
 * currently lean on a slow synchronized fade — a fuller continuous treatment is a
 * follow-up that needs a per-template loop layer. */
export interface MotionPreset {
  id: string
  name: string
  effect: Beat['effect']
  stagger: number
  start: number
  durationMs: number
}

export const MOTION_PRESETS: Record<string, MotionPreset> = {
  'gentle-rise': { id: 'gentle-rise', name: 'Gentle Rise', effect: 'rise-in', stagger: 300, start: 350, durationMs: 5200 },
  'pop-stagger': { id: 'pop-stagger', name: 'Pop Stagger', effect: 'pop-in', stagger: 200, start: 200, durationMs: 4600 },
  'slide-in': { id: 'slide-in', name: 'Slide In', effect: 'slide-left', stagger: 260, start: 260, durationMs: 5200 },
  'breathe': { id: 'breathe', name: 'Breathe', effect: 'fade-in', stagger: 130, start: 400, durationMs: 6000 },
  'ken-burns': { id: 'ken-burns', name: 'Ken Burns', effect: 'fade-in', stagger: 260, start: 300, durationMs: 6000 },
  'none': { id: 'none', name: 'Static', effect: 'none', stagger: 0, start: 0, durationMs: 2500 },
}

export const presetDuration = (presetId?: string): number =>
  (presetId && MOTION_PRESETS[presetId]?.durationMs) || 5000

/** Re-time + re-effect a template's beats for the chosen preset.
 * Falls back to the template's own beats/duration when no preset is set. */
export function applyPreset(
  beats: Beat[],
  durationMs: number,
  presetId?: string,
): { beats: Beat[]; durationMs: number } {
  const p = presetId ? MOTION_PRESETS[presetId] : undefined
  if (!p) return { beats, durationMs }
  const ordered = [...beats].sort((a, b) => a.atMs - b.atMs)
  const re = ordered.map((b, i) => ({ ...b, atMs: p.start + i * p.stagger, effect: p.effect }))
  return { beats: re, durationMs: p.durationMs }
}
