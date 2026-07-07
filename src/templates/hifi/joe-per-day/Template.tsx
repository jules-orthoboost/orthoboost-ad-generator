import './template.css'
import type { ReactNode, CSSProperties } from 'react'
import postArt from './art.post.svg?raw'
import storyArt from './art.story.svg?raw'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Styled } from '../Styled'

/**
 * Per-Day Price (Budget) — Dr. A. Joe. Exact reproduction of the V3 Figma design:
 * the background gradient, corner blobs, photo scrim, cyan CTA/eyebrow chips,
 * value-prop checks and footer bar are the frame's own vector art (exported to
 * SVG), tinted to the brand kit's accent. Every editable field is overlaid at its
 * exact Figma coordinate; the price is the composed lockup so it never bleeds.
 */
const COLORS: Record<string, string> = {
  white: '#ffffff', light: '#cfe3f7', mute: '#6b8099', ink: '#13315a', faint: '#93a3b8', photoTag: '#3c6699',
}

type P = { x: number; y: number; s: number; c?: string; w?: number; center?: boolean }
const POS: Record<'Post' | 'Story', Record<string, P>> = {
  Post: {
    hl1: { x: 56, y: 256, s: 55 }, hl2: { x: 56, y: 320, s: 55 }, hl3: { x: 56, y: 374, s: 55, c: 'light' },
    cur: { x: 56, y: 540, s: 48 }, big: { x: 92, y: 444, s: 168, c: 'accent' },
    cents: { x: 232, y: 474, s: 54 }, unit: { x: 232, y: 554, s: 34, c: 'light' },
    sub: { x: 56, y: 662, s: 24, w: 360 },
    cta: { x: 128, y: 792, s: 29, w: 210 },
    vp1: { x: 90, y: 895, s: 23, w: 300 }, vp2: { x: 90, y: 941, s: 23, w: 300 }, vp3: { x: 90, y: 987, s: 23, w: 300 },
    logoName: { x: 112, y: 1202, s: 26, c: 'ink' }, logoTag: { x: 112, y: 1240, s: 15, c: 'mute' },
    photoTag: { x: 620, y: 746, s: 21, w: 300, c: 'photoTag', center: true },
    f1a: { x: 514, y: 1206, s: 14, c: 'mute' }, f1b: { x: 514, y: 1225, s: 20, c: 'ink' },
    f2a: { x: 804, y: 1206, s: 14, c: 'mute' }, f2b: { x: 804, y: 1227, s: 18, c: 'ink' },
    disc: { x: 343, y: 1272, s: 13, w: 394, c: 'faint', center: true },
    photo: { x: 440, y: 0, w: 640, s: 0 },
    bar: { x: 32, y: 1170, w: 1016, s: 0 },
  },
  Story: {
    hl1: { x: 700, y: 335, s: 55 }, hl2: { x: 700, y: 399, s: 55 }, hl3: { x: 700, y: 453, s: 55, c: 'light' },
    cur: { x: 700, y: 643, s: 48 }, big: { x: 736, y: 547, s: 168, c: 'accent' },
    cents: { x: 876, y: 577, s: 54 }, unit: { x: 876, y: 657, s: 34, c: 'light' },
    sub: { x: 707, y: 772, s: 28, w: 300 },
    cta: { x: 772, y: 1074, s: 29, w: 210 },
    vp1: { x: 747, y: 1217, s: 32, w: 300 }, vp2: { x: 747, y: 1281, s: 32, w: 300 }, vp3: { x: 747, y: 1345, s: 32, w: 300 },
    logoName: { x: 112, y: 1550, s: 26, c: 'ink' }, logoTag: { x: 112, y: 1588, s: 15, c: 'mute' },
    photoTag: { x: 180, y: 1060, s: 21, w: 300, c: 'photoTag', center: true },
    f1a: { x: 514, y: 1554, s: 14, c: 'mute' }, f1b: { x: 514, y: 1573, s: 20, c: 'ink' },
    f2a: { x: 804, y: 1554, s: 14, c: 'mute' }, f2b: { x: 804, y: 1575, s: 18, c: 'ink' },
    disc: { x: 343, y: 1620, s: 13, w: 394, c: 'faint', center: true },
    photo: { x: 0, y: 0, w: 640, s: 0 },
    bar: { x: 32, y: 1518, w: 1016, s: 0 },
  },
}

export const Component: HifiTemplateComponent = ({
  size, content, tokens, beats, playing, reducedMotion, frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))
  const pos = POS[size]
  const col = (c?: string) => (c === 'accent' ? tokens.accent : COLORS[c ?? 'white'])

  // exact art, accent recoloured to the kit
  const art = (size === 'Story' ? storyArt : postArt)
    .replaceAll('#16B9E8', tokens.accent).replaceAll('#14B9E8', tokens.accent)

  // headline: 3 lines, last accented
  const hl = (content.headline ?? '').split('\n')

  // price -> "$" / big dollars / ".cents" / unit
  const raw = (content.offer ?? '').trim()
  const m = raw.replace(/\s+/g, '').match(/^(\D*)(\d[\d,]*)(\.\d+)?$/)
  const cur = m ? (m[1] || '$') : '$'
  const big = m ? m[2] : raw
  const cents = m && m[3] ? m[3] : ''
  const unit = content.offerUnit ?? ''

  const T = (p: P, node: ReactNode, opts: { display?: boolean; wrap?: boolean; slot?: Slot; fit?: boolean } = {}) => {
    const base: CSSProperties = {
      position: 'absolute', left: p.x, top: p.y, fontSize: p.s, lineHeight: 1.1,
      color: col(p.c), fontWeight: 800,
      fontFamily: opts.display === false ? 'var(--body-font)' : 'var(--display-font)',
      maxWidth: p.w, textAlign: p.center ? 'center' : 'left',
      whiteSpace: opts.wrap ? 'normal' : 'nowrap',
      ...(opts.slot ? sty(opts.slot, 'fade-in') : {}),
    }
    if (opts.wrap) base.width = p.w
    // Single-line variable text auto-fits to its Figma width budget (standing rule).
    if (opts.fit && !opts.wrap)
      return <FitText as="div" style={base} deps={[node, size]}>{node}</FitText>
    return <div style={base}>{node}</div>
  }

  const vps = tokens.valueProps.slice(0, 3)

  return (
    <div className={`jpd jpd-${size}`}>
      <div className="jpd-art" dangerouslySetInnerHTML={{ __html: art }} />

      {content.photo ? (
        <div className="jpd-photo" style={{ left: pos.photo.x, top: pos.photo.y, width: pos.photo.w, backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }} />
      ) : (
        T(pos.photoTag, 'YOUR PHOTO HERE')
      )}

      {/* footer bar — Figma places it full-width ON TOP of the photo, so it must
          paint after the photo layer (the copy in the art gets buried) */}
      <div className="jpd-bar" style={{ left: pos.bar.x, top: pos.bar.y, width: pos.bar.w }} />

      {/* headline */}
      {hl[0] && T(pos.hl1, <Styled text={hl[0]} />, { slot: 'headline' })}
      {hl[1] && T(pos.hl2, <Styled text={hl[1]} />, { slot: 'headline' })}
      {hl[2] && T(pos.hl3, <Styled text={hl[2]} />, { slot: 'headline' })}

      {/* composed price */}
      {big && (
        <div style={sty('offer', 'pop-in')}>
          {T(pos.cur, cur)}
          {T(pos.big, big)}
          {cents && T(pos.cents, cents)}
          {unit && T(pos.unit, unit)}
        </div>
      )}

      {/* subhead */}
      {content.subhead && T(pos.sub, content.subhead, { display: false, wrap: true, slot: 'subhead' })}

      {/* CTA label (button art is in the SVG) */}
      {content.cta && T(pos.cta, content.cta, { slot: 'cta', fit: true })}

      {/* value props (check art is in the SVG) */}
      {vps[0] && T(pos.vp1, vps[0], { fit: true })}
      {vps[1] && T(pos.vp2, vps[1], { fit: true })}
      {vps[2] && T(pos.vp3, vps[2], { fit: true })}

      {/* logo: the mark is in the SVG art; overlay the name + tagline */}
      {tokens.clientName && T(pos.logoName, tokens.clientName, { display: false, slot: 'logo', fit: true })}
      {tokens.tagline && T(pos.logoTag, tokens.tagline, { display: false })}

      {/* footer fields (icons are in the SVG) */}
      {T(pos.f1a, 'MOST', { display: false })}
      {T(pos.f1b, 'Insurance accepted', { display: false })}
      {T(pos.f2a, 'GET STARTED', { display: false })}
      {T(pos.f2b, 'Tap “Learn More”', { display: false })}

      {/* disclaimer */}
      {content.disclaimer && T(pos.disc, content.disclaimer, { display: false })}
    </div>
  )
}
