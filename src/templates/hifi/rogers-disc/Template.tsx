import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'

/**
 * Rogers Disc — the Dr. M. Rogers (family-community) hero, photo-free.
 * A solid accent-fill disc with a brand-color ring and a sparkle accent over a
 * warm ground; headline, subhead, an offer badge, and a CTA stack beneath.
 * Brand color (--brand), accent (--accent), and logo come from the brand kit;
 * the warm ground, rounded forms, and sparkle are the persona's design language.
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
    <div className={`rd rd-${size}`}>
      <div className="rd-disc" />
      <div className="rd-ring" />
      <svg className="rd-spark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5c.6 3.5 1.7 4.6 5 5-3.3.4-4.4 1.5-5 5-.6-3.5-1.7-4.6-5-5 3.3-.4 4.4-1.5 5-5Z" />
        <path d="M18.5 13.5c.3 1.6.8 2.1 2.3 2.4-1.5.3-2 .8-2.3 2.4-.3-1.6-.8-2.1-2.3-2.4 1.5-.3 2-.8 2.3-2.4Z" />
      </svg>

      {logoUrl && <img className="rd-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}

      {content.headline && (
        <h1 className="rd-headline" style={sty('headline', 'rise-in')}>
          {content.headline}
        </h1>
      )}
      {content.subhead && (
        <p className="rd-subhead" style={sty('subhead', 'rise-in')}>
          {content.subhead}
        </p>
      )}
      {content.offer && (
        <div className="rd-offer-row">
          <FitText as="span" className="rd-offer" style={sty('offer', 'pop-in')} deps={[content.offer, size]}>
            {content.offer}
          </FitText>
        </div>
      )}
      {content.cta && (
        <div className="rd-cta-row">
          <FitText as="span" className="rd-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            {content.cta}
          </FitText>
        </div>
      )}
      {content.disclaimer && (
        <p className="rd-disclaimer" style={sty('disclaimer', 'fade-in')}>
          {content.disclaimer}
        </p>
      )}
    </div>
  )
}
