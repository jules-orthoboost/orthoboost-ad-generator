import './template.css'
import type { ReactNode, CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import postCard from './art.card.post.svg?raw'
import storyCard from './art.card.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Styled } from '../Styled'

/**
 * Family Plan (Checklist) — Dr. G. House v5. Exact reproduction of the Figma
 * frame: teal ground + benefit-icon chips + CTA pill are the frame's vector art
 * (SVG, CTA tinted to kit brand); a family photo band sits on top, and a white
 * plan card is a foreground layer over the photo. Every field at exact coords.
 */
const COLORS: Record<string, string> = {
  white: '#ffffff', sub: '#cfeceb', cardInk: '#0e2b2b', ink: '#16282b', grey: '#5a6b6d', cta: '#07313a',
}
const CHECKLIST = ['Braces & clear aligners', 'Early-treatment exams', '3D digital scans', 'Flexible financing', 'Free first visit']

type P = { x: number; y: number; s?: number; c?: string; w?: number; right?: boolean; lh?: number }
const POS: Record<'Post' | 'Story', Record<string, P>> = {
  Post: {
    head: { x: 72, y: 900, s: 46, lh: 1.26 }, sub: { x: 72, y: 1095, s: 24, c: 'sub', w: 340, lh: 1.25 },
    title: { x: 596, y: 460, s: 50, c: 'cardInk', lh: 1.12 },
    check0: { x: 596, y: 616, s: 22 }, checkStep: { x: 0, y: 42, s: 0 },
    offlabel: { x: 596, y: 867, s: 13, c: 'cardInk' }, offer: { x: 596, y: 892, s: 40, c: 'cardInk' },
    offfine: { x: 808, y: 896, s: 13, c: 'cardInk', w: 200, lh: 1.35 }, allages: { x: 596, y: 945, s: 13, c: 'grey' },
    cta: { x: 735, y: 1051, s: 21, c: 'cta', right: true, w: 186 },
    logo: { x: 72, y: 1258, s: 52 }, photo: { x: 0, y: 0, w: 1080, s: 760 },
  },
  Story: {
    head: { x: 72, y: 1225, s: 52, lh: 1.26 }, sub: { x: 72, y: 1435, s: 27, c: 'sub', w: 380, lh: 1.25 },
    title: { x: 596, y: 800, s: 50, c: 'cardInk', lh: 1.12 },
    check0: { x: 596, y: 956, s: 22 }, checkStep: { x: 0, y: 42, s: 0 },
    offlabel: { x: 596, y: 1207, s: 13, c: 'cardInk' }, offer: { x: 596, y: 1232, s: 40, c: 'cardInk' },
    offfine: { x: 808, y: 1236, s: 13, c: 'cardInk', w: 200, lh: 1.35 }, allages: { x: 596, y: 1285, s: 13, c: 'grey' },
    cta: { x: 735, y: 1391, s: 21, c: 'cta', right: true, w: 186 },
    logo: { x: 72, y: 1598, s: 52 }, photo: { x: 0, y: 0, w: 1080, s: 1100 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, logoUrl, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const pos = POS[size]
  const col = (c?: string) => (c === 'accent' ? tokens.accent : COLORS[c ?? 'white'])
  const tint = (s: string) => s.replaceAll('#3BD3CC', tokens.brand)
  const art = tint(size === 'Story' ? storyArt : postArt)
  const card = size === 'Story' ? storyCard : postCard

  const T = (p: P, node: ReactNode, opts: { display?: boolean; wrap?: boolean; slot?: Slot; fit?: boolean } = {}) => {
    const base: CSSProperties = {
      position: 'absolute', left: p.x, top: p.y, fontSize: p.s, lineHeight: p.lh ?? 1.2,
      color: col(p.c), fontWeight: 700,
      fontFamily: opts.display === false ? 'var(--body-font)' : 'var(--display-font)',
      maxWidth: p.w, width: p.right || opts.wrap ? p.w : undefined,
      textAlign: p.right ? 'right' : 'left', whiteSpace: opts.wrap ? 'normal' : 'nowrap',
      ...(opts.slot ? sty(opts.slot, 'fade-in') : {}),
    }
    if (opts.fit && !opts.wrap)
      return <FitText as="div" style={base} deps={[node, size]}>{node}</FitText>
    return <div style={base}>{node}</div>
  }
  const lines = (v: string | undefined) => (v ?? '').split('\n').filter(Boolean)

  return (
    <div className={`hfp hfp-${size}`}>
      <div className="hfp-art" dangerouslySetInnerHTML={{ __html: art }} />

      <div className="hfp-photo" style={{ left: pos.photo.x, top: pos.photo.y, width: pos.photo.w, height: pos.photo.s, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="hfp-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="hfp-photo-ph"><span>FAMILY PHOTO</span></div>}
        <div className="hfp-photo-scrim" />
        {/* Figma 2:160: dark scrim across the photo's top edge */}
        <div className="hfp-photo-scrim-top" />
      </div>

      <div className="hfp-card" dangerouslySetInnerHTML={{ __html: card }} />

      {/* teal-section copy */}
      <div style={{ position: 'absolute', left: pos.head.x, top: pos.head.y, fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: pos.head.s, lineHeight: pos.head.lh, color: '#fff', ...sty('headline', 'rise-in') }}>
        {lines(content.headline).map((l, i) => <div key={i}><Styled text={l} /></div>)}
      </div>
      {content.subhead && (
        <div style={{ position: 'absolute', left: pos.sub.x, top: pos.sub.y, width: pos.sub.w, fontFamily: 'var(--body-font)', fontWeight: 600, fontSize: pos.sub.s, lineHeight: pos.sub.lh, color: COLORS.sub, ...sty('subhead', 'rise-in') }}>
          {lines(content.subhead).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* plan card copy */}
      {content.badge && (
        <div style={{ position: 'absolute', left: pos.title.x, top: pos.title.y, fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: pos.title.s, lineHeight: pos.title.lh, color: COLORS.cardInk, ...sty('badge', 'fade-in') }}>
          {lines(content.badge).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
      <ul className="hfp-checks" style={{ left: pos.check0.x, top: pos.check0.y, fontSize: pos.check0.s }}>
        {CHECKLIST.map((c, i) => (
          <li key={i}><span className="hfp-check" style={{ color: tokens.accent }}>✓</span>{c}</li>
        ))}
      </ul>
      {content.offerLabel && T(pos.offlabel, content.offerLabel, { display: false, fit: true })}
      {content.offer && T(pos.offer, content.offer, { slot: 'offer', fit: true })}
      {content.offerFine && (
        <div style={{ position: 'absolute', left: pos.offfine.x, top: pos.offfine.y, width: pos.offfine.w, fontFamily: 'var(--body-font)', fontWeight: 700, fontSize: pos.offfine.s, lineHeight: pos.offfine.lh, color: COLORS.cardInk }}>
          {lines(content.offerFine).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
      {content.disclaimer && T(pos.allages, content.disclaimer, { display: false })}

      {content.cta && T(pos.cta, content.cta, { slot: 'cta', fit: true })}

      {logoUrl && (
        <div style={{ position: 'absolute', left: pos.logo.x, top: pos.logo.y, ...sty('logo', 'fade-in') }}>
          <img className="hfp-logo" src={logoUrl} alt="" style={{ position: 'static', height: pos.logo.s }} />
        </div>
      )}
    </div>
  )
}
