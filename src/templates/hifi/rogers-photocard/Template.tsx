import './template.css'
import type { CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Rogers Photo Card — Dr. M. Rogers V4. Exact reproduction of the Figma frame:
 * a rounded family photo up top with the logo and a rating tab over it, then a
 * script accent, a two-line headline, a paragraph, a value pill and a CTA pill
 * on the warm cream ground. Offer pill + CTA pill + arrow are the frame's vector
 * art (SVG, accent/brand-tinted); the rating tab is a live white pill.
 */
const STAR = '#f0a830'
const SUB = '#41507e'
const CREAM = '#fdfaf3'

type P = { x: number; y: number; s: number; w?: number }
type Layout = {
  photo: { x: number; y: number; w: number; h: number }
  logo: { x: number; y: number; w: number; h: number }
  rating: { x: number; y: number; w: number; h: number; s: number }
  script: P; head1: P; head2: P; sub: P
  offer: { x: number; y: number; w: number; ty: number }
  cta: { ty: number }
}
const POS: Record<'Post' | 'Story', Layout> = {
  Post: {
    photo: { x: 64, y: 56, w: 952, h: 624 }, logo: { x: 88, y: 80, w: 246, h: 90 },
    rating: { x: 656, y: 80, w: 336, h: 62, s: 25 },
    script: { x: 88, y: 744, s: 48 }, head1: { x: 88, y: 806, s: 62 }, head2: { x: 88, y: 874, s: 62 },
    sub: { x: 88, y: 964, s: 26, w: 745 },
    offer: { x: 88, y: 1104, w: 538, ty: 1114 }, cta: { ty: 1198 },
  },
  Story: {
    photo: { x: 64, y: 120, w: 952, h: 900 }, logo: { x: 96, y: 152, w: 246, h: 90 },
    rating: { x: 656, y: 144, w: 336, h: 62, s: 25 },
    script: { x: 96, y: 1086, s: 48 }, head1: { x: 96, y: 1148, s: 62 }, head2: { x: 96, y: 1222, s: 62 },
    sub: { x: 96, y: 1324, s: 26, w: 780 },
    offer: { x: 88, y: 1470, w: 538, ty: 1481 }, cta: { ty: 1573 },
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
  const script = content.badge ?? 'loved by families'
  const heads = (content.headline ?? '').split('\n').filter(Boolean)
  const disp = (o: P, color: string, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: o.x, top: o.y, width: o.w, fontSize: o.s, color,
    fontFamily: 'var(--display-font)', fontWeight: 800, whiteSpace: 'nowrap', ...extra,
  })

  return (
    <div className={`rp rp-${size}`}>
      <div className="rp-art" dangerouslySetInnerHTML={{ __html: art }} />

      {/* framed family photo */}
      <div className="rp-photo" style={{ left: p.photo.x, top: p.photo.y, width: p.photo.w, height: p.photo.h, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="rp-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="rp-photo-ph"><span>FAMILY PHOTO</span></div>}
      </div>

      {logoUrl && <img className="rp-logo" src={logoUrl} alt="" style={{ left: p.logo.x, top: p.logo.y, width: p.logo.w, height: p.logo.h, ...sty('logo', 'fade-in') }} />}

      {/* rating tab (white pill over photo) */}
      <div className="rp-rating" style={{ left: p.rating.x, top: p.rating.y, width: p.rating.w, height: p.rating.h, fontSize: p.rating.s }}>
        <span style={{ color: STAR }}>★</span>&nbsp;<span style={{ color: brand }}>{rating}</span>
      </div>

      {/* copy */}
      <div className="rp-script" style={{ position: 'absolute', left: p.script.x, top: p.script.y, fontSize: p.script.s, color: tokens.accent }}>{script}</div>
      {heads[0] && <div style={disp(p.head1, brand, { lineHeight: 1, ...sty('headline', 'rise-in') })}>{heads[0]}</div>}
      {heads[1] && <div style={disp(p.head2, brand, { lineHeight: 1, ...sty('headline', 'rise-in') })}>{heads[1]}</div>}
      {content.subhead && (
        <div style={disp(p.sub, SUB, { fontWeight: 700, whiteSpace: 'normal', lineHeight: 1.3, ...sty('subhead', 'rise-in') })}>{content.subhead}</div>
      )}

      {content.offer && (
        <div style={{ position: 'absolute', left: p.offer.x, top: p.offer.ty, width: p.offer.w, textAlign: 'center', fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: 22, color: brand, whiteSpace: 'nowrap', ...sty('offer', 'pop-in') }}>{content.offer}</div>
      )}
      {content.cta && (
        <div style={{ position: 'absolute', left: 88, top: p.cta.ty, width: 316, textAlign: 'center', fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: 29, color: CREAM, whiteSpace: 'nowrap', ...sty('cta', 'pop-in') }}>{content.cta}</div>
      )}
    </div>
  )
}
