import { Link, useNavigate } from 'react-router-dom'
import { EquityChart } from '../components/EquityChart'
import { PnlText, SideBadge, TradeCard } from '../components/TradeBits'
import { useJournal } from '../lib/hooks'
import { formatMoney, formatNumber, formatPct, formatSignedMoney, pnlClass } from '../lib/money'
import { realizedPnl, rMultiple, summarize } from '../lib/stats'

export function DashboardPage() {
  const { trades, settings, ready } = useJournal()
  const navigate = useNavigate()
  if (!ready) return <p className="muted">Loading journal…</p>

  const summary = summarize(trades, settings.startingCapital)
  const equity = summary.equity.at(-1)?.equity ?? settings.startingCapital

  return (
    <div>
      <header className="ledger-hero">
        <div>
          <p className="ledger-kicker">Overview</p>
          <h1>Dashboard</h1>
          <p className="ledger-lede">
            Realized P&amp;L, risk, and review notes stay in this browser. Nothing is uploaded.
          </p>
        </div>
        <div className="ledger-actions">
          <Link className="l-btn l-btn-primary" to="/journal/trades/new">
            Log trade
          </Link>
          <Link className="l-btn" to="/journal/trades">
            All trades
          </Link>
        </div>
      </header>

      {trades.length === 0 ? (
        <div className="empty">
          No trades yet. Log the first one, or load the demo book from{' '}
          <Link to="/journal/settings">Settings</Link> to explore the dashboard.
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <article className="stat-card">
              <p className="label">Net P&amp;L</p>
              <p className={`value ${pnlClass(summary.totalPnl)}`}>{formatSignedMoney(summary.totalPnl)}</p>
              <p className="hint">{summary.closed.length} closed trades</p>
            </article>
            <article className="stat-card">
              <p className="label">Equity</p>
              <p className="value">{formatMoney(equity)}</p>
              <p className="hint">Start {formatMoney(settings.startingCapital)}</p>
            </article>
            <article className="stat-card">
              <p className="label">Win rate</p>
              <p className="value">{formatPct(summary.winRate)}</p>
              <p className="hint">
                {summary.wins.length}W / {summary.losses.length}L
              </p>
            </article>
            <article className="stat-card">
              <p className="label">Profit factor</p>
              <p className="value">
                {summary.profitFactor == null ? '∞' : formatNumber(summary.profitFactor)}
              </p>
              <p className="hint">Expectancy {formatSignedMoney(summary.expectancy)}</p>
            </article>
            <article className="stat-card">
              <p className="label">Avg R</p>
              <p className="value">{summary.avgR == null ? '—' : `${summary.avgR.toFixed(2)}R`}</p>
              <p className="hint">
                Hold {summary.avgHoldDays == null ? '—' : `${summary.avgHoldDays.toFixed(1)}d`}
              </p>
            </article>
            <article className="stat-card">
              <p className="label">Max drawdown</p>
              <p className={`value ${pnlClass(-summary.drawdown.amount)}`}>
                {formatSignedMoney(-summary.drawdown.amount)}
              </p>
              <p className="hint">{formatPct(-summary.drawdown.pct)} from peak</p>
            </article>
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <h2>Equity curve</h2>
              <EquityChart points={summary.equity} startingCapital={settings.startingCapital} />
            </section>
            <div className="stack">
              <section className="panel">
                <h2>Open positions ({summary.open.length})</h2>
                {summary.open.length === 0 ? (
                  <p className="muted">No open trades.</p>
                ) : (
                  <div className="stack">
                    {summary.open.map((trade) => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                )}
              </section>
              <section className="panel">
                <h2>Streak</h2>
                <p className="value mono" style={{ margin: 0, fontSize: '1.2rem' }}>
                  {summary.currentStreak.kind === 'none'
                    ? 'No closed streak'
                    : `${summary.currentStreak.length} ${summary.currentStreak.kind}${summary.currentStreak.length === 1 ? '' : 's'}`}
                </p>
                {summary.bestTrade ? (
                  <p className="hint" style={{ marginTop: '0.7rem' }}>
                    Best {summary.bestTrade.symbol}{' '}
                    <span className={pnlClass(realizedPnl(summary.bestTrade) ?? 0)}>
                      {formatSignedMoney(realizedPnl(summary.bestTrade) ?? 0)}
                    </span>
                    {summary.worstTrade ? (
                      <>
                        {' '}
                        · Worst {summary.worstTrade.symbol}{' '}
                        <span className={pnlClass(realizedPnl(summary.worstTrade) ?? 0)}>
                          {formatSignedMoney(realizedPnl(summary.worstTrade) ?? 0)}
                        </span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </section>
            </div>
          </div>

          <section className="panel" style={{ marginTop: '0.85rem' }}>
            <h2>Recent closed trades</h2>
            {summary.closed.length === 0 ? (
              <p className="muted">Nothing closed yet.</p>
            ) : (
              <div className="trade-table-wrap desktop-table">
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>Exit</th>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th>P&amp;L</th>
                      <th>R</th>
                      <th>Setup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...summary.closed].reverse().slice(0, 8).map((trade) => {
                      const r = rMultiple(trade)
                      return (
                        <tr key={trade.id} onClick={() => navigate(`/journal/trades/${trade.id}`)}>
                          <td className="muted">{trade.exitDate}</td>
                          <td>
                            <Link to={`/journal/trades/${trade.id}`}>{trade.symbol}</Link>
                          </td>
                          <td>
                            <SideBadge side={trade.side} />
                          </td>
                          <td>
                            <PnlText trade={trade} />
                          </td>
                          <td className="mono">{r == null ? '—' : `${r.toFixed(2)}R`}</td>
                          <td>{trade.setup || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mobile-cards" style={{ marginTop: '0.6rem' }}>
              {[...summary.closed]
                .reverse()
                .slice(0, 6)
                .map((trade) => (
                  <TradeCard key={trade.id} trade={trade} />
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
