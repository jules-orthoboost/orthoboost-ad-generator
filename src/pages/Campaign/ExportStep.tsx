import { useState } from 'react'
import { CampaignSchema, type Campaign } from '../../core/schemas'
import {
  deliverableName,
  type CreativeType,
  type Size,
  type Version,
} from '../../core/naming'
import { commitCampaign, downloadJson } from '../../core/persist'
import type { StepProps } from './CampaignBuilder'

const TOKEN_KEY = 'ob_gh_token'
const kebab = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function buildCampaign(draft: StepProps['draft']): Campaign {
  const slug = kebab(`${draft.clientSlug}-${draft.theme}-${draft.year}`)
  return CampaignSchema.parse({
    slug,
    clientSlug: draft.clientSlug,
    adSetType: draft.adSetType,
    theme: draft.theme,
    year: draft.year,
    hifiTemplateSlug: draft.hifiTemplateSlug,
    versions: draft.versions,
  })
}

export function ExportStep({ draft, deps }: StepProps) {
  const [owner, setOwner] = useState('jules-orthoboost')
  const [repo, setRepo] = useState('orthoboost-ad-generator')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  let campaign: Campaign | null = null
  let error: string | null = null
  try {
    campaign = buildCampaign(draft)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  if (!campaign) return <p className="cb-empty">Cannot build campaign: {error}</p>

  const kit = deps.kit!
  const names = (['V1', 'V2'] as Version[]).flatMap((version) =>
    (['Story', 'Post'] as Size[]).flatMap((size) =>
      (['Image', 'Video'] as CreativeType[]).map((creativeType) =>
        deliverableName({
          adSetType: campaign!.adSetType,
          theme: campaign!.theme,
          year: campaign!.year,
          creativeType,
          version,
          size,
          clientName: kit.clientName,
        }),
      ),
    ),
  )

  const commit = async () => {
    if (!token) {
      setStatus('Enter a token first.')
      return
    }
    localStorage.setItem(TOKEN_KEY, token)
    setBusy(true)
    setStatus('Committing…')
    const r = await commitCampaign({ owner, repo, token }, campaign!)
    setBusy(false)
    setStatus(r.ok ? `Committed: ${r.url}` : `Failed: ${r.error}`)
  }

  return (
    <div>
      <h2>Export</h2>
      <p className="muted">
        Campaign id: <code>{campaign.slug}</code>
      </p>

      <h3>8 deliverables</h3>
      <ul className="cb-deliverables">
        {names.map((n) => (
          <li key={n}>
            <code>{n}</code>
          </li>
        ))}
      </ul>

      <div className="cb-export-actions">
        <button className="cb-nav primary" onClick={() => downloadJson(campaign!)}>
          Download campaign JSON
        </button>
      </div>

      <details className="cb-commit">
        <summary>Save to repo (optional)</summary>
        <p className="muted">
          Commits <code>data/campaigns/{campaign.slug}.json</code> via the GitHub API. The token is
          stored only in this browser and never committed.
        </p>
        <div className="cb-form">
          <label className="cb-field">
            <span>Owner</span>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
          <label className="cb-field">
            <span>Repo</span>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} />
          </label>
          <label className="cb-field">
            <span>Fine-grained token</span>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
            />
          </label>
          <button className="cb-nav" disabled={busy} onClick={commit}>
            Commit to repo
          </button>
        </div>
        {status && <p className="cb-status">{status}</p>}
      </details>
    </div>
  )
}
