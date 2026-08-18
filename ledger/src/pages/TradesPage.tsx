import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PnlText, SideBadge, TradeCard } from '../components/TradeBits'
import { useJournal } from '../lib/hooks'
import { formatDate, formatNumber } from '../lib/money'
import { rMultiple } from '../lib/stats'
import { isClosed } from '../types'

export function TradesPage() {
  const { trades, ready } = useJournal()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')

  useEffect(() => {
    const next = params.get('q')
    if (next) setQuery(next)
  }, [params])
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>('all')
  const [side, setSide] = useState<'all' | 'long' | 'short'>('all')
  const [setup, setSetup] = useState('all')

  const setups = useMemo(
    () => [...new Set(trades.map((t) => t.setup).filter(Boolean))].sort(),
    [trades],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase()
    return trades.filter((trade) => {
      if (q && !trade.symbol.includes(q) && !trade.setup.toUpperCase().includes(q)) return false
      if (status === 'open' && isClosed(trade)) return false
      if (status === 'closed' && !isClosed(trade)) return false
      if (side !== 'all' && trade.side !== side) return false
      if (setup !== 'all' && trade.setup !== setup) return false
      return true
    })
  }, [trades, query, status, side, setup])

  if (!ready) return <p className="muted">Loading trades…</p>

  return (
    <div>
      <header className="ledger-hero">
        <div>
          <p className="ledger-kicker">Log</p>
          <h1>Trades</h1>
          <p className="ledger-lede">
            {filtered.length} shown{filtered.length !== trades.length ? ` of ${trades.length}` : ''}.
          </p>
        </div>
        <Link className="l-btn l-btn-primary" to="/trades/new">
          Log trade
        </Link>
      </header>

      <div className="filter-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol or setup"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select value={side} onChange={(e) => setSide(e.target.value as typeof side)}>
          <option value="all">Long &amp; short</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
        <select value={setup} onChange={(e) => setSetup(e.target.value)}>
          <option value="all">All setups</option>
          {setups.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No trades match those filters.</div>
      ) : (
        <>
          <div className="panel desktop-table">
            <div className="trade-table-wrap">
              <table className="trade-table">
                <thead>
                  <tr>
                    <th>Entry</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Qty</th>
                    <th>Entry $</th>
                    <th>Exit $</th>
                    <th>P&amp;L</th>
                    <th>R</th>
                    <th>Setup</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((trade) => {
                    const r = rMultiple(trade)
                    return (
                      <tr key={trade.id} onClick={() => navigate(`/trades/${trade.id}`)}>
                        <td className="muted">{formatDate(trade.entryDate)}</td>
                        <td className="mono">{trade.symbol}</td>
                        <td>
                          <SideBadge side={trade.side} />
                        </td>
                        <td className="mono">{formatNumber(trade.quantity, 0)}</td>
                        <td className="mono">{formatNumber(trade.entryPrice)}</td>
                        <td className="mono">{trade.exitPrice == null ? '—' : formatNumber(trade.exitPrice)}</td>
                        <td>
                          <PnlText trade={trade} />
                        </td>
                        <td className="mono">{r == null ? '—' : `${r.toFixed(2)}R`}</td>
                        <td>{trade.setup || '—'}</td>
                        <td>{trade.grade ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mobile-cards">
            {filtered.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
