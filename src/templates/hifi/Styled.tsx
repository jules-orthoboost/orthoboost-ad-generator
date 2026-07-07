import type { ReactNode } from 'react'

/**
 * Inline rich-text for template copy. The Figma designs mix weights and accent
 * colors INSIDE a text block ("precisely planned" in accent, "more comfort,"
 * bold, "smile" accented mid-headline) — flat strings flatten that hierarchy,
 * which was the most consistent defect in the 2026-07 Figma-fidelity audit.
 *
 * Copy strings may carry four markers (non-nested, unmatched markers render
 * literally):
 *
 *   **bold**   → <b class="st-b">        (font-weight: 700 default)
 *   *accent*   → <span class="st-a">     (color: var(--accent-text) default — AA-safe)
 *   _italic_   → <i class="st-i">
 *   ~light~    → <span class="st-l">     (font-weight: 400 + 78% opacity default)
 *
 * Templates opt in per field: `<Styled text={content.subhead} />`. Defaults live
 * in effects.css; a template can re-style .st-* within its own scope when the
 * design calls for something else (e.g. house headline: regular first line via
 * ~…~ against a bold block).
 */

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|~[^~]+~)/g

export function Styled({ text }: { text: string }): ReactNode {
  if (!text) return null
  if (!/[*_~]/.test(text)) return text // fast path: plain copy
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
          return <b className="st-b" key={i}>{part.slice(2, -2)}</b>
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
          return <span className="st-a" key={i}>{part.slice(1, -1)}</span>
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2)
          return <i className="st-i" key={i}>{part.slice(1, -1)}</i>
        if (part.startsWith('~') && part.endsWith('~') && part.length > 2)
          return <span className="st-l" key={i}>{part.slice(1, -1)}</span>
        return part
      })}
    </>
  )
}

/** The copy with markers stripped — for fit estimation, alt text, exports. */
export function plainText(text: string): string {
  if (!text) return ''
  return text.replace(TOKEN, (m) => {
    if (m.startsWith('**')) return m.slice(2, -2)
    return m.slice(1, -1)
  })
}
