import { useState } from 'react'
import { loadPhotoLibrary } from '../../core/data'
import { estimateFit } from '../../core/fit'
import { COPY_SLOTS, SLOT_FONT_PX } from '../../core/gates'
import type { SizeKey, Slot } from '../../core/schemas'
import type { StepProps } from './CampaignBuilder'

const photos = loadPhotoLibrary()
const photoLabel = (url: string) => decodeURIComponent(url.split('/').pop() ?? url).replace(/\.\w+$/, '')

type Version = 'V1' | 'V2'

export function ContentStep({ draft, setDraft, deps }: StepProps) {
  const [version, setVersion] = useState<Version>('V1')
  const manifest = deps.manifest
  const archetype = deps.archetype
  if (!manifest || !archetype) return <p className="muted">Pick a template first.</p>

  const copySlots = manifest.slots.filter((s): s is (typeof COPY_SLOTS)[number] =>
    (COPY_SLOTS as readonly string[]).includes(s),
  )
  const content = draft.versions[version].content

  const setField = (slot: Slot, value: string) =>
    setDraft((d) => ({
      ...d,
      versions: {
        ...d.versions,
        [version]: { content: { ...d.versions[version].content, [slot]: value } },
      },
    }))

  const fitHint = (slot: Slot, text: string) => {
    if (!text.trim()) return null
    let worst = { fits: true, lines: 0, size: 'Story' as SizeKey }
    for (const size of ['Story', 'Post'] as SizeKey[]) {
      const zone = archetype.zones[size].find((z) => z.slot === slot)
      if (!zone) continue
      const r = estimateFit({
        text,
        widthPx: zone.w,
        fontSizePx: SLOT_FONT_PX[slot] ?? 48,
        maxLines: zone.maxLines,
      })
      if (!r.fits && (worst.fits || r.lines > worst.lines)) worst = { fits: false, lines: r.lines, size }
    }
    return worst.fits ? (
      <span className="fit ok">fits</span>
    ) : (
      <span className="fit bad">too long for {worst.size} ({worst.lines} lines)</span>
    )
  }

  return (
    <div>
      <h2>Write the copy</h2>
      <div className="seg cb-vtabs">
        {(['V1', 'V2'] as Version[]).map((v) => (
          <button key={v} className={version === v ? 'on' : ''} onClick={() => setVersion(v)}>
            {v}
          </button>
        ))}
      </div>

      <div className="cb-form">
        {copySlots.map((slot) => {
          const value = content[slot] ?? ''
          const multiline = slot === 'headline' || slot === 'subhead'
          return (
            <label key={slot} className="cb-field">
              <span>
                {slot} {fitHint(slot, value)}
              </span>
              {multiline ? (
                <textarea
                  rows={2}
                  value={value}
                  onChange={(e) => setField(slot, e.target.value)}
                />
              ) : (
                <input type="text" value={value} onChange={(e) => setField(slot, e.target.value)} />
              )}
            </label>
          )
        })}

        {manifest.slots.includes('photo') && (
          <div className="cb-field">
            <span>Photo</span>
            <div className="cb-photo-grid">
              {photos.map((url) => (
                <button
                  key={url}
                  className={`cb-photo ${content.photo === url ? 'active' : ''}`}
                  title={photoLabel(url)}
                  onClick={() => setField('photo', url)}
                >
                  <img src={url} alt={photoLabel(url)} />
                </button>
              ))}
            </div>
          </div>
        )}

        {manifest.slots.includes('logo') && (
          <p className="muted cb-logo-note">Logo comes from the client brand kit automatically.</p>
        )}
      </div>
    </div>
  )
}
