export interface FitInput {
  text: string
  widthPx: number
  fontSizePx: number
  maxLines?: number
  /** mean glyph advance as a fraction of font size; ~0.52 for typical sans display */
  charWidthRatio?: number
}
export interface FitResult {
  fits: boolean
  lines: number
  charsPerLine: number
}

/** Greedy word-wrap line count; no DOM, deterministic. Drives content-step warnings + the gate. */
export function estimateFit({
  text,
  widthPx,
  fontSizePx,
  maxLines,
  charWidthRatio = 0.52,
}: FitInput): FitResult {
  const charsPerLine = Math.max(1, Math.floor(widthPx / (fontSizePx * charWidthRatio)))
  const words = text.trim().split(/\s+/).filter(Boolean)
  let lines = words.length === 0 ? 0 : 1
  let len = 0
  for (const w of words) {
    const add = (len === 0 ? 0 : 1) + w.length
    if (len + add > charsPerLine) {
      lines += 1
      len = w.length
    } else {
      len += add
    }
  }
  const fits = maxLines === undefined ? true : lines <= maxLines
  return { fits, lines, charsPerLine }
}
