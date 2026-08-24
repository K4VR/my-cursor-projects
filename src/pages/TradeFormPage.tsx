import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TradeForm } from '../components/TradeForm'
import { visibleAccounts } from '../lib/accounts'
import { saveTrade } from '../lib/db'
import { useJournal, useTrade } from '../lib/hooks'
import { emptyTrade, newTradeId, type Trade } from '../types'

export function TradeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const { trade, persist } = useTrade(isNew ? undefined : id)
  const { accounts, defaultAccountId, settings, updateSettings, refresh } = useJournal()

  const formAccounts = useMemo(() => {
    const visible = visibleAccounts(accounts)
    if (trade?.accountId && !visible.some((account) => account.id === trade.accountId)) {
      const hidden = accounts.find((account) => account.id === trade.accountId)
      return hidden ? [...visible, hidden] : visible
    }
    return visible
  }, [accounts, trade])

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
        accounts={formAccounts}
        defaultAccountId={defaultAccountId}
        submitLabel={isNew ? 'Save trade' : 'Save changes'}
        onCancel={() => navigate(isNew ? '/trades' : `/trades/${id}`)}
        onSubmit={async (draft) => {
          if (isNew) {
            const next: Trade = {
              ...emptyTrade(defaultAccountId),
              ...draft,
              id: newTradeId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            await saveTrade(next)
            await updateSettings({ ...settings, lastTradeAccountId: next.accountId })
            refresh()
            navigate(`/trades/${next.id}`)
            return
          }
          if (!trade) return
          await persist({ ...trade, ...draft })
          await updateSettings({ ...settings, lastTradeAccountId: draft.accountId })
          navigate(`/trades/${trade.id}`)
        }}
      />
    </div>
  )
}
