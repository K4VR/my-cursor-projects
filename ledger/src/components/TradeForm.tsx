import { useMemo, useState, type FormEvent } from 'react'
import { emptyTrade, GRADES, SETUPS, type Grade, type Side, type Trade } from '../types'

type Draft = Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>

function toDraft(trade?: Trade | null): Draft {
  if (!trade) return emptyTrade()
  return {
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    entryDate: trade.entryDate,
    exitPrice: trade.exitPrice,
    exitDate: trade.exitDate,
    fees: trade.fees,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    setup: trade.setup,
    tags: trade.tags,
    grade: trade.grade,
    thesis: trade.thesis,
    emotion: trade.emotion,
    mistakes: trade.mistakes,
    lessons: trade.lessons,
  }
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function TradeForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Trade | null
  onSubmit: (draft: Draft) => Promise<void> | void
  onCancel: () => void
  submitLabel: string
}) {
  const seed = useMemo(() => toDraft(initial), [initial])
  const [draft, setDraft] = useState<Draft>(seed)
  const [closed, setClosed] = useState(seed.exitPrice != null && seed.exitDate != null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.symbol.trim()) {
      setError('Symbol is required.')
      return
    }
    if (draft.quantity <= 0 || draft.entryPrice <= 0) {
      setError('Quantity and entry price must be greater than zero.')
      return
    }
    if (closed && (draft.exitPrice == null || !draft.exitDate)) {
      setError('Closed trades need an exit date and price.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        ...draft,
        symbol: draft.symbol.trim().toUpperCase(),
        exitPrice: closed ? draft.exitPrice : null,
        exitDate: closed ? draft.exitDate : null,
        fees: closed ? draft.fees : draft.fees || 0,
      })
    } catch {
      setError('Could not save this trade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel" onSubmit={(e) => void handleSubmit(e)}>
      {error ? <p className="message">{error}</p> : null}
      <div className="form-grid">
        <label className="l-field">
          <span>Symbol</span>
          <input
            value={draft.symbol}
            onChange={(e) => update('symbol', e.target.value.toUpperCase())}
            placeholder="AAPL"
            autoComplete="off"
            required
          />
        </label>
        <div className="l-field">
          <span>Side</span>
          <div className="side-toggle">
            {(['long', 'short'] as Side[]).map((side) => (
              <button
                key={side}
                type="button"
                className={`${side} ${draft.side === side ? 'active' : ''}`}
                onClick={() => update('side', side)}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
        <label className="l-field">
          <span>Quantity</span>
          <input
            type="number"
            min={0}
            step="any"
            value={draft.quantity || ''}
            onChange={(e) => update('quantity', Number(e.target.value) || 0)}
            required
          />
        </label>
        <label className="l-field">
          <span>Fees</span>
          <input
            type="number"
            min={0}
            step="any"
            value={draft.fees || ''}
            onChange={(e) => update('fees', Number(e.target.value) || 0)}
          />
        </label>
        <label className="l-field">
          <span>Entry date</span>
          <input type="date" value={draft.entryDate} onChange={(e) => update('entryDate', e.target.value)} required />
        </label>
        <label className="l-field">
          <span>Entry price</span>
          <input
            type="number"
            min={0}
            step="any"
            value={draft.entryPrice || ''}
            onChange={(e) => update('entryPrice', Number(e.target.value) || 0)}
            required
          />
        </label>
        <label className="l-field">
          <span>Stop loss</span>
          <input
            type="number"
            min={0}
            step="any"
            value={draft.stopLoss ?? ''}
            onChange={(e) => update('stopLoss', e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
        <label className="l-field">
          <span>Take profit</span>
          <input
            type="number"
            min={0}
            step="any"
            value={draft.takeProfit ?? ''}
            onChange={(e) => update('takeProfit', e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={closed}
            onChange={(e) => {
              const next = e.target.checked
              setClosed(next)
              if (next && !draft.exitDate) update('exitDate', draft.entryDate)
            }}
          />
          Position is closed
        </label>
        <label className="l-field">
          <span>Exit date</span>
          <input
            type="date"
            value={draft.exitDate ?? ''}
            disabled={!closed}
            onChange={(e) => update('exitDate', e.target.value || null)}
          />
        </label>
        <label className="l-field">
          <span>Exit price</span>
          <input
            type="number"
            min={0}
            step="any"
            disabled={!closed}
            value={draft.exitPrice ?? ''}
            onChange={(e) => update('exitPrice', e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
        <label className="l-field">
          <span>Setup</span>
          <input
            list="setups"
            value={draft.setup}
            onChange={(e) => update('setup', e.target.value)}
            placeholder="Breakout"
          />
          <datalist id="setups">
            {SETUPS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="l-field wide">
          <span>Tags</span>
          <input
            value={draft.tags.join(', ')}
            onChange={(e) => update('tags', parseTags(e.target.value))}
            placeholder="tech, large-cap"
          />
        </label>
        <div className="l-field full">
          <span>Grade</span>
          <div className="grade-row">
            {GRADES.map((grade) => (
              <button
                key={grade}
                type="button"
                className={draft.grade === grade ? 'active' : ''}
                onClick={() => update('grade', (draft.grade === grade ? null : grade) as Grade | null)}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
        <label className="l-field full">
          <span>Thesis</span>
          <textarea className="l-textarea" value={draft.thesis} onChange={(e) => update('thesis', e.target.value)} />
        </label>
        <label className="l-field wide">
          <span>Emotion</span>
          <textarea className="l-textarea" value={draft.emotion} onChange={(e) => update('emotion', e.target.value)} />
        </label>
        <label className="l-field wide">
          <span>Mistakes</span>
          <textarea className="l-textarea" value={draft.mistakes} onChange={(e) => update('mistakes', e.target.value)} />
        </label>
        <label className="l-field full">
          <span>Lessons</span>
          <textarea className="l-textarea" value={draft.lessons} onChange={(e) => update('lessons', e.target.value)} />
        </label>
      </div>
      <div className="ledger-actions" style={{ marginTop: '1.1rem' }}>
        <button className="l-btn l-btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className="l-btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
