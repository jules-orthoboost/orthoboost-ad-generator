import { useRef, type ChangeEvent } from 'react'
import clsx from 'clsx'
import { loadBrandKits, loadPhotoLibrary } from '../../core/data'
import { fitProblem, type PerClientVersion } from '../../core/gates'
import type { PersonaCopyVersion } from '../../core/data'
import type { Range } from '../../core/schemas'
import { Field, Label } from '../../components/catalyst/fieldset'
import { Input } from '../../components/catalyst/input'
import { Textarea } from '../../components/catalyst/textarea'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { DeliverablePreview } from './DeliverablePreview'
import { SectionLabel, StepIntro } from './ui'
import type { StepProps } from './CampaignBuilder'

const kits = loadBrandKits()
const photos = loadPhotoLibrary()
const photoLabel = (url: string) => decodeURIComponent(url.split('/').pop() ?? url).replace(/\.\w+$/, '')

const SHARED_FIELDS: (keyof PersonaCopyVersion)[] = ['headline', 'subhead', 'cta', 'disclaimer']
const LABELS: Record<string, string> = {
  headline: 'Headline',
  subhead: 'Subhead',
  cta: 'Call to action',
  disclaimer: 'Disclaimer',
  offer: 'Offer',
}

export function CopyStep({ draft, setDraft, deps }: StepProps) {
  const previewKit = deps.kits[0]
  const previewTemplate = draft.templateSlugs[0]

  const HIGHLIGHTABLE = ['headline', 'subhead'] as const
  const fieldRefs = {
    headline: useRef<HTMLTextAreaElement>(null),
    subhead: useRef<HTMLTextAreaElement>(null),
  }
  const addHighlight = (field: 'headline' | 'subhead') => {
    const el = fieldRefs[field].current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start == null || end == null || start >= end) return
    setDraft((d) => {
      const cur = d.sharedHighlights?.[field] ?? []
      const next: Range[] = [...cur, { start, end }]
      return { ...d, sharedHighlights: { ...d.sharedHighlights, [field]: next } }
    })
  }
  const removeHighlight = (field: 'headline' | 'subhead', i: number) =>
    setDraft((d) => {
      const cur = d.sharedHighlights?.[field] ?? []
      return { ...d, sharedHighlights: { ...d.sharedHighlights, [field]: cur.filter((_, j) => j !== i) } }
    })

  const setShared = (field: keyof PersonaCopyVersion, value: string) =>
    setDraft((d) => ({ ...d, shared: { ...d.shared, [field]: value } }))

  const updatePC = (brand: string, patch: Partial<PerClientVersion>) =>
    setDraft((d) => {
      const cur = d.perClient[brand] ?? {}
      return { ...d, perClient: { ...d.perClient, [brand]: { ...cur, ...patch } } }
    })

  const setOverride = (brand: string, field: keyof PersonaCopyVersion, value: string) =>
    setDraft((d) => {
      const cur = d.perClient[brand] ?? {}
      const ov = { ...(cur.override ?? {}), [field]: value }
      return { ...d, perClient: { ...d.perClient, [brand]: { ...cur, override: ov } } }
    })

  // Editor affordances any selected template opts into (see manifest.fields).
  const richOffer = deps.templates.some((t) => t.manifest.fields?.richOffer)
  const showSocial = deps.templates.some((t) => t.manifest.fields?.socialProof)

  const onUpload = (brand: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updatePC(brand, { photo: String(reader.result) })
    reader.readAsDataURL(file) // inline data URL: self-contained for preview + export
  }

  const hint = (field: string, text: string) => {
    const p = fitProblem(text ?? '', deps.archetypes, field)
    return p ? <span className="ml-2 text-xs font-semibold text-red-600">{p}</span> : null
  }

  return (
    <div>
      <StepIntro title="Write the copy">
        Headline, subhead, CTA and disclaimer are shared across every client on this persona. Offer, social proof
        and photo are per client — and you can override any shared line for a single client.
      </StepIntro>

      <SectionLabel>Shared across all {deps.kits.length} clients</SectionLabel>
      <div className="max-w-xl space-y-5">
        {SHARED_FIELDS.map((field) => {
          const value = draft.shared[field] ?? ''
          const multiline = field === 'headline' || field === 'subhead'
          const highlightable = (HIGHLIGHTABLE as readonly string[]).includes(field)
          return (
            <Field key={field}>
              <Label>
                {LABELS[field]}
                {hint(field, value)}
              </Label>
              {multiline ? (
                <Textarea
                  ref={highlightable ? fieldRefs[field as 'headline' | 'subhead'] : undefined}
                  rows={2}
                  value={value}
                  onChange={(e) => setShared(field, e.target.value)}
                />
              ) : (
                <Input value={value} onChange={(e) => setShared(field, e.target.value)} />
              )}
              {highlightable && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addHighlight(field as 'headline' | 'subhead')}
                    className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-700"
                  >
                    Highlight selection
                  </button>
                  {(draft.sharedHighlights?.[field as 'headline' | 'subhead'] ?? []).map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-zinc-900"
                    >
                      {value.slice(r.start, r.end) || '…'}
                      <button
                        type="button"
                        onClick={() => removeHighlight(field as 'headline' | 'subhead', i)}
                        className="font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          )
        })}
      </div>

      <SectionLabel>Per client — offer, photo &amp; overrides</SectionLabel>
      <div className="space-y-4">
        {draft.brandSlugs.map((slug) => {
          const kit = kits[slug]
          const pc = draft.perClient[slug] ?? {}
          return (
            <div key={slug} className="rounded-xl border border-zinc-950/10 p-4">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="size-3.5 shrink-0 rounded-md ring-1 ring-black/10"
                  style={{ background: kit.colors.brand }}
                />
                <strong className="font-semibold text-zinc-950">{kit.clientName}</strong>
              </div>

              <div className="space-y-5">
                {richOffer ? (
                  <div className="space-y-3">
                    <Field>
                      <Label>Offer label</Label>
                      <Input
                        value={pc.offerLabel ?? ''}
                        placeholder="Plans as low as"
                        onChange={(e) => updatePC(slug, { offerLabel: e.target.value })}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <Label>
                          Amount
                          {hint('offer', pc.offer ?? '')}
                        </Label>
                        <Input
                          value={pc.offer ?? ''}
                          placeholder="$99"
                          onChange={(e) => updatePC(slug, { offer: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <Label>Unit</Label>
                        <Input
                          value={pc.offerUnit ?? ''}
                          placeholder="/mo"
                          onChange={(e) => updatePC(slug, { offerUnit: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field>
                      <Label>Offer fine print</Label>
                      <Input
                        value={pc.offerFine ?? ''}
                        placeholder="$0 down · 0% financing"
                        onChange={(e) => updatePC(slug, { offerFine: e.target.value })}
                      />
                    </Field>
                  </div>
                ) : (
                  <Field>
                    <Label>
                      Offer
                      {hint('offer', pc.offer ?? '')}
                    </Label>
                    <Input
                      value={pc.offer ?? ''}
                      placeholder="e.g. $200 off new braces"
                      onChange={(e) => updatePC(slug, { offer: e.target.value })}
                    />
                  </Field>
                )}

                {showSocial && (
                  <div className="grid grid-cols-[96px_1fr] gap-3">
                    <Field>
                      <Label>Rating</Label>
                      <Input
                        value={pc.rating ?? ''}
                        placeholder="4.9"
                        onChange={(e) => updatePC(slug, { rating: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Social proof</Label>
                      <Input
                        value={pc.socialProof ?? ''}
                        placeholder="2,000+ local smiles"
                        onChange={(e) => updatePC(slug, { socialProof: e.target.value })}
                      />
                    </Field>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-zinc-950">Photo</span>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {photos.map((url) => (
                      <button
                        key={url}
                        type="button"
                        title={photoLabel(url)}
                        onClick={() => updatePC(slug, { photo: url })}
                        className={clsx(
                          'size-16 overflow-hidden rounded-lg ring-2 transition',
                          pc.photo === url ? 'ring-sky-500' : 'ring-transparent hover:ring-zinc-300',
                        )}
                      >
                        <img src={url} alt={photoLabel(url)} className="size-full object-cover" />
                      </button>
                    ))}
                    <label
                      title="Upload a custom photo"
                      className="flex size-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-[11px] font-medium text-zinc-500 transition hover:border-zinc-400"
                    >
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onUpload(slug, e)}
                      />
                    </label>
                    {pc.photo?.startsWith('data:') && (
                      <img
                        src={pc.photo}
                        alt="Uploaded"
                        className="size-16 rounded-lg object-cover ring-2 ring-sky-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <CheckboxField>
                  <Checkbox
                    checked={!!pc.makeDifferent}
                    onChange={(checked) => updatePC(slug, { makeDifferent: checked })}
                  />
                  <Label>Make this client different (override shared copy)</Label>
                </CheckboxField>
              </div>

              {pc.makeDifferent && (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {SHARED_FIELDS.map((field) => (
                    <Field key={field}>
                      <Label>{LABELS[field]}</Label>
                      <Input
                        value={pc.override?.[field] ?? draft.shared[field] ?? ''}
                        onChange={(e) => setOverride(slug, field, e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {previewKit && previewTemplate && (
        <>
          <SectionLabel>Live preview · {previewKit.clientName}</SectionLabel>
          <div className="flex justify-center rounded-xl bg-zinc-100 p-6">
            <DeliverablePreview
              draft={draft}
              kit={kits[previewKit.slug]}
              templateSlug={previewTemplate}
              size="Post"
              fitHeight={420}
            />
          </div>
        </>
      )}
    </div>
  )
}
