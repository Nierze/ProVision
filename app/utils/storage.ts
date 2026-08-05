/**
 * localStorage with the sharp edges filed off: private-browsing quota errors,
 * corrupt JSON from an interrupted write, and the server having no `window` at
 * all all resolve to "use the fallback" rather than a blank screen.
 */

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Out of quota or blocked. Losing the write beats losing the session.
  }
}
