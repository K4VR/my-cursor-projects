import { Link } from 'react-router-dom'
import { formatSignedMoney, pnlClass } from '../lib/money'
import { isClosed, type Trade } from '../types'
import { realizedPnl } from '../lib/stats'

export function SideBadge({ side }: { side: Trade['side'] }) {
  return <span className={side === 'long' ? 'side-long' : 'side-short'}>{side}</span>
}

export function PnlText({ trade }: { trade: Trade }) {
  const pnl = realizedPnl(trade)
  if (pnl == null) return <span className="muted">Open</span>
  return <span className={`mono ${pnlClass(pnl)}`}>{formatSignedMoney(pnl)}</span>
}

export function TradeCard({ trade }: { trade: Trade }) {
  return (
    <Link className="panel trade-card" to={`/journal/trades/${trade.id}`}>
      <header>
        <strong>{trade.symbol}</strong>
        <PnlText trade={trade} />
      </header>
      <div className="detail-meta">
        <SideBadge side={trade.side} />
        <span className="muted">{trade.entryDate}</span>
        {trade.setup ? <span className="ledger-pill">{trade.setup}</span> : null}
        {isClosed(trade) ? null : <span className="ledger-pill">Open</span>}
      </div>
    </Link>
  )
}
