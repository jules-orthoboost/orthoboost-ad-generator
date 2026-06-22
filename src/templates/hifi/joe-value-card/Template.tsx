import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { useFitText } from '../useFitText'

/**
 * Value Card (Price-led) — the Dr. A. Joe budget look. A hero photo band up top,
 * a flat white copy card on the left (headline + subhead + value-prop chips), a
 * big price and CTA on the right, and a brand footer bar. Logo, the three value
 * chips, and the footer contact come from the brand kit (tokens); the copy and
 * the structured offer come from per-ad content.
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
  const headlineLines = (content.headline ?? '').split('\n').filter(Boolean)
  const chips = tokens.valueProps.slice(0, 3)
  // The price varies in length ($0 … $2,000); shrink it to fit the price column.
  const offerRef = useFitText<HTMLDivElement>([content.offer, content.offerUnit, size])

  return (
    <div className={`jvc jvc-${size}`}>
      <div className="jvc-bg" />

      {/* hero photo band */}
      <div className="jvc-hero">
        {content.photo ? (
          <div className="jvc-photo" style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }} />
        ) : (
          <div className="jvc-photo-ph" style={sty('photo', 'fade-in')}>
            <span className="jvc-photo-tag">YOUR FAMILY PHOTO HERE</span>
          </div>
        )}
        <div className="jvc-hero-scrim" />
      </div>

      {/* utility row */}
      <div className="jvc-topbar">
        {tokens.website && <span className="jvc-web">{tokens.website}</span>}
        {tokens.social && <span className="jvc-social">{tokens.social}</span>}
      </div>

      {/* trust / social-proof pill */}
      {(content.rating || content.socialProof) && (
        <div className="jvc-trust" style={sty('badge', 'fade-in')}>
          <svg className="jvc-star" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 18l-5.2 2.7 1-5.8L3.6 8.7l5.8-.8L12 2.6z" />
          </svg>
          {content.rating && <b className="jvc-rating">{content.rating}</b>}
          {content.socialProof && <span className="jvc-trust-text">· {content.socialProof}</span>}
        </div>
      )}

      {/* copy card (left) */}
      <div className="jvc-card">
        {headlineLines.length > 0 && (
          <h1 className="jvc-headline" style={sty('headline', 'rise-in')}>
            {headlineLines.map((line, i) => (
              <span key={i} className={i === 0 ? 'jvc-hl' : 'jvc-hl jvc-hl-accent'}>
                {line}
              </span>
            ))}
          </h1>
        )}
        {content.subhead && (
          <p className="jvc-subhead" style={sty('subhead', 'rise-in')}>
            {content.subhead}
          </p>
        )}
        {chips.length > 0 && (
          <ul className="jvc-props">
            {chips.map((c, i) => (
              <li key={i}>
                <svg className="jvc-check" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12.5l5 5 11-12" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* price + CTA (right) */}
      <div className="jvc-price">
        {content.offerLabel && <div className="jvc-offer-label">{content.offerLabel}</div>}
        {content.offer && (
          <div ref={offerRef} className="jvc-offer-row" style={sty('offer', 'pop-in')}>
            <span className="jvc-amount">{content.offer}</span>
            {content.offerUnit && <span className="jvc-unit">{content.offerUnit}</span>}
          </div>
        )}
        {content.offerFine && <div className="jvc-offer-fine">{content.offerFine}</div>}
        {content.cta && (
          <span className="jvc-cta" style={sty('cta', 'pop-in')}>
            {content.cta} <span className="jvc-cta-arrow">→</span>
          </span>
        )}
        {content.disclaimer && <div className="jvc-disclaimer">{content.disclaimer}</div>}
      </div>

      {/* footer bar */}
      <div className="jvc-footer">
        <div className="jvc-brand">
          {logoUrl && <img className="jvc-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}
          {tokens.tagline && <span className="jvc-tagline">{tokens.tagline}</span>}
        </div>
        <div className="jvc-contact">
          <div className="jvc-contact-2">New patients welcome</div>
        </div>
      </div>
    </div>
  )
}
