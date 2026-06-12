import type { Campaign } from './schemas'

export interface ContentsPayload {
  path: string
  message: string
  contentBase64: string
}

const toBase64 = (s: string) =>
  typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(s)))
    : Buffer.from(s, 'utf8').toString('base64')

export function buildContentsPayload(campaign: Campaign): ContentsPayload {
  const json = JSON.stringify(campaign, null, 2)
  return {
    path: `data/campaigns/${campaign.slug}.json`,
    message: `feat: campaign ${campaign.slug}`,
    contentBase64: toBase64(json),
  }
}

/** Browser download — always available, no token. */
export function downloadJson(campaign: Campaign): void {
  const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${campaign.slug}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface GitHubTarget {
  owner: string
  repo: string
  token: string
}

/** Commit the campaign to the repo via the Contents API. Creates or updates. */
export async function commitCampaign(
  t: GitHubTarget,
  campaign: Campaign,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const p = buildContentsPayload(campaign)
  const api = `https://api.github.com/repos/${t.owner}/${t.repo}/contents/${p.path}`
  const headers = { Authorization: `Bearer ${t.token}`, Accept: 'application/vnd.github+json' }
  try {
    let sha: string | undefined
    const head = await fetch(api, { headers })
    if (head.ok) sha = (await head.json()).sha
    const res = await fetch(api, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: p.message, content: p.contentBase64, sha }),
    })
    if (!res.ok) return { ok: false, error: `${res.status} ${res.statusText}` }
    const body = await res.json()
    return { ok: true, url: body.content?.html_url }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
