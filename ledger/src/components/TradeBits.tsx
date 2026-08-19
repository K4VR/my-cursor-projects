import { Link } from 'react-router-dom'
import { formatNumber, formatSignedMoney, pnlClass } from '../lib/money'
import { isClosed, positionState } from '../lib/position'
import type { Trade } from '../types'
import { realizedPnl } from '../lib/stats'

export function SideBadge({ side }: { side: Trade['side'] }) {
  return <span className={side === 'long' ? 'side-long' : 'side-short'}>{side}</span>
}

export function PnlText({ trade }: { trade: Trade }) {
  const state = positionState(trade)
  const pnl = realizedPnl(trade)
  if (pnl == null) return <span className="muted">Open</span>
  if (!state.closed) {
    return (
      <span className={`mono ${pnlClass(pnl)}`}>
        {formatSignedMoney(pnl)} booked
      </span>
    )
  }
  return <span className={`mono ${pnlClass(pnl)}`}>{formatSignedMoney(pnl)}</span>
}

export function TradeCard({ trade, accountName }: { trade: Trade; accountName?: string }) {
  const state = positionState(trade)
  return (
    <Link className="panel trade-card" to={`/trades/${trade.id}`}>
      <header>
        <strong>{trade.symbol}</strong>
        <PnlText trade={trade} />
      </header>
      <div className="detail-meta">
        <SideBadge side={trade.side} />
        <span className="muted">{trade.entryDate}</span>
        {accountName ? <span className="ledger-pill">{accountName}</span> : null}
        {trade.setup ? <span className="ledger-pill">{trade.setup}</span> : null}
        {isClosed(trade) ? null : (
          <span className="ledger-pill">{formatNumber(state.remaining, 0)} open</span>
        )}
      </div>
    </Link>
  )
}
