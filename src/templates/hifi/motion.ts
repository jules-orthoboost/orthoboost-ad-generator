import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Beat, Slot } from '../../core/schemas'

export const REVEAL_MS = 620
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

/** Progress 0..1 of a slot's entrance at virtual time nowMs. Slots without a beat are always 1. */
export function slotProgress(beats: Beat[], slot: Slot, nowMs: number): number {
  const beat = beats.find((b) => b.slot === slot)
  if (!beat) return 1
  if (!isFinite(nowMs)) return 1
  const t = (nowMs - beat.atMs) / REVEAL_MS
  if (t <= 0) return 0
  if (t >= 1) return 1
  return easeOutQuint(t)
}

/** Inline style for an entrance effect at a given progress. Deterministic; no CSS transition. */
export function revealStyle(effect: Beat['effect'], progress: number): CSSProperties {
  const p = Math.max(0, Math.min(1, progress))
  const inv = 1 - p
  switch (effect) {
    case 'none':
      return { opacity: 1 }
    case 'fade-in':
      return { opacity: p, filter: inv > 0 ? `blur(${(inv * 6).toFixed(2)}px)` : 'none' }
    case 'rise-in':
      return { opacity: p, transform: inv > 0 ? `translateY(${(inv * 44).toFixed(2)}px)` : 'none' }
    case 'pop-in':
      return { opacity: p, transform: inv > 0 ? `scale(${(1 - inv * 0.14).toFixed(3)})` : 'none' }
    case 'slide-left':
      return { opacity: p, transform: inv > 0 ? `translateX(${(inv * 64).toFixed(2)}px)` : 'none' }
    case 'slide-right':
      return { opacity: p, transform: inv > 0 ? `translateX(${(-inv * 64).toFixed(2)}px)` : 'none' }
  }
}

/**
 * Virtual clock. When frameNowMs is provided (harness), it is returned verbatim — deterministic.
 * Otherwise: Infinity when not playing or reduced-motion (final frame); a rAF wall-clock when playing.
 */
export function useClock(playing: boolean, reducedMotion: boolean, frameNowMs?: number): number {
  const [now, setNow] = useState(frameNowMs ?? Infinity)
  const start = useRef<number | null>(null)
  useEffect(() => {
    if (frameNowMs !== undefined) {
      setNow(frameNowMs)
      return
    }
    if (!playing || reducedMotion) {
      setNow(Infinity)
      return
    }
    let raf = 0
    start.current = null
    const tick = (ts: number) => {
      if (start.current === null) start.current = ts
      setNow(ts - start.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, reducedMotion, frameNowMs])
  return now
}
