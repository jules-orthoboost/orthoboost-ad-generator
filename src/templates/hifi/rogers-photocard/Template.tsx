import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Rogers Photo Card — a rounded photo card (the client's image) over a warm
 * ground, with a left-aligned headline, subhead, offer, and CTA beneath and a
 * logo chip on the card. Brand color (--brand), accent (--accent), logo, and
 * photo come from the client; warm ground + rounded forms are the persona.
 */
export const Component: HifiTemplateComponent = ({
  size,
  content,
  logoUrl,
  beats,
  playing,
  reducedMotion,
  frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))

  return (
    <div className={`rp rp-${size}`}>
      {content.photo && (
        <div className="rp-photo" style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }} />
      )}
      {logoUrl && (
        <div className="rp-logochip" style={sty('logo', 'fade-in')}>
          <img className="rp-logo" src={logoUrl} alt="" />
        </div>
      )}
      {content.headline && (
        <h1 className="rp-headline" style={sty('headline', 'rise-in')}>
          {content.headline}
        </h1>
      )}
      {content.subhead && (
        <p className="rp-subhead" style={sty('subhead', 'rise-in')}>
          {content.subhead}
        </p>
      )}
      {content.offer && (
        <span className="rp-offer" style={sty('offer', 'pop-in')}>
          {content.offer}
        </span>
      )}
      {content.cta && (
        <span className="rp-cta" style={sty('cta', 'pop-in')}>
          {content.cta}
        </span>
      )}
      {content.disclaimer && (
        <p className="rp-disclaimer" style={sty('disclaimer', 'fade-in')}>
          {content.disclaimer}
        </p>
      )}
    </div>
  )
}
