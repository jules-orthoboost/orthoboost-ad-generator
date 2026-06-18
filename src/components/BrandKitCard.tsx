import type { BrandKit, Persona } from '../core/schemas'
import { resolveTokens } from '../core/tokens'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

interface Props {
  kit: BrandKit
  persona: Persona
}

/** Read-only view of a brand kit and the tokens it resolves to. Editing arrives in Phase 3. */
export function BrandKitCard({ kit, persona }: Props) {
  const tokens = resolveTokens(persona, kit)
  const swatches: [string, string][] = [
    ['brand', tokens.brand],
    ['accent', tokens.accent],
    ['ink', tokens.ink],
    ['surface', tokens.surface],
    ['on-brand', tokens.onBrand],
  ]
  return (
    <div className="bk-card">
      <div className="bk-head">
        <img className="bk-logo" src={asset(kit.logo.assetPath)} alt={`${kit.clientName} logo`} />
        <div>
          <h1>{kit.clientName}</h1>
          <p className="muted">
            Persona: {persona.name} · {persona.archetype}
          </p>
        </div>
      </div>

      <h3>Palette</h3>
      <div className="bk-swatches">
        {swatches.map(([label, value]) => (
          <div key={label} className="bk-swatch">
            <span className="bk-chip" style={{ background: value }} />
            <code>{label}</code>
            <code className="muted">{value}</code>
          </div>
        ))}
      </div>

      <h3>Typography</h3>
      <dl className="persona-facts">
        <dt>Display</dt>
        <dd style={{ fontFamily: tokens.displayFont }}>{tokens.displayFont}</dd>
        <dt>Body</dt>
        <dd style={{ fontFamily: tokens.bodyFont }}>{tokens.bodyFont}</dd>
        <dt>Corner radius</dt>
        <dd>{tokens.radius}px</dd>
      </dl>

      {kit.valueProps && kit.valueProps.length > 0 && (
        <>
          <h3>Value props</h3>
          <ul className="bk-valueprops">
            {kit.valueProps.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </>
      )}

      {kit.donts && kit.donts.length > 0 && (
        <>
          <h3>Client don&apos;ts</h3>
          <ul className="bk-donts">
            {kit.donts.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
