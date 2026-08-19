import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdjustFillForm } from '../components/AdjustFillForm'
import { SideBadge } from '../components/TradeBits'
import { deleteTrade } from '../lib/db'
import { useTrade } from '../lib/hooks'
import { formatDate, formatMoney, formatNumber, formatSignedMoney, pnlClass } from '../lib/money'
import { fillsOf, isScaled, positionState, removeFill } from '../lib/position'
import { holdDays, plannedRisk, realizedPnl, rMultiple } from '../lib/stats'

export function TradeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trade, persist } = useTrade(id)

  if (trade === undefined) return <p className="muted">Loading trade…</p>
  if (!trade) return <div className="empty">That trade is not in this journal.</div>

  const state = positionState(trade)
  const pnl = realizedPnl(trade)
  const r = rMultiple(trade)
  const risk = plannedRisk(trade)
  const hold = holdDays(trade)
  const fills = fillsOf(trade)
  const canDeleteFill = fills.length > 1

  async function handleDelete() {
    if (!confirm(`Delete ${trade.symbol} from the journal? This cannot be undone.`)) return
    await deleteTrade(trade.id)
    navigate('/trades')
  }

  async function handleRemoveFill(fillId: string) {
    try {
      await persist(removeFill(trade, fillId))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not remove that fill.')
    }
  }

  return (
    <div>
      <div className="detail-head">
        <div>
          <p className="ledger-kicker">{state.closed ? 'Closed trade' : 'Open position'}</p>
          <h1 className="detail-symbol">{trade.symbol}</h1>
          <div className="detail-meta">
            <SideBadge side={trade.side} />
            <span>{formatDate(trade.entryDate)}</span>
            {state.lastTrimDate ? <span>→ {formatDate(state.lastTrimDate)}</span> : null}
            {isScaled(trade) ? <span className="ledger-pill">Scaled</span> : null}
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
          <p className="label">{state.closed ? 'P&L' : 'Booked P&L'}</p>
          <p className={`value ${pnl == null || pnl === 0 ? 'pnl-flat' : pnlClass(pnl)}`}>
            {pnl == null ? 'Open' : formatSignedMoney(pnl)}
          </p>
        </article>
        <article className="stat-card">
          <p className="label">{state.closed ? 'Quantity' : 'Open qty'}</p>
          <p className="value">
            {formatNumber(state.closed ? state.added : state.remaining, 4)}
          </p>
          {!state.closed && state.added !== state.remaining ? (
            <p className="hint">of {formatNumber(state.added, 4)} added</p>
          ) : null}
        </article>
        <article className="stat-card">
          <p className="label">Avg entry</p>
          <p className="value">{state.avgEntry == null ? '—' : formatMoney(state.avgEntry)}</p>
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

      <AdjustFillForm trade={trade} onSave={persist} />

      <section className="panel" style={{ marginBottom: '0.85rem' }}>
        <h2>Fills</h2>
        <div className="trade-table-wrap">
                          <table className="trade-table fill-log">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Fees</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fills.map((fill) => (
                <tr key={fill.id}>
                  <td className="muted">{formatDate(fill.date)}</td>
                  <td>
                    <span className={fill.kind === 'add' ? 'side-long' : 'side-short'}>
                      {fill.kind}
                    </span>
                  </td>
                  <td className="mono">{formatNumber(fill.quantity, 4)}</td>
                  <td className="mono">{formatMoney(fill.price)}</td>
                  <td className="mono">{formatMoney(fill.fees)}</td>
                  <td>{fill.note || '—'}</td>
                  <td>
                    {canDeleteFill ? (
                      <button
                        type="button"
                        className="l-btn l-btn-danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleRemoveFill(fill.id)
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="fill-grid" style={{ marginTop: '1rem' }}>
          <div>
            <span>Stop</span>
            <strong className="mono">{trade.stopLoss == null ? '—' : formatMoney(trade.stopLoss)}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong className="mono">{trade.takeProfit == null ? '—' : formatMoney(trade.takeProfit)}</strong>
          </div>
          <div>
            <span>Fees</span>
            <strong className="mono">{formatMoney(state.fees)}</strong>
          </div>
          <div>
            <span>Avg exit</span>
            <strong className="mono">{state.trimVwap == null ? '—' : formatMoney(state.trimVwap)}</strong>
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
