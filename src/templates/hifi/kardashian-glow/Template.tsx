import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Glow (Full-bleed) — the D. K. Kardashian luxury look, full-bleed variant. A
 * portrait fills the frame under a soft dark legibility gradient; the copy sits
 * in the lower band — a serif headline (last line accented italic), subhead,
 * service chips (the kit's value props), a quiet seasonal offer, a review line
 * and an underlined no-button reserve CTA — with the brand lockup up top. Text
 * is light over the image; --accent tints the accent line, chips and CTA rule.
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

  const chips = tokens.valueProps.slice(0, 3)

  return (
    <div className={`keg keg-${size}`}>
      {content.photo ? (
        <div className="keg-photo" style={{ backgroundImage: `url(${content.photo})`, ...sty('photo', 'fade-in') }} />
      ) : (
        <div className="keg-photo-ph" style={sty('photo', 'fade-in')}>
          <span className="keg-photo-tag">PORTRAIT</span>
        </div>
      )}
      <div className="keg-scrim" />

      {logoUrl && <img className="keg-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}

      <div className="keg-main">
        {content.badge && <div className="keg-eyebrow">{content.badge}</div>}

        {lines.length > 0 && (
          <h1 className="keg-headline" style={sty('headline', 'rise-in')}>
            {lines.map(({ line, start }, i) => (
              <span key={i} className={i === lines.length - 1 ? 'keg-hl keg-hl-accent' : 'keg-hl'}>
                <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
              </span>
            ))}
          </h1>
        )}

        {content.subhead && (
          <p className="keg-subhead" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}

        {chips.length > 0 && (
          <ul className="keg-chips">
            {chips.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}

        {(content.offer || content.offerFine) && (
          <div className="keg-offer" style={sty('offer', 'fade-in')}>
            {content.offer && (
              <FitText as="span" className="keg-offer-text" deps={[content.offer, size]}>
                {content.offer}
              </FitText>
            )}
            {content.offerFine && <span className="keg-offer-fine">{content.offerFine}</span>}
          </div>
        )}

        {(content.rating || content.socialProof) && (
          <div className="keg-review">
            {content.socialProof && <span className="keg-review-quote">{content.socialProof}</span>}
            {content.rating && <span className="keg-review-rating">{content.rating}</span>}
          </div>
        )}

        {content.cta && (
          <FitText as="span" className="keg-cta" style={sty('cta', 'fade-in')} deps={[content.cta, size]}>
            {content.cta}
          </FitText>
        )}

        {content.disclaimer && (
          <FitText as="div" className="keg-disclaimer" deps={[content.disclaimer, size]}>
            {content.disclaimer}
          </FitText>
        )}
      </div>
    </div>
  )
}
