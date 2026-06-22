import { createElement } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useFitText } from './useFitText'

/**
 * The standard way to render single-line variable text in a template (CTA,
 * offer, price, eyebrow). Renders one element, keeps it on one line, and shrinks
 * its font-size to fit its width budget — the element's CSS `max-width`, or its
 * container's width when no `max-width` is set. So the text can never run off
 * the canvas, whatever the user types.
 *
 *   <FitText as="span" className="hbc-cta" deps={[content.cta, size]}>{content.cta}</FitText>
 *
 * Give the target class a `max-width` (the safe width) unless its parent is
 * already the right budget. `deps` should list every value that changes the text
 * (the content field + `size`). For nested sizing (a price + unit), size the
 * sub-parts in `em`.
 */
export function FitText({
  children,
  deps,
  as = 'span',
  className,
  style,
  min,
}: {
  children: ReactNode
  /** Re-fit when these change — the text field(s) plus `size`. */
  deps: unknown[]
  as?: ElementType
  className?: string
  style?: CSSProperties
  min?: number
}) {
  const ref = useFitText<HTMLElement>(deps, min)
  return createElement(as, { ref, className, style: { whiteSpace: 'nowrap', ...style } }, children)
}
