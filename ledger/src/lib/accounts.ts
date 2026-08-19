import {
  DEFAULT_IRA_ID,
  DEFAULT_TAXABLE_ID,
  type Account,
  type AccountFilter,
  type Trade,
} from '../types'

export function visibleAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => !account.archived).sort((a, b) => a.createdAt - b.createdAt)
}

export function accountById(accounts: Account[], id: string | undefined): Account | undefined {
  return accounts.find((account) => account.id === id)
}

export function accountName(accounts: Account[], id: string | undefined): string {
  return accountById(accounts, id)?.name ?? 'Unknown'
}

export function capitalForFilter(accounts: Account[], filter: AccountFilter): number {
  if (filter === 'all') {
    return visibleAccounts(accounts).reduce((sum, account) => sum + account.startingCapital, 0)
  }
  return accountById(accounts, filter)?.startingCapital ?? 0
}

export function tradesForFilter(trades: Trade[], accounts: Account[], filter: AccountFilter): Trade[] {
  if (filter === 'all') {
    const allowed = new Set(visibleAccounts(accounts).map((account) => account.id))
    return trades.filter((trade) => allowed.has(trade.accountId))
  }
  return trades.filter((trade) => trade.accountId === filter)
}

export function defaultTradeAccountId(accounts: Account[], lastTradeAccountId: string): string {
  const visible = visibleAccounts(accounts)
  if (visible.some((account) => account.id === lastTradeAccountId)) return lastTradeAccountId
  return visible.find((account) => account.id === DEFAULT_TAXABLE_ID)?.id ?? visible[0]?.id ?? DEFAULT_TAXABLE_ID
}

export function resolveAccountFilter(accounts: Account[], filter: AccountFilter): AccountFilter {
  if (filter === 'all') return 'all'
  return visibleAccounts(accounts).some((account) => account.id === filter) ? filter : 'all'
}

export function defaultAccounts(taxableCapital: number): Account[] {
  const now = Date.now()
  return [
    {
      id: DEFAULT_TAXABLE_ID,
      name: 'Taxable',
      broker: '',
      startingCapital: Math.max(0, taxableCapital),
      archived: false,
      createdAt: now,
    },
    {
      id: DEFAULT_IRA_ID,
      name: 'IRA',
      broker: '',
      startingCapital: 0,
      archived: false,
      createdAt: now + 1,
    },
  ]
}
