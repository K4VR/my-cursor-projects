import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useJournal } from '../lib/hooks'
import { formatMoney, formatNumber, formatPct, formatSignedMoney, pnlClass } from '../lib/money'
import { groupBy, summarize, weekdayLabel, type GroupStats } from '../lib/stats'

export function AnalyticsPage() {
  const { filteredTrades, activeCapital, activeAccountId, activeAccount, accountLabel, ready } = useJournal()
  const trades = filteredTrades
  const summary = useMemo(() => summarize(trades, activeCapital), [trades, activeCapital])
  const bySymbol = useMemo(() => groupBy(trades, (t) => t.symbol), [trades])
  const bySetup = useMemo(() => groupBy(trades, (t) => t.setup || 'Unspecified'), [trades])
  const bySide = useMemo(() => groupBy(trades, (t) => t.side), [trades])
  const byGrade = useMemo(() => groupBy(trades, (t) => t.grade ?? 'Ungraded'), [trades])
  const byWeekday = useMemo(() => groupBy(trades, (t) => weekdayLabel(t.exitDate ?? t.entryDate)), [trades])
  const byAccount = useMemo(() => groupBy(trades, (t) => accountLabel(t.accountId)), [trades, accountLabel])
  const scope = activeAccountId === 'all' ? 'All accounts' : activeAccount?.name ?? 'Account'

  if (!ready) return <p className="muted">Loading analytics…</p>

  if (summary.closed.length === 0) {
    return (
      <div>
        <header className="ledger-hero">
          <div>
            <p className="ledger-kicker">{scope}</p>
            <h1>Analytics</h1>
          </div>
        </header>
        <div className="empty">Close at least one trade to see breakdowns by symbol, setup, and grade.</div>
      </div>
    )
  }

  return (
    <div>
      <header className="ledger-hero">
        <div>
          <p className="ledger-kicker">{scope}</p>
          <h1>Analytics</h1>
          <p className="ledger-lede">
            Closed-trade breakdowns. Open positions are excluded until they are booked.
          </p>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p className="label">Avg win</p>
          <p className={`value ${pnlClass(summary.avgWin)}`}>{formatSignedMoney(summary.avgWin)}</p>
        </article>
        <article className="stat-card">
          <p className="label">Avg loss</p>
          <p className={`value ${summary.avgLoss ? 'pnl-neg' : 'pnl-flat'}`}>
            {summary.avgLoss ? formatSignedMoney(-summary.avgLoss) : formatMoney(0)}
          </p>
        </article>
        <article className="stat-card">
          <p className="label">Long vs short</p>
          <p className="value" style={{ fontSize: '1rem' }}>
            {bySide.map((g) => `${g.key} ${formatSignedMoney(g.pnl)}`).join(' · ') || '—'}
          </p>
        </article>
        <article className="stat-card">
          <p className="label">Closed</p>
          <p className="value">{summary.closed.length}</p>
        </article>
      </div>

      <div className="stack">
        {activeAccountId === 'all' ? <GroupTable title="By account" rows={byAccount} /> : null}
        <GroupTable title="By symbol" rows={bySymbol} />
        <GroupTable title="By setup" rows={bySetup} />
        <GroupTable title="By grade" rows={byGrade} />
        <GroupTable title="By weekday (exit)" rows={byWeekday} />
      </div>
    </div>
  )
}

function GroupTable({ title, rows }: { title: string; rows: GroupStats[] }) {
  if (rows.length === 0) return null
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="trade-table-wrap">
        <table className="trade-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Trades</th>
              <th>Win %</th>
              <th>P&amp;L</th>
              <th>Avg</th>
              <th>Avg R</th>
              <th>PF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  {title === 'By symbol' ? (
                    <Link to={`/trades?q=${encodeURIComponent(row.key)}`}>{row.key}</Link>
                  ) : (
                    row.key
                  )}
                </td>
                <td className="mono">{row.trades}</td>
                <td className="mono">{formatPct(row.winRate)}</td>
                <td className={`mono ${pnlClass(row.pnl)}`}>{formatSignedMoney(row.pnl)}</td>
                <td className={`mono ${pnlClass(row.avgPnl)}`}>{formatSignedMoney(row.avgPnl)}</td>
                <td className="mono">{row.avgR == null ? '—' : `${row.avgR.toFixed(2)}R`}</td>
                <td className="mono">
                  {row.profitFactor == null ? '∞' : formatNumber(row.profitFactor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
