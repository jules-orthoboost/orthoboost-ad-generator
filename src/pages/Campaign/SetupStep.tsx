import type { StepProps } from './CampaignBuilder'

const AD_SET_TYPES = ['Seasonal', 'Evergreen'] as const

export function SetupStep({ draft, setDraft }: StepProps) {
  return (
    <div>
      <h2>Campaign setup</h2>
      <div className="cb-form">
        <label className="cb-field">
          <span>Ad set type</span>
          <div className="seg">
            {AD_SET_TYPES.map((t) => (
              <button
                key={t}
                className={draft.adSetType === t ? 'on' : ''}
                onClick={() => setDraft((d) => ({ ...d, adSetType: t }))}
              >
                {t}
              </button>
            ))}
          </div>
        </label>

        <label className="cb-field">
          <span>Theme</span>
          <input
            type="text"
            placeholder="e.g. Back To School"
            value={draft.theme ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value }))}
          />
        </label>

        <label className="cb-field">
          <span>Year</span>
          <input
            type="number"
            placeholder="2026"
            value={draft.year ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, year: e.target.value ? Number(e.target.value) : undefined }))
            }
          />
        </label>
      </div>
    </div>
  )
}
