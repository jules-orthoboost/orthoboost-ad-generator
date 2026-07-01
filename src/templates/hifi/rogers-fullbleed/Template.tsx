import './template.css'
import type { CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Rogers Full Bleed — Dr. M. Rogers V4. Exact reproduction of the Figma frame:
 * an edge-to-edge family photo up top with the logo and a rating tab over it,
 * then a sans tagline, a big two-line headline, a paragraph, a value pill and a
 * CTA pill on the warm cream ground below. Offer + CTA pills + arrow are the
 * frame's vector art (SVG, accent/brand-tinted); the rating tab is a live pill.
 */
const STAR = '#f0a830'
const SUB = '#41507e'
const CREAM = '#fdfaf3'

type P = { x: number; y: number; s: number; w?: number }
type Layout = {
  photo: { w: number; h: number }
  logo: { x: number; y: number; w: number; h: number }
  rating: { x: number; y: number; w: number; h: number; s: number }
  tag: P; head1: P; head2: P; sub: P
  offer: { x: number; y: number; w: number; ty: number }
  cta: { x: number; w: number; ty: number }
}
const POS: Record<'Post' | 'Story', Layout> = {
  Post: {
    photo: { w: 1080, h: 720 }, logo: { x: 72, y: 62, w: 246, h: 90 },
    rating: { x: 700, y: 72, w: 336, h: 62, s: 25 },
    tag: { x: 72, y: 796, s: 46 }, head1: { x: 72, y: 856, s: 62 }, head2: { x: 72, y: 924, s: 62 },
    sub: { x: 72, y: 1016, s: 26, w: 820 },
    offer: { x: 72, y: 1120, w: 560, ty: 1131 }, cta: { x: 72, w: 440, ty: 1224 },
  },
  Story: {
    photo: { w: 1080, h: 1050 }, logo: { x: 96, y: 152, w: 246, h: 90 },
    rating: { x: 660, y: 152, w: 336, h: 62, s: 25 },
    tag: { x: 96, y: 1068, s: 56 }, head1: { x: 96, y: 1132, s: 76 }, head2: { x: 96, y: 1212, s: 76 },
    sub: { x: 96, y: 1318, s: 30, w: 900 },
    offer: { x: 96, y: 1456, w: 610, ty: 1468 }, cta: { x: 96, w: 459, ty: 1583 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, logoUrl, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const p = POS[size]
  const brand = tokens.brand
  const art = (size === 'Story' ? storyArt : postArt).replaceAll('#AED6C1', tokens.accent).replaceAll('#243F86', brand)

  const rating = (content.rating ?? '4.9 · 600+ families').replace(/^★\s*/, '')
  const tag = content.badge ?? 'loved by local families'
  const heads = (content.headline ?? '').split('\n').filter(Boolean)
  const disp = (o: P, color: string, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: o.x, top: o.y, width: o.w, fontSize: o.s, color,
    fontFamily: 'var(--display-font)', fontWeight: 800, whiteSpace: 'nowrap', ...extra,
  })
  const ctaFont = size === 'Story' ? 35 : 30

  return (
    <div className={`rf rf-${size}`}>
      <div className="rf-art" dangerouslySetInnerHTML={{ __html: art }} />

      {/* edge-to-edge family photo */}
      <div className="rf-photo" style={{ left: 0, top: 0, width: p.photo.w, height: p.photo.h, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="rf-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="rf-photo-ph"><span>FAMILY PHOTO</span></div>}
      </div>

      {logoUrl && <img className="rf-logo" src={logoUrl} alt="" style={{ left: p.logo.x, top: p.logo.y, width: p.logo.w, height: p.logo.h, ...sty('logo', 'fade-in') }} />}

      <div className="rf-rating" style={{ left: p.rating.x, top: p.rating.y, width: p.rating.w, height: p.rating.h, fontSize: p.rating.s }}>
        <span style={{ color: STAR }}>★</span>&nbsp;<span style={{ color: brand }}>{rating}</span>
      </div>

      {/* copy on cream */}
      <div className="rf-tag" style={{ position: 'absolute', left: p.tag.x, top: p.tag.y, fontSize: p.tag.s, color: tokens.accent }}>{tag}</div>
      {heads[0] && <div style={disp(p.head1, brand, { lineHeight: 1, ...sty('headline', 'rise-in') })}>{heads[0]}</div>}
      {heads[1] && <div style={disp(p.head2, brand, { lineHeight: 1, ...sty('headline', 'rise-in') })}>{heads[1]}</div>}
      {content.subhead && (
        <div style={disp(p.sub, SUB, { whiteSpace: 'normal', lineHeight: 1.3, ...sty('subhead', 'rise-in') })}>{content.subhead}</div>
      )}

      {content.offer && (
        <div style={{ position: 'absolute', left: p.offer.x, top: p.offer.ty, width: p.offer.w, textAlign: 'center', fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: size === 'Story' ? 25 : 22, color: brand, whiteSpace: 'nowrap', ...sty('offer', 'pop-in') }}>{content.offer}</div>
      )}
      {content.cta && (
        <div style={{ position: 'absolute', left: p.cta.x, top: p.cta.ty, width: p.cta.w - 70, textAlign: 'center', fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: ctaFont, color: CREAM, whiteSpace: 'nowrap', ...sty('cta', 'pop-in') }}>{content.cta}</div>
      )}
    </div>
  )
}
