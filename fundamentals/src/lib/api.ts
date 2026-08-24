/** API base URL. Empty string = same origin (Render full-stack). */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  return `${base}${path}`
}

export async function analyzeTicker(ticker: string) {
  const resp = await fetch(apiUrl(`/api/analyze/${encodeURIComponent(ticker)}`))
  const data = await resp.json()
  if (!resp.ok) {
    throw new Error(data.error ?? 'Analysis failed.')
  }
  return data
}

export function isLikelyStaticHost(): boolean {
  if (import.meta.env.VITE_API_URL) return false
  const host = window.location.hostname
  return host.includes('github.io')
}
