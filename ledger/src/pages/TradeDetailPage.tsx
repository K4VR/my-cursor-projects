import { Link, useNavigate, useParams } from 'react-router-dom'
import { SideBadge } from '../components/TradeBits'
import { deleteTrade } from '../lib/db'
import { useTrade } from '../lib/hooks'
import { formatDate, formatMoney, formatNumber, formatSignedMoney, pnlClass } from '../lib/money'
import { holdDays, plannedRisk, realizedPnl, rMultiple } from '../lib/stats'
import { isClosed } from '../types'

export function TradeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trade } = useTrade(id)

  if (trade === undefined) return <p className="muted">Loading trade…</p>
  if (!trade) return <div className="empty">That trade is not in this journal.</div>

  const pnl = realizedPnl(trade)
  const r = rMultiple(trade)
  const risk = plannedRisk(trade)
  const hold = holdDays(trade)

  async function handleDelete() {
    if (!confirm(`Delete ${trade.symbol} from the journal? This cannot be undone.`)) return
    await deleteTrade(trade.id)
    navigate('/trades')
  }

  return (
    <div>
      <div className="detail-head">
        <div>
          <p className="ledger-kicker">{isClosed(trade) ? 'Closed trade' : 'Open position'}</p>
          <h1 className="detail-symbol">{trade.symbol}</h1>
          <div className="detail-meta">
            <SideBadge side={trade.side} />
            <span>{formatDate(trade.entryDate)}</span>
            {trade.exitDate ? <span>→ {formatDate(trade.exitDate)}</span> : null}
            {trade.setup ? <span className="ledger-pill">{trade.setup}</span> : null}
            {trade.grade ? <span className="ledger-pill">Grade {trade.grade}</span> : null}
          </div>
        </div>
        <div className="ledger-actions">
          <Link className="l-btn l-btn-primary" to={`/trades/${trade.id}/edit`}>
            Edit
          </Link>
          <button type="button" className="l-btn l-btn-danger" onClick={() => void handleDelete()}>
            Delete
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <p className="label">P&amp;L</p>
          <p className={`value ${pnl == null ? 'pnl-flat' : pnlClass(pnl)}`}>
            {pnl == null ? 'Open' : formatSignedMoney(pnl)}
          </p>
        </article>
        <article className="stat-card">
          <p className="label">R-multiple</p>
          <p className="value">{r == null ? '—' : `${r.toFixed(2)}R`}</p>
        </article>
        <article className="stat-card">
          <p className="label">Planned risk</p>
          <p className="value">{risk == null ? '—' : formatMoney(risk)}</p>
        </article>
        <article className="stat-card">
          <p className="label">Hold</p>
          <p className="value">{hold == null ? '—' : `${hold}d`}</p>
        </article>
      </div>

      <section className="panel" style={{ marginBottom: '0.85rem' }}>
        <h2>Fill</h2>
        <div className="fill-grid">
          <div>
            <span>Quantity</span>
            <strong className="mono">{formatNumber(trade.quantity, 4)}</strong>
          </div>
          <div>
            <span>Fees</span>
            <strong className="mono">{formatMoney(trade.fees)}</strong>
          </div>
          <div>
            <span>Entry</span>
            <strong className="mono">{formatMoney(trade.entryPrice)}</strong>
          </div>
          <div>
            <span>Exit</span>
            <strong className="mono">{trade.exitPrice == null ? '—' : formatMoney(trade.exitPrice)}</strong>
          </div>
          <div>
            <span>Stop</span>
            <strong className="mono">{trade.stopLoss == null ? '—' : formatMoney(trade.stopLoss)}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong className="mono">{trade.takeProfit == null ? '—' : formatMoney(trade.takeProfit)}</strong>
          </div>
        </div>
        {trade.tags.length > 0 ? (
          <div className="pills" style={{ marginTop: '0.85rem' }}>
            {trade.tags.map((tag) => (
              <span className="ledger-pill" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="journal-notes">
        <Note title="Thesis" text={trade.thesis} />
        <Note title="Emotion" text={trade.emotion} />
        <Note title="Mistakes" text={trade.mistakes} />
        <Note title="Lessons" text={trade.lessons} />
      </div>
    </div>
  )
}

function Note({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel note-block">
      <h3>{title}</h3>
      <p>{text.trim() ? text : '—'}</p>
    </section>
  )
}
