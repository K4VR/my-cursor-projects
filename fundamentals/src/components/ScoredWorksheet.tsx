import { formatPercent, formatRatio, formatValue } from '../lib/format.ts'
import type { ScoredRow } from '../types.ts'

export function ScoredWorksheet({
  rows,
  grandTotal,
  totalPossible,
  performanceRating,
  ticker,
}: {
  rows: ScoredRow[]
  grandTotal: number | null
  totalPossible: number
  performanceRating: number | null
  ticker: string
}) {
  return (
    <section className="worksheet-panel">
      <div className="scored-summary">
        <div>
          <span className="scored-label">Grand total</span>
          <strong>{grandTotal ?? '—'}</strong>
          <span className="scored-muted">/ {totalPossible}</span>
        </div>
        <div>
          <span className="scored-label">Performance rating</span>
          <strong>{performanceRating != null ? formatPercent(performanceRating, 0) : '—'}</strong>
        </div>
      </div>

      <table className="worksheet-table scored-table">
        <thead>
          <tr>
            <th>Criteria ↓</th>
            <th>{ticker}</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.isSectionHeader) {
              return (
                <tr key={row.id} className="worksheet-section">
                  <td colSpan={3}>{row.label}</td>
                </tr>
              )
            }

            const value =
              typeof row.value === 'number'
                ? row.label.toLowerCase().includes('growth') || row.label.includes('Yield') || row.label.includes('RO')
                  ? formatPercent(row.value)
                  : formatRatio(row.value)
                : formatValue(row.value)

            return (
              <tr
                key={row.id}
                className={[
                  row.highlight ? `highlight-${row.highlight}` : '',
                  row.isSegmentScore ? 'segment-score' : '',
                  row.isGrandTotal ? 'grand-total' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <td>{row.label}</td>
                <td>
                  {value}
                  {row.scoreDetail ? <span className="score-detail"> {row.scoreDetail}</span> : null}
                </td>
                <td>{row.score != null ? row.score : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
