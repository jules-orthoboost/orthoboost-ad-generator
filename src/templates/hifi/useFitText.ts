import { useLayoutEffect, useRef } from 'react'

/**
 * Shrink a single line's font-size so it fits its width budget — never larger
 * than the element's own CSS size. Imperative (no state/re-render) so it is
 * deterministic for the render harness. Measures with `white-space: nowrap` so
 * `scrollWidth` is the true single-line width. Re-fits when `deps` change and
 * again once web fonts settle (glyph metrics shift on font swap).
 *
 * Budget = the element's own CSS `max-width` when set, otherwise its container's
 * width. So give a fitted element a `max-width` (the safe width) — or rely on a
 * width-constrained parent. Pair with `white-space: nowrap` (set by `<FitText>`).
 * Size sub-parts in `em` so they scale with the line (see joe-value-card price).
 */
export function useFitText<T extends HTMLElement>(deps: unknown[], min = 0.4) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = '' // reset to the CSS ceiling
      // Measure the true one-line width by letting the element shrink-wrap to its
      // content — a fixed width or `justify-content: center` otherwise hides the
      // overflow from scrollWidth and the text under-shrinks.
      el.style.maxWidth = 'none'
      el.style.width = 'auto'
      const base = parseFloat(getComputedStyle(el).fontSize) || 0
      const natural = el.scrollWidth
      el.style.width = ''
      el.style.maxWidth = ''
      // Budget: the element's own max-width when set, else its container's width.
      const max = parseFloat(getComputedStyle(el).maxWidth)
      const budget = Number.isFinite(max) ? max : el.parentElement?.clientWidth ?? 0
      if (base && budget && natural > budget) {
        el.style.fontSize = `${Math.max(min, budget / natural) * base}px`
      }
    }
    fit()
    if (document.fonts?.status === 'loading') document.fonts.ready.then(fit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
