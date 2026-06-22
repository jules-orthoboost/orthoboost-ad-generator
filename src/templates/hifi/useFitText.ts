import { useLayoutEffect, useRef } from 'react'

/**
 * Shrink a single line's font-size so it fits its parent's width — never larger
 * than the element's own CSS size. Imperative (no state/re-render) so it is
 * deterministic for the render harness. Measures with `white-space: nowrap` so
 * `scrollWidth` is the true single-line width. Re-fits when `deps` change and
 * again once web fonts settle (glyph metrics shift on font swap).
 *
 * The element's CSS font-size is the ceiling; size sub-parts in `em` so they
 * scale with it. Pair with `white-space: nowrap` on the fitted element.
 */
export function useFitText<T extends HTMLElement>(deps: unknown[], min = 0.4) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    const fit = () => {
      el.style.fontSize = '' // reset to the CSS ceiling before measuring
      const base = parseFloat(getComputedStyle(el).fontSize) || 0
      const avail = parent.clientWidth
      const natural = el.scrollWidth
      if (base && avail && natural > avail) {
        el.style.fontSize = `${Math.max(min, avail / natural) * base}px`
      }
    }
    fit()
    if (document.fonts?.status === 'loading') document.fonts.ready.then(fit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
