import { useLayoutEffect, useRef } from 'react'

/**
 * Shrink a single line's font-size so it fits its width budget — never larger
 * than the author's size. Imperative (no state/re-render) so it is
 * deterministic for the render harness. Measures with `white-space: nowrap` so
 * `scrollWidth` is the true single-line width. Re-fits when `deps` change and
 * again once web fonts settle (glyph metrics shift on font swap).
 *
 * The author's size and width budget may come from EITHER the CSS class OR
 * inline styles (SVG-exact overlays position text with inline font-size /
 * max-width at exact Figma coords). The hook captures the authored inline
 * values on first run and restores them — never clears to '' — so a fitted
 * element keeps its design size when the text fits. (Clearing to '' was the
 * old bug: inline-sized text collapsed to the inherited 16px and rendered
 * tiny in the static render.)
 *
 * Budget = the element's CSS/inline `max-width` when set, otherwise its
 * container's width. Size sub-parts in `em` so they scale with the line (see
 * joe-value-card price).
 */
export function useFitText<T extends HTMLElement>(deps: unknown[], min = 0.4) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Authored inline values, captured once (before any fit has overwritten them).
    if (el.dataset.fitFontSize === undefined) el.dataset.fitFontSize = el.style.fontSize
    if (el.dataset.fitMaxWidth === undefined) el.dataset.fitMaxWidth = el.style.maxWidth
    const authoredSize = el.dataset.fitFontSize
    const authoredMaxW = el.dataset.fitMaxWidth
    const fit = () => {
      el.style.fontSize = authoredSize ?? '' // back to the author's ceiling
      // Measure the true one-line width by letting the element shrink-wrap to its
      // content — a fixed width or `justify-content: center` otherwise hides the
      // overflow from scrollWidth and the text under-shrinks.
      el.style.maxWidth = 'none'
      el.style.width = 'auto'
      const base = parseFloat(getComputedStyle(el).fontSize) || 0
      const natural = el.scrollWidth
      el.style.width = ''
      el.style.maxWidth = authoredMaxW ?? ''
      // Budget: the element's own max-width when set, else its container's width.
      const max = parseFloat(getComputedStyle(el).maxWidth)
      const budget = Number.isFinite(max) ? max : el.parentElement?.clientWidth ?? 0
      if (base && budget && natural > budget) {
        el.style.fontSize = `${Math.max(min, budget / natural) * base}px`
      }
    }
    fit()
    // Always re-fit once fonts settle — at effect time the @import/@font-face
    // requests may not have STARTED yet, so checking fonts.status is not enough.
    document.fonts?.ready.then(fit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
