import './template.css'
import type { CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'

/**
 * Glow (Full-bleed) — D. K. Kardashian v2-glow. Exact reproduction of the Figma
 * frame: a portrait fills the frame under baked legibility gradients; the accent
 * swash under the headline, the review divider and the circular-arrow CTA are
 * the frame's own vector art (SVG, accent-tinted). Service chips and the offer
 * pill are rendered live so they flex to each kit's value props. Serif = kit
 * display font, body copy = kit body font; text is light over the image.
 */
const NEAR_WHITE = '#f6f2ee'
const SOFT_WHITE = '#f3ece4'

type P = { x: number; y: number; s: number; lh?: number }
type Layout = {
  logo: P; head: P; sub: P; chipsY: number; offerY: number; reviewY: number; cta: P
}
const POS: Record<'Post' | 'Story', Layout> = {
  Post: {
    logo: { x: 72, y: 82, s: 68 }, head: { x: 70, y: 688, s: 112, lh: 0.84 },
    sub: { x: 72, y: 932, s: 22 }, chipsY: 992, offerY: 1078, reviewY: 1157,
    cta: { x: 113, y: 1249, s: 17 },
  },
  Story: {
    logo: { x: 72, y: 110, s: 68 }, head: { x: 70, y: 1038, s: 112, lh: 0.84 },
    sub: { x: 72, y: 1288, s: 22 }, chipsY: 1348, offerY: 1434, reviewY: 1513,
    cta: { x: 113, y: 1605, s: 17 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, logoUrl, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const p = POS[size]
  const art = (size === 'Story' ? storyArt : postArt).replaceAll('#DACEE5', tokens.accent)

  const headLines = (content.headline ?? '').split('\n').filter(Boolean)
  const chips = tokens.valueProps.slice(0, 3)
  const abs = (o: { x: number; y: number }, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: o.x, top: o.y, ...extra,
  })

  return (
    <div className={`keg keg-${size}`}>
      {content.photo
        ? <div className="keg-photo" style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }} />
        : <div className="keg-photo-ph" style={sty('photo', 'fade-in')}><span>PORTRAIT</span></div>}

      <div className="keg-art" dangerouslySetInnerHTML={{ __html: art }} />

      {logoUrl && <img className="keg-logo" src={logoUrl} alt="" style={abs(p.logo, { height: p.logo.s, ...sty('logo', 'fade-in') })} />}

      {headLines.length > 0 && (
        <h1 className="keg-head" style={abs(p.head, { fontSize: p.head.s, lineHeight: p.head.lh, color: NEAR_WHITE, ...sty('headline', 'rise-in') })}>
          {headLines.map((l, i) => <span key={i}>{l}</span>)}
        </h1>
      )}

      {content.subhead && (
        <p className="keg-sub" style={abs(p.sub, { fontSize: p.sub.s, color: SOFT_WHITE, ...sty('subhead', 'rise-in') })}>{content.subhead}</p>
      )}

      {chips.length > 0 && (
        <div className="keg-chips" style={abs({ x: 72, y: p.chipsY })}>
          {chips.map((c, i) => (
            <span key={i} className="keg-chip">
              <FitText as="span" deps={[c, size]} style={{ maxWidth: 233 }}>{c}</FitText>
            </span>
          ))}
        </div>
      )}

      {content.offer && (
        <div className="keg-offer" style={abs({ x: 72, y: p.offerY }, sty('offer', 'fade-in'))}>
          <span className="keg-offer-pill" style={{ background: tokens.accent, color: tokens.onAccent }}>{content.offer}</span>
          {content.offerFine && <span className="keg-offer-fine" style={{ color: SOFT_WHITE }}>{content.offerFine}</span>}
        </div>
      )}

      {(content.rating || content.socialProof) && (
        <div className="keg-review" style={abs({ x: 72, y: p.reviewY })}>
          <span className="keg-stars" style={{ color: tokens.accent }}>{'★★★★★'}</span>
          {content.rating && <span className="keg-review-val" style={{ color: '#ede4da' }}>{content.rating}</span>}
        </div>
      )}

      {content.cta && (
        <div className="keg-cta" style={abs(p.cta, { fontSize: p.cta.s, color: NEAR_WHITE, ...sty('cta', 'fade-in') })}>{content.cta}</div>
      )}
    </div>
  )
}
