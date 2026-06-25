import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Hero / Banner / CTA — full-bleed photo, top-center logo, a confident
 * headline-led band in the upper-middle, and a CTA pill in the bottom third.
 * Legibility over the photo is engineered with gradient scrims, not assumed.
 */
export const Component: HifiTemplateComponent = ({
  size,
  content,
  tokens,
  logoUrl,
  beats,
  playing,
  reducedMotion,
  frameNowMs,
}) => {
  const now = useClock(playing, reducedMotion, frameNowMs)
  const sty = (slot: Slot, effect: Beat['effect']) => revealStyle(effect, slotProgress(beats, slot, now))

  return (
    <div className={`hbc hbc-${size}`}>
      {content.photo && (
        <div
          className="hbc-photo"
          style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }}
        />
      )}
      <div className="hbc-scrim" />

      {logoUrl && <img className="hbc-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}

      <div className="hbc-copy">
        {content.headline && (
          <h1 className="hbc-headline" style={sty('headline', 'rise-in')}>
            <Highlighted text={content.headline ?? ''} ranges={content.highlights?.headline} tokens={tokens} />
          </h1>
        )}
        {content.subhead && (
          <p className="hbc-subhead" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}
      </div>

      {content.cta && (
        <div className="hbc-cta-wrap">
          <FitText as="span" className="hbc-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            {content.cta}
          </FitText>
        </div>
      )}
    </div>
  )
}
