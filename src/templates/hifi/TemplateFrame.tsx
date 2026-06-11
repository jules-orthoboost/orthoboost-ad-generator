import type { CSSProperties, ReactNode } from 'react'
import { CANVAS, type SizeKey } from '../../core/schemas'
import type { ResolvedTokens } from '../../core/tokens'

interface Props {
  size: SizeKey
  tokens: ResolvedTokens
  /** Target rendered height in px; the canvas scales to fit. Omit for 1:1 (harness). */
  fitHeight?: number
  children: ReactNode
}

/**
 * Renders a hi-fi template into an exact-pixel Meta canvas, injects brand-kit
 * CSS variables, and scales the whole box to fit a target height for preview.
 * The Phase 4 render harness mounts the same frame at 1:1 (omit fitHeight).
 */
export function TemplateFrame({ size, tokens, fitHeight, children }: Props) {
  const canvas = CANVAS[size]
  const scale = fitHeight ? fitHeight / canvas.h : 1
  return (
    <div className="tpl-frame-outer" style={{ width: canvas.w * scale, height: canvas.h * scale }}>
      <div
        className="tpl-frame"
        style={{
          width: canvas.w,
          height: canvas.h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ...(tokens.cssVars as CSSProperties),
        }}
        data-size={size}
      >
        {children}
      </div>
    </div>
  )
}
