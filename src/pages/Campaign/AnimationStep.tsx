import { useState } from 'react'
import { MOTION_PRESETS } from '../../templates/hifi/presets'
import { loadBrandKits } from '../../core/data'
import { DeliverablePreview } from './DeliverablePreview'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()
const STYLES = Object.values(MOTION_PRESETS)

export function AnimationStep({ draft, setDraft, deps }: StepProps) {
  const [playCount, setPlayCount] = useState(0)
  const kit = deps.kits[0]
  const template = draft.templateSlugs[0]
  const current = draft.animationStyle ?? 'none'

  const select = (id: string) => {
    setDraft((d) => ({ ...d, animationStyle: id }))
    setPlayCount((c) => c + 1)
  }

  return (
    <div>
      <h2>Animation style</h2>
      <p className="muted">
        Applies to every template and persona. Pick one and watch the preview — video export uses it.
      </p>
      <div className="cb-anim">
        <div className="cb-cards">
          {STYLES.map((s) => {
            const active = current === s.id
            return (
              <button key={s.id} className={`cb-card ${active ? 'active' : ''}`} onClick={() => select(s.id)}>
                <strong>{s.name}</strong>
                <span className="muted">{Math.round(s.durationMs / 1000)}s</span>
              </button>
            )
          })}
        </div>
        {kit && template ? (
          <div className="cb-anim-preview">
            <button className="cb-nav" onClick={() => setPlayCount((c) => c + 1)}>
              ▶ Replay
            </button>
            <DeliverablePreview
              key={`${current}-${playCount}`}
              draft={draft}
              kit={kits[kit.slug]}
              templateSlug={template}
              version="V1"
              size="Post"
              fitHeight={420}
              playing
            />
          </div>
        ) : (
          <p className="muted">Pick brands + a template first to preview motion.</p>
        )}
      </div>
    </div>
  )
}
