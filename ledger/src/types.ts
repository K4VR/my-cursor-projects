export type Side = 'long' | 'short'
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'

export interface Trade {
  id: string
  symbol: string
  side: Side
  quantity: number
  entryPrice: number
  entryDate: string
  exitPrice: number | null
  exitDate: string | null
  fees: number
  stopLoss: number | null
  takeProfit: number | null
  setup: string
  tags: string[]
  grade: Grade | null
  thesis: string
  emotion: string
  mistakes: string
  lessons: string
  createdAt: number
  updatedAt: number
}

export interface JournalSettings {
  startingCapital: number
}

export interface JournalBackup {
  version: 1
  exportedAt: number
  settings: JournalSettings
  trades: Trade[]
}

export const DEFAULT_SETTINGS: JournalSettings = {
  startingCapital: 25_000,
}

export const SETUPS = [
  'Breakout',
  'Pullback',
  'Mean reversion',
  'Momentum',
  'Reversal',
  'Gap fill',
  'Earnings',
  'News',
] as const

export const GRADES: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'F']

export function isClosed(trade: Trade): boolean {
  return trade.exitPrice != null && trade.exitDate != null
}

export function newTradeId(): string {
  return crypto.randomUUID()
}

export function emptyTrade(): Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date().toISOString().slice(0, 10)
  return {
    symbol: '',
    side: 'long',
    quantity: 0,
    entryPrice: 0,
    entryDate: today,
    exitPrice: null,
    exitDate: null,
    fees: 0,
    stopLoss: null,
    takeProfit: null,
    setup: '',
    tags: [],
    grade: null,
    thesis: '',
    emotion: '',
    mistakes: '',
    lessons: '',
  }
}
