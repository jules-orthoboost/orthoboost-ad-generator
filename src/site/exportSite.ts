import { makeZip } from '../core/zip'
import { renderSiteHtml, type SiteInput } from './renderSiteHtml'

async function toDataUri(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

/** Inline the assets, render the standalone page, zip it, and trigger a download. */
export async function exportSiteZip(
  input: Omit<SiteInput, 'logoSrc' | 'photoSrc'> & { logoUrl: string; photoUrl?: string },
  slug: string,
): Promise<void> {
  const logoSrc = await toDataUri(input.logoUrl)
  const photoSrc = input.photoUrl ? await toDataUri(input.photoUrl) : undefined
  const html = renderSiteHtml({ ...input, logoSrc, photoSrc })
  const zip = makeZip([{ name: 'index.html', data: new TextEncoder().encode(html) }])
  const blob = new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${slug}-site.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}
