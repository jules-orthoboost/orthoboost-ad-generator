import './template.css'
import type { CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Value Card — Dr. A. Joe (budget) V1/V4. Exact reproduction of the Figma frame:
 * a photo band, a white headline card with green-check value tags, and a big
 * offer lockup on the brand ground with a CTA pill. The blue gradient, white
 * card, checks, CTA pill and logo mark are the frame's own vector art (SVG); the
 * gradient + pill tint to each kit's brand/accent. Display = kit display font.
 */
const INK = '#15315a'
const MUTED = '#54708f'
const CTA_INK = '#0b2b44'
const CHIPS = ['$0 down', 'All ages', 'Fast start']

/** Mix a hex toward white (pct>0) or black (pct<0). */
const shade = (hex: string, pct: number): string => {
  const n = parseInt(hex.replace('#', ''), 16)
  const t = pct < 0 ? 0 : 255
  const p = Math.abs(pct) / 100
  const ch = (c: number) => Math.round((t - c) * p + c)
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255)
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

type P = { x: number; y: number; s: number; w?: number; lh?: number }
type Layout = {
  head1: P; head2: P; headMax: number; sub: P; chips: Array<{ x: number; y: number }>; chipS: number
  offerLabel: P; offer: P; offerUnit: P; offerFine: P; disc: P; cta: P
  logoName: P; logoTag: P; photoY: number; photoH: number
}
const POS: Record<'Post' | 'Story', Layout> = {
  Post: {
    head1: { x: 92, y: 862, s: 51 }, head2: { x: 92, y: 924, s: 51 }, headMax: 574,
    sub: { x: 92, y: 1005, s: 25, w: 660 },
    chips: [{ x: 120, y: 1073 }, { x: 288, y: 1073 }, { x: 468, y: 1073 }], chipS: 23,
    offerLabel: { x: 724, y: 824, s: 26 }, offer: { x: 715, y: 836, s: 138 },
    offerUnit: { x: 956, y: 924, s: 40 }, offerFine: { x: 724, y: 988, s: 24 },
    disc: { x: 724, y: 1023, s: 16 }, cta: { x: 724, y: 1089, s: 26, w: 300 },
    logoName: { x: 112, y: 1211, s: 30 }, logoTag: { x: 112, y: 1254, s: 17 },
    photoY: 0, photoH: 800,
  },
  Story: {
    head1: { x: 112, y: 168, s: 58 }, head2: { x: 112, y: 288, s: 58 }, headMax: 388,
    sub: { x: 120, y: 462, s: 25, w: 372 },
    chips: [{ x: 172, y: 555 }, { x: 180, y: 621 }, { x: 180, y: 687 }], chipS: 32,
    offerLabel: { x: 582, y: 150, s: 36 }, offer: { x: 573, y: 172, s: 192 },
    offerUnit: { x: 906, y: 315, s: 56 }, offerFine: { x: 582, y: 404, s: 33 },
    disc: { x: 577, y: 452, s: 22 }, cta: { x: 557, y: 594, s: 36, w: 377 },
    logoName: { x: 132, y: 808, s: 30 }, logoTag: { x: 132, y: 851, s: 17 },
    photoY: 920, photoH: 1000,
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const p = POS[size]
  const brand = tokens.brand
  const art = (size === 'Story' ? storyArt : postArt)
    .replaceAll('#3F8ED9', shade(brand, 16))
    .replaceAll('#2C74C2', brand)
    .replaceAll('#1D4F93', shade(brand, -26))
    .replaceAll('#16C2EC', tokens.accent)

  const abs = (o: { x: number; y: number }, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: o.x, top: o.y, ...extra,
  })
  const disp = (o: P, color: string, extra?: CSSProperties): CSSProperties =>
    abs(o, { fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: o.s, lineHeight: o.lh ?? 1, color, whiteSpace: 'nowrap', ...extra })

  const heads = (content.headline ?? '').split('\n')

  return (
    <div className={`jvc jvc-${size}`}>
      <div className="jvc-art" dangerouslySetInnerHTML={{ __html: art }} />

      {/* photo band */}
      <div className="jvc-photo" style={{ left: 0, top: p.photoY, width: 1080, height: p.photoH, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="jvc-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="jvc-photo-ph"><span>YOUR FAMILY PHOTO HERE</span></div>}
        <div className="jvc-photo-scrim" />
      </div>

      {/* headline card copy */}
      {heads[0] && <div style={disp(p.head1, INK, sty('headline', 'rise-in'))}>{heads[0]}</div>}
      {heads[1] && <div style={disp(p.head2, brand, sty('headline', 'rise-in'))}>{heads[1]}</div>}
      {content.subhead && (
        <div style={abs(p.sub, { width: p.sub.w, fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: p.sub.s, lineHeight: 1.2, color: MUTED, ...sty('subhead', 'rise-in') })}>{content.subhead}</div>
      )}
      {CHIPS.map((c, i) => (
        <div key={i} style={disp({ ...p.chips[i], s: p.chipS }, INK)}>{c}</div>
      ))}

      {/* offer lockup on brand ground */}
      {content.offerLabel && <div style={disp(p.offerLabel, 'rgba(255,255,255,0.85)')}>{content.offerLabel}</div>}
      {content.offer && <div style={disp(p.offer, '#ffffff', sty('offer', 'pop-in'))}>{content.offer}</div>}
      {content.offerUnit && <div style={disp(p.offerUnit, 'rgba(255,255,255,0.78)')}>{content.offerUnit}</div>}
      {content.offerFine && <div style={disp(p.offerFine, 'rgba(255,255,255,0.85)')}>{content.offerFine}</div>}
      {content.disclaimer && (
        <div style={abs(p.disc, { fontFamily: 'var(--body-font)', fontWeight: 400, fontSize: p.disc.s, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap' })}>{content.disclaimer}</div>
      )}
      {content.cta && (
        <div style={abs(p.cta, { width: p.cta.w, textAlign: 'center', fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: p.cta.s, color: CTA_INK, whiteSpace: 'nowrap', ...sty('cta', 'fade-in') })}>{content.cta}</div>
      )}

      {/* logo lockup (mark is baked art) */}
      <div style={disp(p.logoName, '#ffffff', sty('logo', 'fade-in'))}>{tokens.clientName}</div>
      {tokens.tagline && <div style={abs(p.logoTag, { fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: p.logoTag.s, color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap' })}>{tokens.tagline}</div>}
    </div>
  )
}
