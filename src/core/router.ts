import { useSyncExternalStore } from 'react'

/** Reads the URL hash as a `/`-delimited path, e.g. `#personas/dr-house` → ['personas','dr-house']. */
function readHash(): string {
  return window.location.hash.replace(/^#\/?/, '')
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Reactive hash path. Returns the raw hash string (without the leading `#`). */
export function useHash(): string {
  return useSyncExternalStore(subscribe, readHash, () => '')
}

/** Split the hash into path segments. */
export function useHashSegments(): string[] {
  const h = useHash()
  return h ? h.split('/').filter(Boolean) : []
}

/** Navigate by setting the hash. */
export function navigate(path: string) {
  window.location.hash = path
}
