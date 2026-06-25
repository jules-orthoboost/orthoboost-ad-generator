import type { ReactNode } from 'react'
import type { ResolvedTokens } from '../../core/tokens'
import type { Range } from '../../core/schemas'
import { pickLegibleColor } from '../../core/contrast'

interface Props {
  text: string
  ranges?: Range[]
  tokens: ResolvedTokens
  /** Subtracted from each range's start/end — lets a per-line caller pass global offsets. */
  offset?: number
}

/**
 * Render `text` with the given character ranges wrapped in an accent highlight
 * (rounded-rect background + AA-legible text color). Ranges are clamped to the
 * string, sorted, and de-overlapped; out-of-range or empty ranges are ignored.
 */
export function Highlighted({ text, ranges, tokens, offset = 0 }: Props): ReactNode {
  if (!ranges || ranges.length === 0) return text
  const norm = ranges
    .map((r) => ({ start: Math.max(0, r.start - offset), end: Math.min(text.length, r.end - offset) }))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start - b.start)
  if (norm.length === 0) return text

  const hlColor = tokens.accent
  const textColor = pickLegibleColor(hlColor, [
    tokens.brand, tokens.ink, tokens.surface, tokens.accent, tokens.onBrand,
  ])

  const out: ReactNode[] = []
  let cursor = 0
  norm.forEach((r, i) => {
    const start = Math.max(r.start, cursor)
    if (start >= r.end) return // fully covered by a prior (overlapping) range
    if (start > cursor) out.push(text.slice(cursor, start))
    out.push(
      <mark
        key={i}
        style={{
          background: hlColor,
          color: textColor,
          borderRadius: '0.18em',
          padding: '0 0.1em',
          WebkitBoxDecorationBreak: 'clone',
          boxDecorationBreak: 'clone',
        }}
      >
        {text.slice(start, r.end)}
      </mark>,
    )
    cursor = r.end
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return out
}
