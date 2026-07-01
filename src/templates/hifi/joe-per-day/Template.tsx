import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { useFitText } from '../useFitText'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Per-Day Price (Budget) — the Dr. A. Joe budget look, price-led. A blue sheet
 * with a full-height photo on the right; on the left an eyebrow, a headline, a
 * big per-day price, a supporting line, a cyan CTA and value-prop checks; a
 * light footer bar carries the brand lockup + contact. Brand kit drives
 * --brand / --accent, the value props, the logo and the contact line.
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

  const rawLines = (content.headline ?? '').split('\n')
  let off = 0
  const lines = rawLines
    .map((line) => {
      const start = off
      off += line.length + 1
      return { line, start }
    })
    .filter((l) => l.line)

  const checks = tokens.valueProps.slice(0, 3)
  const offerRef = useFitText<HTMLDivElement>([content.offer, content.offerUnit, size])

  return (
    <div className={`jpd jpd-${size}`}>
      <div className="jpd-bg" />

      {/* photo (right) */}
      <div className="jpd-photo-col" style={sty('photo', 'fade-in')}>
        {content.photo ? (
          <div className="jpd-photo" style={{ backgroundImage: `url(${content.photo})` }} />
        ) : (
          <div className="jpd-photo-ph">
            <span className="jpd-photo-tag">YOUR PHOTO HERE</span>
          </div>
        )}
        <div className="jpd-photo-scrim" />
      </div>

      {/* copy column (left) */}
      <div className="jpd-main">
        {content.badge && (
          <FitText as="div" className="jpd-eyebrow" deps={[content.badge, size]}>
            {content.badge}
          </FitText>
        )}

        {lines.length > 0 && (
          <h1 className="jpd-headline" style={sty('headline', 'rise-in')}>
            {lines.map(({ line, start }, i) => (
              <span key={i} className={i === lines.length - 1 ? 'jpd-hl jpd-hl-accent' : 'jpd-hl'}>
                <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
              </span>
            ))}
          </h1>
        )}

        {(content.offer || content.offerLabel) && (
          <div className="jpd-offer" style={sty('offer', 'pop-in')}>
            {content.offerLabel && <div className="jpd-offer-label">{content.offerLabel}</div>}
            {content.offer && (
              <div ref={offerRef} className="jpd-offer-row">
                <span className="jpd-amount">{content.offer}</span>
                {content.offerUnit && <span className="jpd-unit">{content.offerUnit}</span>}
              </div>
            )}
          </div>
        )}

        {content.subhead && (
          <p className="jpd-subhead" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}

        {content.cta && (
          <FitText as="span" className="jpd-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            {content.cta}
            <span className="jpd-cta-arrow" aria-hidden="true">→</span>
          </FitText>
        )}

        {checks.length > 0 && (
          <ul className="jpd-checks">
            {checks.map((c, i) => (
              <li key={i}>
                <svg className="jpd-check" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12.5l5 5 11-12" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* footer bar */}
      <div className="jpd-footer">
        {logoUrl && <img className="jpd-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}
        <div className="jpd-footer-info">
          {tokens.website && <span className="jpd-footer-strong">{tokens.website}</span>}
          {content.disclaimer && <span className="jpd-footer-fine">{content.disclaimer}</span>}
        </div>
      </div>
    </div>
  )
}
