import './template.css'
import type { HifiTemplateComponent } from '../types'
import type { Beat, Slot } from '../../../core/schemas'
import { useClock, slotProgress, revealStyle } from '../motion'
import { FitText } from '../FitText'
import { Highlighted } from '../Highlighted'

/**
 * Family Portrait (Premium) — the Dr. G. House premium-family look. A warm cream
 * sheet: a framed portrait with a star rating badge, a confident multi-line
 * headline (last line accented), a tinted supporting panel, a new-patient offer,
 * a filled CTA and a star trust line, with a centred brand lockup. Post is
 * photo-left / copy-right; Story stacks a framed portrait over the copy. The
 * brand kit drives --brand / --accent (panel, CTA, headline accent), the logo,
 * tagline and the trust line; copy and the offer come from per-ad content.
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

  return (
    <div className={`hp hp-${size}`}>
      <div className="hp-bg" />

      {/* framed portrait + rating badge */}
      <div className="hp-photo-frame" style={sty('photo', 'fade-in')}>
        {content.photo ? (
          <div className="hp-photo" style={{ backgroundImage: `url(${content.photo})` }} />
        ) : (
          <div className="hp-photo-ph">
            <span className="hp-photo-tag">FAMILY / PATIENT PHOTO</span>
          </div>
        )}
        {content.rating && (
          <div className="hp-badge" style={sty('badge', 'pop-in')}>
            <svg className="hp-badge-star" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 18l-5.2 2.7 1-5.8L3.6 8.7l5.8-.8L12 2.6z" />
            </svg>
            <b className="hp-badge-num">{content.rating}</b>
          </div>
        )}
      </div>

      {/* copy column */}
      <div className="hp-main">
        {lines.length > 0 && (
          <h1 className="hp-headline" style={sty('headline', 'rise-in')}>
            {lines.map(({ line, start }, i) => (
              <span key={i} className={i === lines.length - 1 ? 'hp-hl hp-hl-accent' : 'hp-hl'}>
                <Highlighted text={line} ranges={content.highlights?.headline} tokens={tokens} offset={start} />
              </span>
            ))}
          </h1>
        )}

        {content.subhead && (
          <p className="hp-panel" style={sty('subhead', 'rise-in')}>
            <Highlighted text={content.subhead ?? ''} ranges={content.highlights?.subhead} tokens={tokens} />
          </p>
        )}

        {(content.offer || content.offerLabel) && (
          <div className="hp-offer" style={sty('offer', 'fade-in')}>
            {content.offerLabel && <div className="hp-offer-label">{content.offerLabel}</div>}
            {content.offer && (
              <FitText as="div" className="hp-offer-text" deps={[content.offer, size]}>
                {content.offer}
              </FitText>
            )}
          </div>
        )}

        {content.cta && (
          <FitText as="span" className="hp-cta" style={sty('cta', 'pop-in')} deps={[content.cta, size]}>
            {content.cta}
            <span className="hp-cta-arrow" aria-hidden="true">→</span>
          </FitText>
        )}

        {(content.rating || content.socialProof) && (
          <div className="hp-trust">
            <span className="hp-stars" aria-hidden="true">★★★★★</span>
            {content.socialProof && <span className="hp-trust-text">{content.socialProof}</span>}
          </div>
        )}

        {content.disclaimer && (
          <FitText as="div" className="hp-disclaimer" deps={[content.disclaimer, size]}>
            {content.disclaimer}
          </FitText>
        )}
      </div>

      {/* brand lockup */}
      <div className="hp-brand">
        {logoUrl && <img className="hp-logo" src={logoUrl} alt="" style={sty('logo', 'fade-in')} />}
        {tokens.tagline && <span className="hp-tagline">{tokens.tagline}</span>}
      </div>
    </div>
  )
}
