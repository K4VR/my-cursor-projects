export function formatPercent(value: number | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

export function formatRatio(value: number | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

export function formatMarginYoY(value: number | 'Improved' | 'Decreased' | ''): string {
  if (value === '') return '—'
  if (value === 'Improved' || value === 'Decreased') return value
  return formatPercent(value)
}

export function formatValue(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') {
    if (Math.abs(value) <= 1 && !Number.isInteger(value)) return formatPercent(value)
    return formatRatio(value)
  }
  return String(value)
}
