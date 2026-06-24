// Pure WCAG 2.1 color math. No dependencies, no app imports, no side effects.

export interface Rgb {
  r: number
  g: number
  b: number
}

const clamp255 = (n: number): number => Math.max(0, Math.min(255, Math.round(n)))

/** Parse `#rgb` or `#rrggbb` (case-insensitive) into 0–255 channels. */
export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`invalid hex color: ${hex}`)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Channels (clamped) to lowercase `#rrggbb`. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = (n: number) => clamp255(n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/** WCAG 2.1 relative luminance (sRGB), 0–1. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio between two hex colors, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a))
  const lb = relativeLuminance(hexToRgb(b))
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** AA threshold: 3:1 for large/graphical, else 4.5:1. */
export function meetsAA(ratio: number, opts?: { large?: boolean }): boolean {
  return ratio >= (opts?.large ? 3 : 4.5)
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Returns a hex color guaranteed to meet WCAG 2.1 AA against `against`.
 *
 * Algorithm:
 * 1) If any palette color already passes, return the one with the highest contrast.
 * 2) Otherwise, pick the extreme (black or white) that has the *higher* contrast
 *    against `against` — this handles mid-tones like #777777 where black beats white —
 *    and linearly ramp the best-available starting color toward that extreme until
 *    AA is met. The endpoint is always guaranteed to pass, so this function never fails.
 */
export function pickLegibleColor(
  against: string,
  palette: string[],
  opts?: { large?: boolean },
): string {
  const passes = (c: string) => meetsAA(contrastRatio(c, against), opts)
  const better = (a: string, b: string) =>
    contrastRatio(a, against) >= contrastRatio(b, against) ? a : b

  const passing = palette.filter(passes)
  if (passing.length) return passing.reduce(better)

  // Choose the extreme (black or white) that has the higher contrast against `against`,
  // then ramp toward it. This handles edge cases like mid-gray #777777 where white
  // is closer in luminance than black — always pick the winning extreme.
  const blackRatio = contrastRatio(against, '#000000')
  const whiteRatio = contrastRatio(against, '#ffffff')
  const useWhite = whiteRatio >= blackRatio
  const target: Rgb = useWhite ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  const start = palette.length
    ? hexToRgb(palette.reduce(better))
    : hexToRgb(useWhite ? '#fafafa' : '#111111')

  for (let t = 0; t <= 1; t += 0.04) {
    const candidate = rgbToHex({
      r: lerp(start.r, target.r, t),
      g: lerp(start.g, target.g, t),
      b: lerp(start.b, target.b, t),
    })
    if (passes(candidate)) return candidate
  }
  return rgbToHex(target) // guaranteed-passing endpoint (defensive; loop normally returns first)
}
