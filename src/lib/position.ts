import { newFillId, type Fill, type FillKind, type Trade } from '../types'

const EPS = 1e-9

export function sortFills(fills: Fill[]): Fill[] {
  return [...fills].sort((a, b) => {
    const date = a.date.localeCompare(b.date)
    if (date !== 0) return date
    return a.createdAt - b.createdAt
  })
}

function legacyFills(trade: Trade): Fill[] {
  const created = trade.createdAt || Date.now()
  const open: Fill = {
    id: newFillId(),
    kind: 'add',
    date: trade.entryDate,
    price: trade.entryPrice,
    quantity: trade.quantity,
    fees: trade.exitPrice == null ? trade.fees : 0,
    note: '',
    createdAt: created,
  }
  if (trade.exitPrice == null || trade.exitDate == null) return [open]
  return [
    open,
    {
      id: newFillId(),
      kind: 'trim',
      date: trade.exitDate,
      price: trade.exitPrice,
      quantity: trade.quantity,
      fees: trade.fees,
      note: '',
      createdAt: created + 1,
    },
  ]
}

export function fillsOf(trade: Trade): Fill[] {
  if (trade.fills && trade.fills.length > 0) return sortFills(trade.fills)
  if (trade.quantity > 0 && trade.entryPrice > 0 && trade.entryDate) return legacyFills(trade)
  return []
}

export interface PositionState {
  remaining: number
  added: number
  trimmed: number
  avgEntry: number | null
  addVwap: number | null
  trimVwap: number | null
  realized: number
  fees: number
  closed: boolean
  firstDate: string | null
  lastDate: string | null
  lastTrimDate: string | null
}

export interface TrimEvent {
  date: string
  pnl: number
  quantity: number
  price: number
  fillId: string
}

export function walkPosition(trade: Trade): { state: PositionState; trimEvents: TrimEvent[] } {
  const fills = fillsOf(trade)
  const direction = trade.side === 'long' ? 1 : -1
  let remaining = 0
  let avgEntry = 0
  let added = 0
  let addedNotional = 0
  let trimmed = 0
  let trimmedNotional = 0
  let realized = 0
  let fees = 0
  const trimEvents: TrimEvent[] = []

  for (const fill of fills) {
    fees += fill.fees
    if (fill.kind === 'add') {
      const next = remaining + fill.quantity
      avgEntry = next > EPS ? (avgEntry * remaining + fill.price * fill.quantity) / next : 0
      remaining = next
      added += fill.quantity
      addedNotional += fill.price * fill.quantity
      continue
    }
    const qty = Math.min(fill.quantity, remaining)
    if (qty <= EPS) continue
    const pnl = (fill.price - avgEntry) * direction * qty - fill.fees
    realized += pnl
    remaining -= qty
    trimmed += qty
    trimmedNotional += fill.price * qty
    trimEvents.push({
      date: fill.date,
      pnl,
      quantity: qty,
      price: fill.price,
      fillId: fill.id,
    })
  }

  const first = fills[0]
  const last = fills[fills.length - 1]
  const lastTrim = [...fills].reverse().find((f) => f.kind === 'trim')

  return {
    state: {
      remaining: remaining < EPS ? 0 : remaining,
      added,
      trimmed,
      avgEntry: remaining > EPS ? avgEntry : added > EPS ? addedNotional / added : null,
      addVwap: added > EPS ? addedNotional / added : null,
      trimVwap: trimmed > EPS ? trimmedNotional / trimmed : null,
      realized,
      fees,
      closed: remaining <= EPS && trimmed > EPS,
      firstDate: first?.date ?? null,
      lastDate: last?.date ?? null,
      lastTrimDate: lastTrim?.date ?? null,
    },
    trimEvents,
  }
}

export function positionState(trade: Trade): PositionState {
  return walkPosition(trade).state
}

export function isClosed(trade: Trade): boolean {
  return positionState(trade).closed
}

export function isScaled(trade: Trade): boolean {
  const fills = fillsOf(trade)
  const adds = fills.filter((f) => f.kind === 'add').length
  const trims = fills.filter((f) => f.kind === 'trim').length
  const remaining = positionState(trade).remaining
  return adds > 1 || trims > 1 || (trims >= 1 && remaining > EPS)
}

export function syncTradeFromFills(trade: Trade): Trade {
  const fills = fillsOf(trade)
  const state = positionState({ ...trade, fills })
  return {
    ...trade,
    fills,
    quantity: state.closed ? state.added : state.remaining || state.added,
    entryPrice: state.avgEntry ?? trade.entryPrice,
    entryDate: state.firstDate ?? trade.entryDate,
    exitPrice: state.closed ? state.trimVwap : null,
    exitDate: state.closed ? state.lastTrimDate : null,
    fees: state.fees,
  }
}

export function ensureFills(trade: Trade): Trade {
  return syncTradeFromFills({ ...trade, fills: fillsOf(trade) })
}

export function applyFill(
  trade: Trade,
  input: {
    kind: FillKind
    date: string
    price: number
    quantity: number
    fees: number
    note?: string
  },
): Trade {
  const current = ensureFills(trade)
  const state = positionState(current)
  if (input.kind === 'trim' && input.quantity > state.remaining + EPS) {
    throw new Error(`Trim cannot exceed the open size (${state.remaining}).`)
  }
  const fill: Fill = {
    id: newFillId(),
    kind: input.kind,
    date: input.date,
    price: input.price,
    quantity: input.quantity,
    fees: input.fees,
    note: input.note?.trim() ?? '',
    createdAt: Date.now(),
  }
  return syncTradeFromFills({ ...current, fills: [...current.fills, fill] })
}

export function removeFill(trade: Trade, fillId: string): Trade {
  const current = ensureFills(trade)
  const nextFills = current.fills.filter((fill) => fill.id !== fillId)
  if (nextFills.length === 0) throw new Error('A trade needs at least one fill.')
  if (!nextFills.some((fill) => fill.kind === 'add')) {
    throw new Error('A trade needs at least one add.')
  }
  return syncTradeFromFills({ ...current, fills: nextFills })
}

export function fillsFromSimpleDraft(draft: {
  quantity: number
  entryPrice: number
  entryDate: string
  exitPrice: number | null
  exitDate: string | null
  fees: number
}): Fill[] {
  const createdAt = Date.now()
  const closed = draft.exitPrice != null && draft.exitDate != null
  const open: Fill = {
    id: newFillId(),
    kind: 'add',
    date: draft.entryDate,
    price: draft.entryPrice,
    quantity: draft.quantity,
    fees: closed ? 0 : draft.fees,
    note: '',
    createdAt,
  }
  if (!closed) return [open]
  return [
    open,
    {
      id: newFillId(),
      kind: 'trim',
      date: draft.exitDate as string,
      price: draft.exitPrice as number,
      quantity: draft.quantity,
      fees: draft.fees,
      note: '',
      createdAt: createdAt + 1,
    },
  ]
}
