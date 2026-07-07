import './template.css'
import type { ReactNode, CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import postSeal from './art.seal.post.svg?raw'
import storySeal from './art.seal.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Styled } from '../Styled'

/**
 * Family Portrait (Premium) — Dr. G. House. Exact reproduction of the v6
 * framed-family Figma frame: warm cream ground, corner blobs, tinted supporting
 * panel, CTA pill and trust stars are the frame's own vector art (SVG), tinted
 * to the kit brand/accent. The framed portrait sits in the middle (white mat via
 * CSS); the rating seal is a foreground layer over the photo's corner. Every
 * field is overlaid at its exact Figma coordinate. Post + Story.
 */
const COLORS: Record<string, string> = {
  ink: '#16282b', sub: '#eefafa', muted: '#46595d', cta: '#07313a', white: '#ffffff',
}

type P = { x: number; y: number; s?: number; c?: string; w?: number; center?: boolean; h?: number }
const POS: Record<'Post' | 'Story', Record<string, P>> = {
  Post: {
    head: { x: 550, y: 236, s: 62, w: 470 },
    sub: { x: 586, y: 584, s: 21, c: 'sub', w: 330 },
    offlabel: { x: 552, y: 770, s: 14, c: 'accent' }, offer: { x: 552, y: 793, s: 21, c: 'ink' },
    cta: { x: 590, y: 868, s: 21, c: 'cta' }, trust: { x: 658, y: 959, s: 17, c: 'muted' },
    sealNum: { x: 114, y: 300, s: 30, c: 'ink', w: 88, center: true },
    sealRev: { x: 114, y: 339, s: 10, c: 'muted', w: 88, center: true },
    logoTag: { x: 0, y: 1216, s: 16, c: 'muted', w: 1080, center: true },
    logo: { x: 0, y: 1150, h: 52 }, photo: { x: 72, y: 292, w: 448, h: 830 },
  },
  Story: {
    head: { x: 550, y: 532, s: 62, w: 470 },
    sub: { x: 586, y: 880, s: 21, c: 'sub', w: 330 },
    offlabel: { x: 552, y: 1066, s: 14, c: 'accent' }, offer: { x: 552, y: 1089, s: 21, c: 'ink' },
    cta: { x: 590, y: 1164, s: 21, c: 'cta' }, trust: { x: 658, y: 1255, s: 17, c: 'muted' },
    sealNum: { x: 114, y: 208, s: 30, c: 'ink', w: 88, center: true },
    sealRev: { x: 114, y: 247, s: 10, c: 'muted', w: 88, center: true },
    logoTag: { x: 0, y: 1676, s: 16, c: 'muted', w: 1080, center: true },
    logo: { x: 0, y: 1610, h: 52 }, photo: { x: 72, y: 200, w: 448, h: 1360 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const pos = POS[size]
  const col = (c?: string) => (c === 'accent' ? tokens.accent : COLORS[c ?? 'white'])
  const tint = (s: string) => s.replaceAll('#3BD3CC', tokens.brand).replaceAll('#128F88', tokens.accent)
  const art = tint(size === 'Story' ? storyArt : postArt)
  const seal = tint(size === 'Story' ? storySeal : postSeal)
  const hl = (content.headline ?? '').split('\n').filter(Boolean)

  const T = (p: P, node: ReactNode, opts: { display?: boolean; wrap?: boolean; slot?: Slot; weight?: number; fit?: boolean } = {}) => {
    const base: CSSProperties = {
      position: 'absolute', left: p.x, top: p.y, fontSize: p.s, lineHeight: 1.2,
      color: col(p.c), fontWeight: opts.weight ?? 700,
      fontFamily: opts.display === false ? 'var(--body-font)' : 'var(--display-font)',
      maxWidth: p.w, width: p.center || opts.wrap ? p.w : undefined,
      textAlign: p.center ? 'center' : 'left', whiteSpace: opts.wrap ? 'normal' : 'nowrap',
      ...(opts.slot ? sty(opts.slot, 'fade-in') : {}),
    }
    if (opts.fit && !opts.wrap)
      return <FitText as="div" style={base} deps={[node, size]}>{node}</FitText>
    return <div style={base}>{node}</div>
  }

  return (
    <div className={`hp hp-${size}`}>
      <div className="hp-art" dangerouslySetInnerHTML={{ __html: art }} />

      <div className="hp-photo" style={{ left: pos.photo.x, top: pos.photo.y, width: pos.photo.w, height: pos.photo.h, ...sty('photo', 'fade-in') }}>
        {content.photo
          ? <div className="hp-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
          : <div className="hp-photo-ph"><span>FAMILY / PATIENT PHOTO</span></div>}
      </div>

      <div className="hp-seal" style={sty('badge', 'pop-in')} dangerouslySetInnerHTML={{ __html: seal }} />
      {content.rating && T(pos.sealNum, content.rating, { display: false })}
      {T(pos.sealRev, '500+ REVIEWS', { display: false })}

      {/* hairline rule above the headline (Figma 2:119 / 43:42) */}
      <div className="hp-hair" style={{ left: pos.head.x, top: pos.head.y - 21, width: pos.head.w }} />

      {/* headline (last line accented) */}
      {hl.length > 0 && (
        <div style={{ position: 'absolute', left: pos.head.x, top: pos.head.y, fontFamily: 'var(--display-font)', fontWeight: 800, fontSize: pos.head.s, lineHeight: 1.08, letterSpacing: '-0.01em', color: COLORS.ink, ...sty('headline', 'rise-in') }}>
          {hl.map((l, i) => <div key={i} style={i === hl.length - 1 ? { color: tokens.accentText } : undefined}>{l}</div>)}
        </div>
      )}

      {/* benefit pill copy: Figma bolds only the lead-in line — markers in the
          copy pick the bold span; the block itself is regular weight */}
      {content.subhead && T(pos.sub, <Styled text={content.subhead} />, { display: false, wrap: true, slot: 'subhead', weight: 400 })}
      {content.offerLabel && T(pos.offlabel, content.offerLabel, { display: false, fit: true })}
      {content.offer && T(pos.offer, content.offer, { slot: 'offer', fit: true })}
      {content.cta && T(pos.cta, content.cta, { slot: 'cta', fit: true })}
      {content.socialProof && T(pos.trust, content.socialProof, { display: false, weight: 400, fit: true })}

      {/* logo lockup: the kit assets are white lockups tuned for dark grounds —
          on the cream footer we set the client name in ink instead (recipe §6) */}
      <div className="hp-lockup" style={{ top: pos.logo.y, ...sty('logo', 'fade-in') }}>{tokens.clientName}</div>
      {tokens.tagline && T(pos.logoTag, tokens.tagline, { display: false, weight: 400 })}
    </div>
  )
}
