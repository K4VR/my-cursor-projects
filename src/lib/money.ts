export function formatMoney(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatSignedMoney(value: number, currency = 'USD'): string {
  const formatted = formatMoney(Math.abs(value), currency)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPct(value: number, digits = 1): string {
  const pct = value * 100
  const body = `${Math.abs(pct).toFixed(digits)}%`
  if (pct > 0) return `+${body}`
  if (pct < 0) return `−${body}`
  return body
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function pnlClass(value: number | null | undefined): string {
  if (value == null || value === 0) return 'pnl-flat'
  return value > 0 ? 'pnl-pos' : 'pnl-neg'
}
