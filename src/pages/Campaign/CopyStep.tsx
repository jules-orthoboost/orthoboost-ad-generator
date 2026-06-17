import { useState } from 'react'
import { loadBrandKits, loadPhotoLibrary } from '../../core/data'
import { fitProblem, type FlowDraft, type PerClientVersion, type Version } from '../../core/gates'
import type { PersonaCopyVersion } from '../../core/data'
import { DeliverablePreview } from './DeliverablePreview'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()
const photos = loadPhotoLibrary()
const photoLabel = (url: string) => decodeURIComponent(url.split('/').pop() ?? url).replace(/\.\w+$/, '')

const SHARED_FIELDS: (keyof PersonaCopyVersion)[] = ['headline', 'subhead', 'cta', 'disclaimer']

export function CopyStep({ draft, setDraft, deps }: StepProps) {
  const [version, setVersion] = useState<Version>('V1')
  const previewKit = deps.kits[0]
  const previewTemplate = draft.templateSlugs[0]

  const setShared = (field: keyof PersonaCopyVersion, value: string) =>
    setDraft((d) => ({
      ...d,
      shared: { ...d.shared, [version]: { ...d.shared[version], [field]: value } },
    }))

  const updatePC = (brand: string, patch: Partial<PerClientVersion>) =>
    setDraft((d) => {
      const cur = d.perClient[brand] ?? { V1: {}, V2: {} }
      return {
        ...d,
        perClient: { ...d.perClient, [brand]: { ...cur, [version]: { ...cur[version], ...patch } } },
      }
    })

  const setOverride = (brand: string, field: keyof PersonaCopyVersion, value: string) =>
    setDraft((d) => {
      const cur = d.perClient[brand] ?? { V1: {}, V2: {} }
      const ov = { ...(cur[version].override ?? {}), [field]: value }
      return {
        ...d,
        perClient: { ...d.perClient, [brand]: { ...cur, [version]: { ...cur[version], override: ov } } },
      }
    })

  const hint = (field: string, text: string) => {
    const p = fitProblem(text ?? '', deps.archetypes, field)
    return p ? <span className="fit bad">{p}</span> : null
  }

  return (
    <div className="cb-copy">
      <h2>Write the copy</h2>
      <div className="seg cb-vtabs">
        {(['V1', 'V2'] as Version[]).map((v) => (
          <button key={v} className={version === v ? 'on' : ''} onClick={() => setVersion(v)}>
            {v}
          </button>
        ))}
      </div>

      <h3>Shared across all {deps.kits.length} clients</h3>
      <div className="cb-form">
        {SHARED_FIELDS.map((field) => {
          const value = draft.shared[version][field] ?? ''
          const multiline = field === 'headline' || field === 'subhead'
          return (
            <label key={field} className="cb-field">
              <span>
                {field} {hint(field, value)}
              </span>
              {multiline ? (
                <textarea rows={2} value={value} onChange={(e) => setShared(field, e.target.value)} />
              ) : (
                <input type="text" value={value} onChange={(e) => setShared(field, e.target.value)} />
              )}
            </label>
          )
        })}
      </div>

      <h3>Per client — offer, photo &amp; overrides ({version})</h3>
      <div className="cb-clients">
        {draft.brandSlugs.map((slug) => {
          const kit = kits[slug]
          const pc = draft.perClient[slug]?.[version] ?? {}
          return (
            <div key={slug} className="cb-client">
              <div className="cb-client-head">
                <span className="cb-card-dot" style={{ background: kit.colors.brand }} />
                <strong>{kit.clientName}</strong>
              </div>
              <label className="cb-field">
                <span>offer {hint('offer', pc.offer ?? '')}</span>
                <input
                  type="text"
                  value={pc.offer ?? ''}
                  placeholder="e.g. $200 off new braces"
                  onChange={(e) => updatePC(slug, { offer: e.target.value })}
                />
              </label>
              <span className="cb-field-label">photo</span>
              <div className="cb-photo-grid">
                {photos.map((url) => (
                  <button
                    key={url}
                    className={`cb-photo ${pc.photo === url ? 'active' : ''}`}
                    title={photoLabel(url)}
                    onClick={() => updatePC(slug, { photo: url })}
                  >
                    <img src={url} alt={photoLabel(url)} />
                  </button>
                ))}
              </div>
              <label className="cb-check">
                <input
                  type="checkbox"
                  checked={!!pc.makeDifferent}
                  onChange={(e) => updatePC(slug, { makeDifferent: e.target.checked })}
                />{' '}
                Make this client different (override shared copy)
              </label>
              {pc.makeDifferent && (
                <div className="cb-form cb-overrides">
                  {SHARED_FIELDS.map((field) => (
                    <label key={field} className="cb-field">
                      <span>{field}</span>
                      <input
                        type="text"
                        value={pc.override?.[field] ?? draft.shared[version][field] ?? ''}
                        onChange={(e) => setOverride(slug, field, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {previewKit && previewTemplate && (
        <div className="cb-copy-preview">
          <h3>Live preview · {previewKit.clientName}</h3>
          <PreviewDraft
            draft={draft}
            kitSlug={previewKit.slug}
            templateSlug={previewTemplate}
            version={version}
          />
        </div>
      )}
    </div>
  )
}

function PreviewDraft({
  draft,
  kitSlug,
  templateSlug,
  version,
}: {
  draft: FlowDraft
  kitSlug: string
  templateSlug: string
  version: Version
}) {
  return (
    <DeliverablePreview
      draft={draft}
      kit={kits[kitSlug]}
      templateSlug={templateSlug}
      version={version}
      size="Post"
      fitHeight={420}
    />
  )
}
