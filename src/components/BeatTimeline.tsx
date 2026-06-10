import type { LofiTemplate } from '../core/schemas'
import { SLOT_COLORS } from './ZoneCanvas'

/** Horizontal track showing when each slot animates in across the video duration. */
export function BeatTimeline({ template }: { template: LofiTemplate }) {
  const vg = template.videoGrammar
  const seconds = vg.durationMs / 1000

  return (
    <div className="beat-timeline">
      <div className="beat-track">
        {vg.beats.map((b) => (
          <div
            key={`${b.slot}-${b.atMs}`}
            className="beat-marker"
            style={{ left: `${(b.atMs / vg.durationMs) * 100}%`, background: SLOT_COLORS[b.slot] }}
            title={`${b.slot}: ${b.effect} @ ${(b.atMs / 1000).toFixed(1)}s`}
          >
            <span className="beat-label">
              {b.slot} {(b.atMs / 1000).toFixed(1)}s
            </span>
          </div>
        ))}
      </div>
      <div className="beat-meta">
        {seconds}s · {vg.fps}fps · {vg.loop ? 'looping' : 'plays once'} · reduced motion:{' '}
        {vg.reducedMotion}
      </div>
    </div>
  )
}
