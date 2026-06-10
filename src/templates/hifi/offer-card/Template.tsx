import './template.css'
import type { HifiTemplateComponent } from '../types'
import { useBeats } from '../useBeats'

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
}) => {
  const shown = useBeats(beats, playing, reducedMotion)
  const ds = (slot: string) => (shown[slot as keyof typeof shown] ? 'true' : 'false')

  return (
    <div className={`oc oc-${size}`}>
      {content.photo && (
        <div
          className="oc-photo"
          data-effect="fade-in"
          data-shown={ds('photo')}
          style={{ backgroundImage: `url(${content.photo})` }}
        />
      )}
      <div className="oc-scrim" />

      <div className="oc-card">
        {logoUrl && (
          <img
            className="oc-logo"
            src={logoUrl}
            alt=""
            data-effect="fade-in"
            data-shown={ds('logo')}
          />
        )}
        {content.offer && (
          <div className="oc-offer" data-effect="pop-in" data-shown={ds('offer')}>
            {content.offer}
          </div>
        )}
        {content.headline && (
          <h1 className="oc-headline" data-effect="rise-in" data-shown={ds('headline')}>
            {content.headline}
          </h1>
        )}
        {content.cta && (
          <span className="oc-cta" data-effect="pop-in" data-shown={ds('cta')}>
            {content.cta}
          </span>
        )}
      </div>
    </div>
  )
}
