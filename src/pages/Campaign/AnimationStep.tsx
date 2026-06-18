import type { StepProps } from './CampaignBuilder'

// Placeholder set — wired to real motion presets in a later phase.
const STYLES = [
  { id: 'gentle-rise', name: 'Gentle Rise', desc: 'Soft fade + rise, slow background drift' },
  { id: 'pop-stagger', name: 'Pop Stagger', desc: 'Elements pop in one after another' },
  { id: 'slide-in', name: 'Slide In', desc: 'Copy slides in from the side' },
  { id: 'breathe', name: 'Breathe', desc: 'Calm scale pulse on the focal element' },
  { id: 'ken-burns', name: 'Ken Burns', desc: 'Slow photo push-in under static copy' },
  { id: 'none', name: 'Static', desc: 'No motion (image only)' },
]

export function AnimationStep({ draft, setDraft }: StepProps) {
  return (
    <div>
      <h2>Animation style</h2>
      <p className="muted">
        Applies to every template and persona. Motion preview &amp; video export land in a later phase
        — for now this records your choice.
      </p>
      <div className="cb-cards">
        {STYLES.map((s) => {
          const active = draft.animationStyle === s.id
          return (
            <button
              key={s.id}
              className={`cb-card ${active ? 'active' : ''}`}
              onClick={() => setDraft((d) => ({ ...d, animationStyle: s.id }))}
            >
              <strong>{s.name}</strong>
              <span className="muted">{s.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
