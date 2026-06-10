import { useEffect, useState } from 'react'
import type { Beat, Slot } from '../../core/schemas'

/** Map of slot -> whether its entrance beat has fired. */
export type RevealState = Partial<Record<Slot, boolean>>

function allShown(beats: Beat[]): RevealState {
  return Object.fromEntries(beats.map((b) => [b.slot, true]))
}

/**
 * Turns a beat track into per-slot reveal state for preview playback.
 * When reduced-motion or not playing, every slot is shown immediately (final frame).
 */
export function useBeats(beats: Beat[], playing: boolean, reducedMotion: boolean): RevealState {
  const final = allShown(beats)
  const [state, setState] = useState<RevealState>(reducedMotion || !playing ? final : {})

  useEffect(() => {
    if (reducedMotion || !playing) {
      setState(allShown(beats))
      return
    }
    setState({})
    const timers = beats.map((b) =>
      setTimeout(() => setState((s) => ({ ...s, [b.slot]: true })), b.atMs),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reducedMotion, JSON.stringify(beats)])

  return state
}
