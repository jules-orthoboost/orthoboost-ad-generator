import './template.css'
import type { CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Rogers Disc — Dr. M. Rogers (family-community) V5. Exact reproduction of the
 * Figma frame: a navy card on a warm cream ground, mint disc blobs, a framed
 * centre portrait with a tilted rating tab and an "AUG check-ups" badge, a script
 * accent over a two-line headline, three mint value pills and a "meet the team"
 * CTA. Card + pills + badge are the frame's own vector art (SVG); the card tints
 * to the kit brand and the mint elements to the kit accent.
 */
const HEAD = '#fffdf8'
const SUB = '#cdd8f2'
const STAR = '#f0a830'
const AUG_TOP = 'AUG'
const AUG_BOT = 'check-ups'

const shade = (hex: string, pct: number): string => {
  const n = parseInt(hex.replace('#', ''), 16)
  const t = pct < 0 ? 0 : 255
  const q = Math.abs(pct) / 100
  const ch = (c: number) => Math.round((t - c) * q + c)
  return '#' + ((1 << 24) + (ch((n >> 16) & 255) << 16) + (ch((n >> 8) & 255) << 8) + ch(n & 255)).toString(16).slice(1)
}

type P = { x: number; y: number; s: number; w?: number }
type Layout = {
  photo: { x: number; y: number; w: number; h: number; r: number }
  rating: P; augT: P; augB: P; script: P; head: P; headStep: number
  sub: P; subStep: number; propY: number; propS: number; propCx: number[]
  team: P; logo: { x: number; y: number; w: number; h: number }
}
const POS: Record<'Post' | 'Story', Layout> = {
  Post: {
    photo: { x: 314, y: 68, w: 452, h: 548, r: 136 },
    rating: { x: 143, y: 160, s: 22, w: 218 }, augT: { x: 744, y: 205, s: 30, w: 124 }, augB: { x: 744, y: 248, s: 17, w: 124 },
    script: { x: 354, y: 672, s: 52, w: 372 }, head: { x: 0, y: 726, s: 70, w: 1080 }, headStep: 72,
    sub: { x: 0, y: 900, s: 27, w: 1080 }, subStep: 36, propY: 1013, propS: 23, propCx: [213, 540, 867],
    team: { x: 358, y: 1116, s: 30, w: 294 }, logo: { x: 437, y: 1231, w: 206, h: 60 },
  },
  Story: {
    photo: { x: 314, y: 224, w: 452, h: 702, r: 136 },
    rating: { x: 143, y: 312, s: 22, w: 218 }, augT: { x: 744, y: 380, s: 30, w: 124 }, augB: { x: 744, y: 423, s: 17, w: 124 },
    script: { x: 354, y: 977, s: 52, w: 372 }, head: { x: 0, y: 1031, s: 70, w: 1080 }, headStep: 72,
    sub: { x: 0, y: 1205, s: 27, w: 1080 }, subStep: 36, propY: 1348, propS: 23, propCx: [213, 540, 867],
    team: { x: 358, y: 1461, s: 30, w: 294 }, logo: { x: 437, y: 1600, w: 206, h: 60 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, logoUrl, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const p = POS[size]
  const brand = tokens.brand
  const art = (size === 'Story' ? storyArt : postArt)
    .replaceAll('#2A4793', brand).replaceAll('#1B3168', shade(brand, -26))
    .replaceAll('#243F86', brand).replaceAll('#AED6C1', tokens.accent)

  const heads = (content.headline ?? '').split('\n').filter(Boolean)
  const subs = (content.subhead ?? '').split('\n').filter(Boolean)
  const props = tokens.valueProps.slice(0, 3)
  const rating = (content.rating ?? '4.9 · 600+ families').replace(/^★\s*/, '')
  const script = content.badge ?? 'the Stress-Free Way'

  const disp = (o: P, color: string, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', left: o.x, top: o.y, width: o.w, fontSize: o.s, color,
    fontFamily: 'var(--display-font)', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap', ...extra,
  })

  return (
    <div className={`rd rd-${size}`}>
      <div className="rd-art" dangerouslySetInnerHTML={{ __html: art }} />

      {/* framed portrait */}
      <div className="rd-photo" style={{ left: p.photo.x, top: p.photo.y, width: p.photo.w, height: p.photo.h, borderRadius: p.photo.r, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="rd-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="rd-photo-ph"><span>PORTRAIT</span></div>}
      </div>

      {/* tilted rating tab */}
      <div className="rd-rating" style={{ left: p.rating.x, top: p.rating.y, width: p.rating.w, fontSize: p.rating.s }}>
        <span style={{ color: STAR }}>★</span>&nbsp;<span style={{ color: brand }}>{rating}</span>
      </div>

      {/* AUG badge */}
      <div style={disp(p.augT, brand, { lineHeight: 1 })}>{AUG_TOP}</div>
      <div style={disp(p.augB, brand, { fontWeight: 700 })}>{AUG_BOT}</div>

      {/* script accent + headline */}
      <div style={disp(p.script, tokens.accent, { fontFamily: '"Caveat", cursive', fontWeight: 700, lineHeight: 1 })}>{script}</div>
      {heads.map((l, i) => (
        <div key={i} style={disp({ ...p.head, y: p.head.y + i * p.headStep }, HEAD, { lineHeight: 1, ...sty('headline', 'rise-in') })}>{l}</div>
      ))}
      {subs.map((l, i) => (
        <div key={i} style={disp({ ...p.sub, y: p.sub.y + i * p.subStep, s: p.sub.s }, SUB, { fontWeight: 700, ...sty('subhead', 'rise-in') })}>{l}</div>
      ))}

      {/* value pills */}
      {props.map((t, i) => (
        <div key={i} style={disp({ x: p.propCx[i] - 112, y: p.propY, s: p.propS, w: 224 }, brand, { overflow: 'hidden', textOverflow: 'ellipsis' })}>{t}</div>
      ))}

      {/* team CTA (arrow is baked art) */}
      {content.cta && <div style={disp(p.team, brand, sty('cta', 'pop-in'))}>{content.cta}</div>}

      {logoUrl && <img className="rd-logo" src={logoUrl} alt="" style={{ left: p.logo.x, top: p.logo.y, width: p.logo.w, height: p.logo.h, ...sty('logo', 'fade-in') }} />}
    </div>
  )
}
