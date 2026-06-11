import './template.css'
import type { HifiTemplateComponent } from '../types'
import { useBeats } from '../useBeats'

/**
 * Hero / Banner / CTA — full-bleed photo, top-center logo, a confident
 * headline-led band in the upper-middle, and a CTA pill in the bottom third.
 * Legibility over the photo is engineered with gradient scrims, not assumed.
 */
export const Component: HifiTemplateComponent = ({
  size,
  content,
  logoUrl,
  beats,
  playing,
  reducedMotion,
}) => {
  const shown = useBeats(beats, playing, reducedMotion)
  const ds = (slot: string) => (shown[slot as keyof typeof shown] ? 'true' : 'false')

  return (
    <div className={`hbc hbc-${size}`}>
      {content.photo && (
        <div
          className="hbc-photo"
          data-effect="fade-in"
          data-shown={ds('photo')}
          style={{ backgroundImage: `url(${content.photo})` }}
        />
      )}
      <div className="hbc-scrim" />

      {logoUrl && (
        <img
          className="hbc-logo"
          src={logoUrl}
          alt=""
          data-effect="fade-in"
          data-shown={ds('logo')}
        />
      )}

      <div className="hbc-copy">
        {content.headline && (
          <h1 className="hbc-headline" data-effect="rise-in" data-shown={ds('headline')}>
            {content.headline}
          </h1>
        )}
        {content.subhead && (
          <p className="hbc-subhead" data-effect="rise-in" data-shown={ds('subhead')}>
            {content.subhead}
          </p>
        )}
      </div>

      {content.cta && (
        <div className="hbc-cta-wrap">
          <span className="hbc-cta" data-effect="pop-in" data-shown={ds('cta')}>
            {content.cta}
          </span>
        </div>
      )}
    </div>
  )
}
