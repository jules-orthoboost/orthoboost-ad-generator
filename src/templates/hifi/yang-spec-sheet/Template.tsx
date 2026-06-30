import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { useFitText } from '../useFitText'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Spec Sheet (Authority) — the Dr. C. Yang "ORTHO_DATA" look. A dark clinical
 * sheet: an eyebrow + a multi-line authority headline (last line accented),
 * subhead, an outlined CTA and a minimal seasonal offer on the left; a framed
 * specimen photo with corner registration ticks and a credentials / outcomes
 * panel on the right; brand logo + contact in the footer. The brand kit drives
 * the accent colour, the value-prop credentials, the logo and the contact line;
 * copy and the structured offer come from per-ad content.
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

  // Headline lines; the last line is accented (e.g. "… Timed Right.").
  const rawLines = (content.headline ?? '').split('\n')
  let off = 0
  const lines = rawLines
    .map((line) => {
      const start = off
      off += line.length + 1 // +1 for the '\n' that split() removed
      return { line, start }
    })
    .filter((l) => l.line)

  // The seasonal offer ("$0", "FREE", "$450 off") varies in length — fit it to the column.
  const offerRef = useFitText<HTMLDivElement>([content.offer, content.offerUnit, size])
  const creds = tokens.valueProps.slice(0, 3)

  return (
    <div className={`yss yss-${size}`}>
      <div className="yss-bg" />
      <div className="yss-grid" aria-hidden="true" />

      {/* eyebrow */}
      {content.badge && (
        <div className="yss-eyebrow" style={sty('badge', 'fade-in')}>
          <span className="yss-eyebrow-tick" aria-hidden="true" />
          <FitText as="span" className="yss-eyebrow-text" deps={[content.badge, size]}>
            {content.badge}
          </FitText>
        </div>
      )}

      {/* left column — headline / subhead / CTA / offer / disclaimer */}
      <div className="yss-main">
        {lines.length > 0 && (
          <h1 className="yss-headline" style={sty('headline', 'rise-in')}>
            {lines.map(({ line, start }, i) => (
              <span key={i} className={i === lines.length - 1 ? 'yss-hl yss-hl-accent' : 'yss-hl'}>
                <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
              </span>
            ))}
          </h1>
        )}

        {content.subhead && (
          <p className="yss-subhead" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}

        {content.cta && (
          <FitText as="span" className="yss-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            <span className="yss-cta-arrow" aria-hidden="true">→</span>
            {content.cta}
          </FitText>
        )}
      </div>

      {/* seasonal offer + disclaimer (positioned independently per size) */}
      {(content.offer || content.offerLabel || content.disclaimer) && (
        <div className="yss-pitch">
          {(content.offer || content.offerLabel) && (
            <div className="yss-offer" style={sty('offer', 'pop-in')}>
              {content.offerLabel && <div className="yss-offer-label">{content.offerLabel}</div>}
              {content.offer && (
                <div ref={offerRef} className="yss-offer-row">
                  <span className="yss-amount">{content.offer}</span>
                  {content.offerUnit && <span className="yss-unit">{content.offerUnit}</span>}
                </div>
              )}
            </div>
          )}
          {content.disclaimer && (
            <FitText as="div" className="yss-disclaimer" deps={[content.disclaimer, size]}>
              {content.disclaimer}
            </FitText>
          )}
        </div>
      )}

      {/* right column — framed specimen photo + outcomes panel */}
      <div className="yss-side">
        <div className="yss-photo-frame" style={sty('photo', 'fade-in')}>
          {content.photo ? (
            <div className="yss-photo" style={{ backgroundImage: `url(${content.photo})` }} />
          ) : (
            <div className="yss-photo-ph">
              <span className="yss-photo-tag">SPECIALIST / DOCTOR PHOTO</span>
            </div>
          )}
          <span className="yss-tick yss-tick-tl" aria-hidden="true" />
          <span className="yss-tick yss-tick-tr" aria-hidden="true" />
          <span className="yss-tick yss-tick-bl" aria-hidden="true" />
          <span className="yss-tick yss-tick-br" aria-hidden="true" />
        </div>

        {(content.rating || content.socialProof || creds.length > 0) && (
          <div className="yss-panel">
            {content.rating && (
              <div className="yss-stat">
                <b className="yss-stat-num">{content.rating}</b>
                {content.socialProof && <span className="yss-stat-label">{content.socialProof}</span>}
              </div>
            )}
            {creds.length > 0 && (
              <ul className="yss-creds">
                {creds.map((c, i) => (
                  <li key={i}>
                    <span className="yss-creds-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="yss-creds-text">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* footer — logo + contact */}
      <div className="yss-footer">
        <div className="yss-brand">
          {logoUrl && <img className="yss-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}
          {tokens.tagline && <span className="yss-tagline">{tokens.tagline}</span>}
        </div>
        <div className="yss-contact">
          {tokens.website && <span className="yss-contact-line">{tokens.website}</span>}
          {tokens.phone && <span className="yss-contact-line">{tokens.phone}</span>}
        </div>
      </div>
    </div>
  )
}
