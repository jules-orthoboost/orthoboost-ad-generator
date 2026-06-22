import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'

/**
 * Offer Card — full-bleed photo seated under a soft wash, with a centered
 * surface card carrying the offer (accent emphasis), a headline, and a CTA.
 * The logo sits at the top of the card so it always has contrast.
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
    <div className={`oc oc-${size}`}>
      {content.photo && (
        <div
          className="oc-photo"
          style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }}
        />
      )}
      <div className="oc-scrim" />

      <div className="oc-card">
        {logoUrl && <img className="oc-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}
        {content.offer && (
          <div className="oc-offer" style={sty('offer', 'pop-in')}>
            {content.offer}
          </div>
        )}
        {content.headline && (
          <h1 className="oc-headline" style={sty('headline', 'rise-in')}>
            {content.headline}
          </h1>
        )}
        {content.cta && (
          <FitText as="span" className="oc-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            {content.cta}
          </FitText>
        )}
      </div>
    </div>
  )
}
