import './template.css'
import type { ReactNode, CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Spec Sheet (Authority) — Dr. C. Yang "ORTHO_DATA". Exact reproduction of the
 * surgical-phases Figma frame: the navy gradient ground and the accent step
 * icons are the frame's own vector art (exported to SVG), tinted to the kit
 * accent. Every editable field + the outcomes panel is overlaid at its exact
 * Figma coordinate; the client logo (baked as art in Figma) is overlaid from
 * the brand kit. Post + Story.
 */
const COLORS: Record<string, string> = {
  white: '#ffffff', eyebrow: '#c6d5ee', sub: '#cdd9ee', details: '#aebfd9',
  disc: '#9fb6dd', label: '#9fb6dd', review: '#cdd9ee',
}

type P = { x: number; y: number; s?: number; c?: string; w?: number; right?: boolean; h?: number }
const POS: Record<'Post' | 'Story', Record<string, P>> = {
  Post: {
    eyebrow: { x: 611, y: 132, s: 12, c: 'eyebrow', w: 405, right: true },
    h1: { x: 62, y: 230, s: 80 }, h2: { x: 62, y: 314, s: 80 }, h3: { x: 62, y: 398, s: 80, c: 'accent' },
    sub: { x: 64, y: 514, s: 30, c: 'sub', w: 566 },
    cta: { x: 142, y: 704, s: 24 },
    odet: { x: 64, y: 826, s: 24, c: 'details' }, offer: { x: 64, y: 860, s: 64, c: 'accent' },
    disc: { x: 64, y: 977, s: 16, c: 'disc', w: 540 },
    pRec: { x: 668, y: 747, s: 16, c: 'label' }, pQty: { x: 668, y: 768, s: 86, c: 'accent' },
    pRev: { x: 668, y: 887, s: 16, c: 'review', w: 320 },
    pQty2: { x: 668, y: 984, s: 40 }, pLbl2: { x: 668, y: 1042, s: 16, c: 'label' },
    pAvgL: { x: 668, y: 1106, s: 16, c: 'label' }, pAvgV: { x: 872, y: 1097, s: 22, w: 112, right: true },
    logo: { x: 64, y: 1052, s: 62 }, photo: { x: 636, y: 172, w: 380, h: 504 },
  },
  Story: {
    eyebrow: { x: 611, y: 132, s: 12, c: 'eyebrow', w: 405, right: true },
    h1: { x: 62, y: 260, s: 80 }, h2: { x: 62, y: 344, s: 80 }, h3: { x: 62, y: 428, s: 80, c: 'accent' },
    sub: { x: 64, y: 544, s: 30, c: 'sub', w: 566 },
    cta: { x: 142, y: 734, s: 24 },
    odet: { x: 64, y: 1146, s: 24, c: 'details' }, offer: { x: 64, y: 1180, s: 64, c: 'accent' },
    disc: { x: 64, y: 1297, s: 16, c: 'disc', w: 540 },
    pRec: { x: 668, y: 1087, s: 16, c: 'label' }, pQty: { x: 668, y: 1108, s: 86, c: 'accent' },
    pRev: { x: 668, y: 1227, s: 16, c: 'review', w: 320 },
    pQty2: { x: 668, y: 1324, s: 40 }, pLbl2: { x: 668, y: 1382, s: 16, c: 'label' },
    pAvgL: { x: 668, y: 1446, s: 16, c: 'label' }, pAvgV: { x: 872, y: 1437, s: 22, w: 112, right: true },
    logo: { x: 64, y: 1600, s: 62 }, photo: { x: 620, y: 172, w: 396, h: 560 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, logoUrl, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const pos = POS[size]
  const col = (c?: string) => (c === 'accent' ? tokens.accent : COLORS[c ?? 'white'])
  const art = (size === 'Story' ? storyArt : postArt).replaceAll('#2E6DFF', tokens.accent)

  const hl = (content.headline ?? '').split('\n')

  const T = (p: P, node: ReactNode, opts: { display?: boolean; wrap?: boolean; slot?: Slot } = {}) => {
    const base: CSSProperties = {
      position: 'absolute', left: p.x, top: p.y, fontSize: p.s, lineHeight: 1.05,
      color: col(p.c), fontWeight: 800,
      fontFamily: opts.display === false ? 'var(--body-font)' : 'var(--display-font)',
      maxWidth: p.w, textAlign: p.right ? 'right' : 'left',
      whiteSpace: opts.wrap ? 'normal' : 'nowrap',
      ...(opts.slot ? sty(opts.slot, 'fade-in') : {}),
    }
    if (opts.wrap) base.width = p.w
    if (p.right) base.width = p.w
    return <div style={base}>{node}</div>
  }

  return (
    <div className={`yss yss-${size}`}>
      <div className="yss-art" dangerouslySetInnerHTML={{ __html: art }} />

      {content.photo && (
        <div className="yss-photo" style={{ left: pos.photo.x, top: pos.photo.y, width: pos.photo.w, height: pos.photo.h, ...sty('photo', 'fade-in') }}>
          <div className="yss-photo-img" style={{ backgroundImage: `url(${content.photo})` }} />
        </div>
      )}

      {content.badge && T(pos.eyebrow, content.badge, { display: false })}

      {hl[0] && T(pos.h1, hl[0], { slot: 'headline' })}
      {hl[1] && T(pos.h2, hl[1], { slot: 'headline' })}
      {hl[2] && T(pos.h3, hl[2], { slot: 'headline' })}

      {content.subhead && T(pos.sub, content.subhead, { display: false, wrap: true, slot: 'subhead' })}

      {content.cta && T(pos.cta, content.cta, { slot: 'cta' })}

      {content.offerLabel && T(pos.odet, content.offerLabel, { display: false })}
      {content.offer && T(pos.offer, content.offer, { slot: 'offer' })}

      {content.disclaimer && T(pos.disc, content.disclaimer, { display: false, wrap: true })}

      {/* outcomes panel */}
      {content.rating && (
        <>
          {T(pos.pRec, 'WOULD RECOMMEND', { display: false })}
          {T(pos.pQty, content.rating, { slot: 'badge' })}
          {content.socialProof && T(pos.pRev, content.socialProof, { display: false, wrap: true })}
          {T(pos.pQty2, '4,200+')}
          {T(pos.pLbl2, 'smiles completed', { display: false })}
          {T(pos.pAvgL, 'avg. treatment', { display: false })}
          {T(pos.pAvgV, '13.5 mo', { display: false })}
        </>
      )}

      {/* client logo (baked in Figma; overlaid from the kit, white on navy) */}
      {logoUrl && <img className="yss-logo" src={logoUrl} alt="" style={{ left: pos.logo.x, top: pos.logo.y, height: pos.logo.s, ...sty('logo', 'fade-in') }} />}
    </div>
  )
}
