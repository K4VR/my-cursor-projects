export type Side = 'long' | 'short'
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
export type FillKind = 'add' | 'trim'

export interface Fill {
  id: string
  kind: FillKind
  date: string
  price: number
  quantity: number
  fees: number
  note: string
  createdAt: number
}

export interface Account {
  id: string
  name: string
  broker: string
  startingCapital: number
  archived: boolean
  createdAt: number
}

export type AccountFilter = 'all' | string

export interface Trade {
  id: string
  accountId: string
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
  fills: Fill[]
  createdAt: number
  updatedAt: number
}

export interface JournalSettings {
  startingCapital: number
  lastAccountId: AccountFilter
  lastTradeAccountId: string
}

export interface JournalBackup {
  version: 1
  exportedAt: number
  settings: JournalSettings
  accounts?: Account[]
  trades: Trade[]
}

export const DEFAULT_TAXABLE_ID = 'acct-taxable'
export const DEFAULT_IRA_ID = 'acct-ira'

export const DEFAULT_SETTINGS: JournalSettings = {
  startingCapital: 25_000,
  lastAccountId: 'all',
  lastTradeAccountId: DEFAULT_TAXABLE_ID,
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

export function newTradeId(): string {
  return crypto.randomUUID()
}

export function newFillId(): string {
  return crypto.randomUUID()
}

export function newAccountId(): string {
  return crypto.randomUUID()
}

export function emptyTrade(accountId = DEFAULT_TAXABLE_ID): Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date().toISOString().slice(0, 10)
  return {
    accountId,
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
    fills: [],
  }
}
