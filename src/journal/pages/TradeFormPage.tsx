import { useNavigate, useParams } from 'react-router-dom'
import { TradeForm } from '../components/TradeForm'
import { saveTrade } from '../lib/db'
import { useTrade } from '../lib/hooks'
import { emptyTrade, newTradeId, type Trade } from '../types'

export function TradeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const { trade, persist } = useTrade(isNew ? undefined : id)

  if (!isNew && trade === undefined) return <p className="muted">Loading trade…</p>
  if (!isNew && trade === null) return <div className="empty">That trade is not in this journal.</div>

  return (
    <div>
      <header className="ledger-hero">
        <div>
          <p className="ledger-kicker">{isNew ? 'New' : 'Edit'}</p>
          <h1>{isNew ? 'Log a trade' : `Edit ${trade?.symbol}`}</h1>
        </div>
      </header>
      <TradeForm
        initial={trade}
        submitLabel={isNew ? 'Save trade' : 'Save changes'}
        onCancel={() => navigate(isNew ? '/journal/trades' : `/journal/trades/${id}`)}
        onSubmit={async (draft) => {
          if (isNew) {
            const next: Trade = {
              ...emptyTrade(),
              ...draft,
              id: newTradeId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            await saveTrade(next)
            navigate(`/journal/trades/${next.id}`)
            return
          }
          if (!trade) return
          await persist({ ...trade, ...draft })
          navigate(`/journal/trades/${trade.id}`)
        }}
      />
    </div>
  )
}
