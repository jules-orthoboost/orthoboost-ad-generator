import './template.css'
import type { CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Editorial (Luxury) — D. K. Kardashian v1-season. Exact reproduction of the
 * Figma frame: an ivory sheet (#F4F1EC) with a full-height portrait on the
 * right and a serif editorial column on the left. The accent swash under the
 * headline, the benefit diamonds and the CTA rule are the frame's own vector
 * art (SVG, tinted to the kit accent); every field sits at its exact Figma
 * coordinate. Serif = kit display font, body copy = kit body font.
 */
const C = { ink: '#1c1a17', sub: '#4f493f', quote: '#3a3340', muted: '#6f685c' }

type P = { x: number; y: number; s: number; lh?: number; w?: number }
type Layout = {
  logo: P; head: P; sub: P; ben0: P; offer: P; cta: P; avatar: P; quote: P; rev1: P; rev2: P; fine: P
  photoX: number; photoW: number; photoH: number
}
const POS: Record<'Post' | 'Story', Layout> = {
  Post: {
    logo: { x: 80, y: 82, s: 72 }, head: { x: 80, y: 195, s: 97, lh: 0.866 },
    sub: { x: 80, y: 522, s: 24, lh: 1.375, w: 420 },
    ben0: { x: 108, y: 685, s: 22 }, offer: { x: 80, y: 875, s: 31 },
    cta: { x: 80, y: 958, s: 16 }, avatar: { x: 80, y: 1092, s: 56 },
    quote: { x: 152, y: 1086, s: 23, lh: 1.2, w: 220 },
    rev1: { x: 80, y: 1169, s: 15 }, rev2: { x: 80, y: 1198, s: 11 },
    fine: { x: 80, y: 1292, s: 12 },
    photoX: 520, photoW: 560, photoH: 1350,
  },
  Story: {
    logo: { x: 80, y: 346, s: 72 }, head: { x: 80, y: 459, s: 97, lh: 0.866 },
    sub: { x: 80, y: 786, s: 24, lh: 1.375, w: 420 },
    ben0: { x: 108, y: 949, s: 22 }, offer: { x: 80, y: 1139, s: 31 },
    cta: { x: 80, y: 1222, s: 16 }, avatar: { x: 80, y: 1356, s: 56 },
    quote: { x: 152, y: 1350, s: 23, lh: 1.2, w: 220 },
    rev1: { x: 80, y: 1433, s: 15 }, rev2: { x: 80, y: 1462, s: 11 },
    fine: { x: 80, y: 1556, s: 12 },
    photoX: 520, photoW: 560, photoH: 1920,
  },
}
const BEN_STEP = 60

export const Component: HifiTemplateComponent = ({
  size, content, tokens, logoUrl, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const p = POS[size]
  const art = (size === 'Story' ? storyArt : postArt).replaceAll('#866AA7', tokens.accent)

  const headLines = (content.headline ?? '').split('\n').filter(Boolean)
  const benefits = tokens.valueProps.slice(0, 3)
  const ratingParts = (content.rating ?? '').split('·').map((s) => s.trim())
  const abs = (o: P, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: o.x, top: o.y, ...extra,
  })

  return (
    <div className={`ke ke-${size}`}>
      <div className="ke-art" dangerouslySetInnerHTML={{ __html: art }} />

      {/* full-height portrait, right column */}
      <div className="ke-photo" style={{ left: p.photoX, top: 0, width: p.photoW, height: p.photoH, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="ke-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="ke-photo-ph"><span>PORTRAIT</span></div>}
      </div>

      {logoUrl && <img className="ke-logo" src={logoUrl} alt="" style={abs(p.logo, { height: p.logo.s, ...sty('logo', 'fade-in') })} />}

      {/* serif headline — final word set in accent italic */}
      {headLines.length > 0 && (
        <h1 className="ke-head" style={abs(p.head, { fontSize: p.head.s, lineHeight: p.head.lh, color: C.ink, ...sty('headline', 'rise-in') })}>
          {headLines.map((line, i) => {
            const last = i === headLines.length - 1
            if (!last) return <span key={i} className="ke-head-line">{line}</span>
            const words = line.split(' ')
            const tail = words.pop() ?? ''
            const head = words.join(' ')
            return (
              <span key={i} className="ke-head-line">
                {head ? head + ' ' : ''}<span className="ke-head-accent" style={{ color: tokens.accent }}>{tail}</span>
              </span>
            )
          })}
        </h1>
      )}

      {content.subhead && (
        <p className="ke-sub" style={abs(p.sub, { width: p.sub.w, fontSize: p.sub.s, lineHeight: p.sub.lh, color: C.sub, ...sty('subhead', 'rise-in') })}>
          {content.subhead.split('\n').map((l, i) => <span key={i}>{l}</span>)}
        </p>
      )}

      {benefits.map((b, i) => (
        <div key={i} className="ke-benefit" style={abs({ ...p.ben0, y: p.ben0.y + i * BEN_STEP }, { fontSize: p.ben0.s, color: C.ink })}>{b}</div>
      ))}

      {content.offer && (
        <div className="ke-offer" style={abs(p.offer, { fontSize: p.offer.s, color: tokens.accent, ...sty('offer', 'fade-in') })}>{content.offer}</div>
      )}

      {content.cta && (
        <div className="ke-cta" style={abs(p.cta, { fontSize: p.cta.s, color: C.ink, ...sty('cta', 'fade-in') })}>{content.cta}</div>
      )}

      {/* social proof */}
      {(content.socialProof || content.rating) && (
        <>
          <div className="ke-avatar" style={abs(p.avatar, { width: p.avatar.s, height: p.avatar.s, borderColor: tokens.accent })} />
          {content.socialProof && (
            <div className="ke-quote" style={abs(p.quote, { width: p.quote.w, fontSize: p.quote.s, lineHeight: p.quote.lh, color: C.quote })}>
              {`“${content.socialProof.replace(/^[“"]|[”"]$/g, '')}”`}
            </div>
          )}
          {ratingParts[0] && (
            <div className="ke-rev1" style={abs(p.rev1, { fontSize: p.rev1.s })}>
              <span className="ke-stars" style={{ color: tokens.accent }}>{'★★★★★'}</span>
              <span className="ke-rev-val" style={{ color: C.muted }}>{ratingParts[0]}</span>
            </div>
          )}
          {ratingParts[1] && (
            <div className="ke-rev2" style={abs(p.rev2, { fontSize: p.rev2.s, color: C.muted })}>{`FROM ${ratingParts[1].toUpperCase()}`}</div>
          )}
        </>
      )}

      {content.disclaimer && (
        <div className="ke-fine" style={abs(p.fine, { fontSize: p.fine.s, color: C.muted })}>{content.disclaimer}</div>
      )}
    </div>
  )
}
