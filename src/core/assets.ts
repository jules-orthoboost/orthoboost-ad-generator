/** Resolve a stored asset path to a served URL, idempotently.
 * Accepts a full http(s) URL (returned as-is), an already-based URL, or a logical
 * path like "assets/photos/x.svg" (prefixed with BASE_URL). */
export function resolveAsset(p: string): string {
  if (!p) return p
  if (/^https?:\/\//.test(p)) return p
  const base = import.meta.env.BASE_URL
  if (p.startsWith(base)) return p
  return `${base}${p.replace(/^\//, '')}`
}
