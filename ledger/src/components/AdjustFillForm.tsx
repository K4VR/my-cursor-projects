import { useState, type FormEvent } from 'react'
import type { FillKind, Trade } from '../types'
import { applyFill, positionState } from '../lib/position'
import { formatMoney, formatNumber, formatSignedMoney } from '../lib/money'

export function AdjustFillForm({
  trade,
  onSave,
}: {
  trade: Trade
  onSave: (next: Trade) => Promise<void>
}) {
  const state = positionState(trade)
  const [kind, setKind] = useState<FillKind>('add')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fees, setFees] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (state.closed) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const qty = Number(quantity)
    const px = Number(price)
    const fee = Number(fees) || 0
    if (!(qty > 0) || !(px > 0)) {
      setError('Quantity and price must be greater than zero.')
      return
    }
    if (kind === 'trim' && qty > state.remaining + 1e-9) {
      setError(`Trim cannot exceed the ${formatNumber(state.remaining, 4)} still open.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(applyFill(trade, { kind, date, price: px, quantity: qty, fees: fee, note }))
      setQuantity('')
      setPrice('')
      setFees('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that fill.')
    } finally {
      setSaving(false)
    }
  }

  const trimCloses = kind === 'trim' && Number(quantity) >= state.remaining && Number(quantity) > 0

  return (
    <form className="panel" onSubmit={(e) => void handleSubmit(e)} style={{ marginBottom: '0.85rem' }}>
      <h2>Add or trim</h2>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        {formatNumber(state.remaining, 4)} open @ {state.avgEntry == null ? '—' : formatMoney(state.avgEntry)}
        {state.trimmed > 0 ? ` · booked ${formatSignedMoney(state.realized)}` : ''}
      </p>
      {error ? <p className="message">{error}</p> : null}
      <div className="form-grid">
        <div className="l-field">
          <span>Action</span>
          <div className="side-toggle">
            <button type="button" className={`long ${kind === 'add' ? 'active' : ''}`} onClick={() => setKind('add')}>
              Add
            </button>
            <button type="button" className={`short ${kind === 'trim' ? 'active' : ''}`} onClick={() => setKind('trim')}>
              Trim
            </button>
          </div>
        </div>
        <label className="l-field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="l-field">
          <span>Quantity</span>
          <input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <label className="l-field">
          <span>Price</span>
          <input type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label className="l-field">
          <span>Fees</span>
          <input type="number" min={0} step="any" value={fees} onChange={(e) => setFees(e.target.value)} />
        </label>
        <label className="l-field wide">
          <span>Note</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </label>
      </div>
      <div className="ledger-actions" style={{ marginTop: '1rem' }}>
        <button className="l-btn l-btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : trimCloses ? 'Close remaining' : kind === 'add' ? 'Add to position' : 'Trim position'}
        </button>
      </div>
    </form>
  )
}
