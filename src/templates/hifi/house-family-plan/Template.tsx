import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { useFitText } from '../useFitText'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Family Plan (Checklist) — the Dr. G. House family-plan look. A family photo up
 * top over a deep teal section: a warm multi-line headline, subhead and brand
 * lockup on the left, and a floating white plan card on the right with a
 * checklist (the kit's value props) and a structured savings offer, plus a
 * filled CTA. Brand kit drives --brand / --accent, the checklist, logo & tagline.
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

  const checklist = tokens.valueProps.slice(0, 3)
  const offerRef = useFitText<HTMLDivElement>([content.offer, content.offerUnit, size])

  return (
    <div className={`hfp hfp-${size}`}>
      <div className="hfp-bg" />

      {/* hero photo */}
      <div className="hfp-hero" style={sty('photo', 'fade-in')}>
        {content.photo ? (
          <div className="hfp-photo" style={{ backgroundImage: `url(${content.photo})` }} />
        ) : (
          <div className="hfp-photo-ph">
            <span className="hfp-photo-tag">FAMILY PHOTO</span>
          </div>
        )}
        <div className="hfp-hero-scrim" />
      </div>

      {/* teal section copy (left) */}
      <div className="hfp-copy">
        {lines.length > 0 && (
          <h1 className="hfp-headline" style={sty('headline', 'rise-in')}>
            {lines.map(({ line, start }, i) => (
              <span key={i} className={i === lines.length - 1 ? 'hfp-hl hfp-hl-accent' : 'hfp-hl'}>
                <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
              </span>
            ))}
          </h1>
        )}
        {content.subhead && (
          <p className="hfp-subhead" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}
      </div>

      {/* plan card (right) */}
      <div className="hfp-card" style={sty('badge', 'fade-in')}>
        {content.badge && (
          <FitText as="div" className="hfp-card-title" deps={[content.badge, size]}>
            {content.badge}
          </FitText>
        )}
        {checklist.length > 0 && (
          <ul className="hfp-checklist">
            {checklist.map((c, i) => (
              <li key={i}>
                <svg className="hfp-check" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12.5l5 5 11-12" />
                </svg>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        )}
        {(content.offer || content.offerLabel) && (
          <div className="hfp-offer" style={sty('offer', 'pop-in')}>
            {content.offerLabel && <div className="hfp-offer-label">{content.offerLabel}</div>}
            {content.offer && (
              <div ref={offerRef} className="hfp-offer-row">
                <span className="hfp-amount">{content.offer}</span>
                {content.offerUnit && <span className="hfp-unit">{content.offerUnit}</span>}
              </div>
            )}
            {content.offerFine && <div className="hfp-offer-fine">{content.offerFine}</div>}
          </div>
        )}
        {content.cta && (
          <FitText as="span" className="hfp-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            {content.cta}
            <span className="hfp-cta-arrow" aria-hidden="true">→</span>
          </FitText>
        )}
        {content.disclaimer && (
          <FitText as="div" className="hfp-disclaimer" deps={[content.disclaimer, size]}>
            {content.disclaimer}
          </FitText>
        )}
      </div>

      {/* brand lockup (teal section, left) */}
      <div className="hfp-brand">
        {logoUrl && <img className="hfp-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}
        {tokens.tagline && <span className="hfp-tagline">{tokens.tagline}</span>}
      </div>
    </div>
  )
}
