import { useState } from 'react'
import { MOTION_PRESETS } from '../../templates/hifi/presets'
import { loadBrandKits } from '../../core/data'
import { Button } from '../../components/catalyst/button'
import { DeliverablePreview } from './DeliverablePreview'
import { StepIntro, Tile } from './ui'
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
      <StepIntro title="Animation style">
        Applies to every template and persona. Pick one and watch the preview — video export uses it.
      </StepIntro>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STYLES.map((s) => (
            <Tile
              key={s.id}
              active={current === s.id}
              title={s.name}
              meta={`${Math.round(s.durationMs / 1000)}s`}
              onClick={() => select(s.id)}
            />
          ))}
        </div>

        {kit && template ? (
          <div className="flex flex-col items-center gap-3">
            <Button outline onClick={() => setPlayCount((c) => c + 1)}>
              ▶ Replay
            </Button>
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
          <p className="text-sm text-zinc-500">Pick brands + a template first to preview motion.</p>
        )}
      </div>
    </div>
  )
}
