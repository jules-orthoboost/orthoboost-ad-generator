import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'

/**
 * Rogers Full Bleed — the client's photo fills the frame under a soft bottom
 * scrim; logo top-center, then a centered headline, subhead, offer, and CTA
 * over the lower third. Brand color (--brand), accent (--accent), logo, and
 * photo come from the client; the scrim + rounded forms are the persona.
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
    <div className={`rf rf-${size}`}>
      {content.photo && (
        <div className="rf-photo" style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }} />
      )}
      <div className="rf-scrim" />

      {logoUrl && (
        <div className="rf-logochip" style={sty('logo', 'fade-in')}>
          <img className="rf-logo" src={logoUrl} alt="" />
        </div>
      )}

      <div className="rf-stack">
        {content.headline && (
          <h1 className="rf-headline" style={sty('headline', 'rise-in')}>
            {content.headline}
          </h1>
        )}
        {content.subhead && (
          <p className="rf-subhead" style={sty('subhead', 'rise-in')}>
            {content.subhead}
          </p>
        )}
        {content.offer && (
          <div className="rf-offer-row">
            <span className="rf-offer" style={sty('offer', 'pop-in')}>
              {content.offer}
            </span>
          </div>
        )}
        {content.cta && (
          <div className="rf-cta-row">
            <span className="rf-cta" style={sty('cta', 'pop-in')}>
              {content.cta}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
