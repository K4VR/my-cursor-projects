import { isClosed, positionState, walkPosition } from './position'
import type { Trade } from '../types'

export function realizedPnl(trade: Trade): number | null {
  const state = positionState(trade)
  if (state.trimmed <= 0) return state.closed ? 0 : null
  return state.realized
}

export function plannedRisk(trade: Trade): number | null {
  const state = positionState(trade)
  const price = state.closed ? state.addVwap : state.avgEntry
  const qty = state.closed ? state.added : state.remaining
  if (trade.stopLoss == null || price == null || qty <= 0) return null
  const risk = Math.abs(price - trade.stopLoss) * qty
  return risk > 0 ? risk : null
}

export function rMultiple(trade: Trade): number | null {
  const pnl = realizedPnl(trade)
  const state = positionState(trade)
  if (pnl == null || trade.stopLoss == null || state.addVwap == null || state.added <= 0) return null
  const risk = Math.abs(state.addVwap - trade.stopLoss) * state.added
  if (risk <= 0) return null
  return pnl / risk
}

export function holdDays(trade: Trade): number | null {
  const state = positionState(trade)
  if (!state.closed || !state.firstDate || !state.lastTrimDate) return null
  const start = Date.parse(`${state.firstDate}T00:00:00Z`)
  const end = Date.parse(`${state.lastTrimDate}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

export interface EquityPoint {
  date: string
  pnl: number
  equity: number
  tradeId: string
  symbol: string
}

export function closedTradesChronological(trades: Trade[]): Trade[] {
  return trades
    .filter(isClosed)
    .sort((a, b) => {
      const aDate = positionState(a).lastTrimDate ?? ''
      const bDate = positionState(b).lastTrimDate ?? ''
      const date = aDate.localeCompare(bDate)
      if (date !== 0) return date
      return a.updatedAt - b.updatedAt
    })
}

export function equityCurve(trades: Trade[], startingCapital: number): EquityPoint[] {
  const events = trades.flatMap((trade) =>
    walkPosition(trade).trimEvents.map((event) => ({
      date: event.date,
      pnl: event.pnl,
      tradeId: trade.id,
      symbol: trade.symbol,
      order: trade.updatedAt,
    })),
  )
  events.sort((a, b) => {
    const date = a.date.localeCompare(b.date)
    if (date !== 0) return date
    return a.order - b.order
  })
  let equity = startingCapital
  return events.map((event) => {
    equity += event.pnl
    return {
      date: event.date,
      pnl: event.pnl,
      equity,
      tradeId: event.tradeId,
      symbol: event.symbol,
    }
  })
}

export function maxDrawdown(points: EquityPoint[]): { amount: number; pct: number } {
  if (points.length === 0) return { amount: 0, pct: 0 }
  let peak = points[0].equity
  let amount = 0
  let pct = 0
  for (const point of points) {
    if (point.equity > peak) peak = point.equity
    const dd = peak - point.equity
    if (dd > amount) {
      amount = dd
      pct = peak > 0 ? dd / peak : 0
    }
  }
  return { amount, pct }
}

export interface GroupStats {
  key: string
  trades: number
  wins: number
  losses: number
  scratches: number
  winRate: number
  pnl: number
  avgPnl: number
  avgR: number | null
  profitFactor: number | null
}

function tally(key: string, trades: Trade[]): GroupStats {
  let pnl = 0
  let wins = 0
  let losses = 0
  let scratches = 0
  let grossWin = 0
  let grossLoss = 0
  let rSum = 0
  let rCount = 0

  for (const trade of trades) {
    const value = realizedPnl(trade)
    if (value == null) continue
    pnl += value
    if (value > 0) {
      wins += 1
      grossWin += value
    } else if (value < 0) {
      losses += 1
      grossLoss += Math.abs(value)
    } else {
      scratches += 1
    }
    const r = rMultiple(trade)
    if (r != null) {
      rSum += r
      rCount += 1
    }
  }

  const decided = wins + losses
  return {
    key,
    trades: trades.length,
    wins,
    losses,
    scratches,
    winRate: decided > 0 ? wins / decided : 0,
    pnl,
    avgPnl: trades.length > 0 ? pnl / trades.length : 0,
    avgR: rCount > 0 ? rSum / rCount : null,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? null : 0,
  }
}

export interface JournalSummary {
  closed: Trade[]
  open: Trade[]
  wins: Trade[]
  losses: Trade[]
  totalPnl: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number | null
  expectancy: number
  avgR: number | null
  avgHoldDays: number | null
  currentStreak: { kind: 'win' | 'loss' | 'none'; length: number }
  bestTrade: Trade | null
  worstTrade: Trade | null
  equity: EquityPoint[]
  drawdown: { amount: number; pct: number }
}

export function summarize(trades: Trade[], startingCapital: number): JournalSummary {
  const closed = closedTradesChronological(trades)
  const open = trades
    .filter((t) => !isClosed(t))
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
  const pnls = closed.map((t) => ({ trade: t, pnl: realizedPnl(t) ?? 0 }))
  const wins = pnls.filter((p) => p.pnl > 0).map((p) => p.trade)
  const losses = pnls.filter((p) => p.pnl < 0).map((p) => p.trade)
  const totalPnl = trades.reduce((sum, trade) => sum + positionState(trade).realized, 0)
  const decided = wins.length + losses.length
  const grossWin = pnls.filter((p) => p.pnl > 0).reduce((sum, p) => sum + p.pnl, 0)
  const grossLoss = pnls.filter((p) => p.pnl < 0).reduce((sum, p) => sum + Math.abs(p.pnl), 0)
  const avgWin = wins.length ? grossWin / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const rValues = closed.map(rMultiple).filter((v): v is number => v != null)
  const holds = closed.map(holdDays).filter((v): v is number => v != null)

  let streakKind: 'win' | 'loss' | 'none' = 'none'
  let streakLength = 0
  for (let i = pnls.length - 1; i >= 0; i--) {
    const pnl = pnls[i].pnl
    if (pnl === 0) continue
    const kind = pnl > 0 ? 'win' : 'loss'
    if (streakKind === 'none') {
      streakKind = kind
      streakLength = 1
    } else if (kind === streakKind) {
      streakLength += 1
    } else {
      break
    }
  }

  const equity = equityCurve(trades, startingCapital)
  const best = pnls.reduce<Trade | null>((acc, p) => {
    if (!acc) return p.trade
    return p.pnl > (realizedPnl(acc) ?? 0) ? p.trade : acc
  }, null)
  const worst = pnls.reduce<Trade | null>((acc, p) => {
    if (!acc) return p.trade
    return p.pnl < (realizedPnl(acc) ?? 0) ? p.trade : acc
  }, null)

  return {
    closed,
    open,
    wins,
    losses,
    totalPnl,
    winRate: decided > 0 ? wins.length / decided : 0,
    avgWin,
    avgLoss,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? null : 0,
    expectancy: closed.length > 0 ? pnls.reduce((s, p) => s + p.pnl, 0) / closed.length : 0,
    avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null,
    avgHoldDays: holds.length > 0 ? holds.reduce((a, b) => a + b, 0) / holds.length : null,
    currentStreak: { kind: streakKind, length: streakLength },
    bestTrade: best,
    worstTrade: worst,
    equity,
    drawdown: maxDrawdown(equity),
  }
}

export function groupBy(trades: Trade[], keyFn: (trade: Trade) => string): GroupStats[] {
  const map = new Map<string, Trade[]>()
  for (const trade of closedTradesChronological(trades)) {
    const key = keyFn(trade) || '—'
    const list = map.get(key)
    if (list) list.push(trade)
    else map.set(key, [trade])
  }
  return [...map.entries()]
    .map(([key, list]) => tally(key, list))
    .sort((a, b) => b.pnl - a.pnl)
}

export function weekdayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return '—'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
