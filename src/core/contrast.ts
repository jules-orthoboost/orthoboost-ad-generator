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

export interface Hsl {
  h: number // 0–360
  s: number // 0–1
  l: number // 0–1
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
  else if (max === gn) h = ((bn - rn) / d + 2) * 60
  else h = ((rn - gn) / d + 4) * 60
  return { h, s, l }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const v = clamp255(l * 255)
    return { r: v, g: v, b: v }
  }
  const hue = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hn = h / 360
  return {
    r: clamp255(hue(p, q, hn + 1 / 3) * 255),
    g: clamp255(hue(p, q, hn) * 255),
    b: clamp255(hue(p, q, hn - 1 / 3) * 255),
  }
}

/**
 * Returns `color` unchanged when it already meets AA against `against`;
 * otherwise walks the color's HSL *lightness* (hue and saturation kept) toward
 * whichever extreme raises contrast, and returns the first passing step — i.e.
 * the AA-passing shade closest to the brand color. Falls back to the opposite
 * direction, then black/white, so it never returns a failing color.
 */
export function ensureAAPreserveHue(
  color: string,
  against: string,
  opts?: { large?: boolean },
): string {
  const passes = (c: string) => meetsAA(contrastRatio(c, against), opts)
  if (passes(color)) return color
  const { h, s, l } = rgbToHsl(hexToRgb(color))
  // Light backgrounds need darker text and vice versa.
  const darken = relativeLuminance(hexToRgb(against)) >= 0.18 // ≈ mid-tone cutoff
  const walk = (dir: -1 | 1): string | null => {
    for (let i = 1; i <= 100; i++) {
      const nl = l + dir * (i / 100)
      if (nl < 0 || nl > 1) return null
      const c = rgbToHex(hslToRgb({ h, s, l: nl }))
      if (passes(c)) return c
    }
    return null
  }
  return (
    walk(darken ? -1 : 1) ??
    walk(darken ? 1 : -1) ??
    (darken ? '#000000' : '#ffffff')
  )
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
  // Higher contrast wins; ties resolve to `a` (first occurrence / earliest palette entry).
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
