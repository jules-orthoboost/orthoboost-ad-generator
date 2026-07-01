import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Editorial (Luxury) — the D. K. Kardashian luxury-wellness look. An ivory
 * editorial sheet with generous space: a serif headline whose last line is
 * accented (italic), a refined benefits list ruled with hairlines, a quiet
 * seasonal offer, a no-button "reserve" CTA underlined in the accent colour and
 * a small social-proof line; a full-height portrait on the right. The brand kit
 * drives --brand / --accent, the benefit list (value props), the logo and the
 * social-proof copy; the headline, subhead and offer come from per-ad content.
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
      off += line.length + 1 // +1 for the '\n' that split() removed
      return { line, start }
    })
    .filter((l) => l.line)

  const benefits = tokens.valueProps.slice(0, 3)

  return (
    <div className={`ke ke-${size}`}>
      <div className="ke-bg" />

      {/* full-height portrait */}
      <div className="ke-photo-col" style={sty('photo', 'fade-in')}>
        {content.photo ? (
          <div className="ke-photo" style={{ backgroundImage: `url(${content.photo})` }} />
        ) : (
          <div className="ke-photo-ph">
            <span className="ke-photo-tag">PORTRAIT</span>
          </div>
        )}
      </div>

      {/* editorial copy column */}
      <div className="ke-main">
        {logoUrl && <img className="ke-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}

        {content.badge && <div className="ke-eyebrow">{content.badge}</div>}

        {lines.length > 0 && (
          <h1 className="ke-headline" style={sty('headline', 'rise-in')}>
            {lines.map(({ line, start }, i) => (
              <span key={i} className={i === lines.length - 1 ? 'ke-hl ke-hl-accent' : 'ke-hl'}>
                <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
              </span>
            ))}
          </h1>
        )}

        {content.subhead && (
          <p className="ke-subhead" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}

        {benefits.length > 0 && (
          <ul className="ke-benefits">
            {benefits.map((b, i) => (
              <li key={i}>
                <span className="ke-benefit-mark" aria-hidden="true">&#9670;</span>
                <span className="ke-benefit-text">{b}</span>
              </li>
            ))}
          </ul>
        )}

        {(content.offer || content.offerFine) && (
          <div className="ke-offer" style={sty('offer', 'fade-in')}>
            {content.offer && (
              <FitText as="div" className="ke-offer-text" deps={[content.offer, size]}>
                {content.offer}
              </FitText>
            )}
            {content.offerFine && <div className="ke-offer-fine">{content.offerFine}</div>}
          </div>
        )}

        {content.cta && (
          <FitText as="span" className="ke-cta" style={sty('cta', 'fade-in')} deps={[content.cta, size]}>
            {content.cta}
          </FitText>
        )}

        {(content.rating || content.socialProof) && (
          <div className="ke-proof">
            <span className="ke-proof-avatar" aria-hidden="true" />
            <div className="ke-proof-body">
              {content.socialProof && <span className="ke-proof-quote">{content.socialProof}</span>}
              {content.rating && <span className="ke-proof-rating">{content.rating}</span>}
            </div>
          </div>
        )}

        {content.disclaimer && (
          <FitText as="div" className="ke-disclaimer" deps={[content.disclaimer, size]}>
            {content.disclaimer}
          </FitText>
        )}
      </div>
    </div>
  )
}
