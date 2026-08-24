import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  DEFAULT_SETTINGS,
  DEFAULT_TAXABLE_ID,
  type Account,
  type JournalBackup,
  type JournalSettings,
  type Trade,
} from '../types'
import { capitalForFilter, defaultAccounts } from './accounts'
import { demoAccounts, demoTrades } from './demo'
import { ensureFills } from './position'

interface LedgerDB extends DBSchema {
  trades: {
    key: string
    value: Trade
    indexes: { 'by-symbol': string; 'by-entryDate': string }
  }
  settings: {
    key: string
    value: JournalSettings & { id: string }
  }
  accounts: {
    key: string
    value: Account
  }
}

let dbPromise: Promise<IDBPDatabase<LedgerDB>> | null = null
let connection: IDBPDatabase<LedgerDB> | null = null

type JournalDbEvent = { type: 'blocked' }
const dbListeners = new Set<(event: JournalDbEvent) => void>()

export function subscribeJournalDb(listener: (event: JournalDbEvent) => void) {
  dbListeners.add(listener)
  return () => {
    dbListeners.delete(listener)
  }
}

function emitDbEvent(event: JournalDbEvent) {
  for (const listener of dbListeners) listener(event)
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<LedgerDB>('stock-ledger', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('trades')) {
          const trades = db.createObjectStore('trades', { keyPath: 'id' })
          trades.createIndex('by-symbol', 'symbol')
          trades.createIndex('by-entryDate', 'entryDate')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' })
        }
      },
      blocked() {
        emitDbEvent({ type: 'blocked' })
      },
      blocking() {
        connection?.close()
        connection = null
        dbPromise = null
      },
      terminated() {
        connection = null
        dbPromise = null
      },
    }).then((db) => {
      connection = db
      return db
    }).catch((error) => {
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

function hydrateTrade(trade: Trade, fallbackAccountId = DEFAULT_TAXABLE_ID): Trade {
  return ensureFills({
    ...trade,
    accountId: trade.accountId || fallbackAccountId,
    symbol: String(trade.symbol || '').trim().toUpperCase(),
  })
}

function hydrateSettings(record?: (JournalSettings & { id?: string }) | null): JournalSettings {
  return {
    ...DEFAULT_SETTINGS,
    startingCapital: record?.startingCapital ?? DEFAULT_SETTINGS.startingCapital,
    lastAccountId: record?.lastAccountId ?? DEFAULT_SETTINGS.lastAccountId,
    lastTradeAccountId: record?.lastTradeAccountId ?? DEFAULT_SETTINGS.lastTradeAccountId,
  }
}

export async function getTrades(): Promise<Trade[]> {
  const db = await getDb()
  const trades = await db.getAll('trades')
  const hydrated = trades.map((trade) => hydrateTrade(trade)).sort((a, b) => {
    const date = b.entryDate.localeCompare(a.entryDate)
    if (date !== 0) return date
    return b.updatedAt - a.updatedAt
  })
  const stale = trades.filter((trade) => !trade.accountId)
  if (stale.length > 0) {
    const tx = db.transaction('trades', 'readwrite')
    await Promise.all(hydrated.map((trade) => tx.store.put(trade)))
    await tx.done
  }
  return hydrated
}

export async function getTrade(id: string): Promise<Trade | undefined> {
  const db = await getDb()
  const record = await db.get('trades', id)
  return record ? hydrateTrade(record) : undefined
}

export async function saveTrade(trade: Trade): Promise<void> {
  const db = await getDb()
  await db.put('trades', {
    ...hydrateTrade(trade),
    updatedAt: Date.now(),
  })
}

export async function deleteTrade(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('trades', id)
}

export async function replaceAllTrades(trades: Trade[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('trades', 'readwrite')
  await tx.store.clear()
  await Promise.all(trades.map((trade) => tx.store.put(hydrateTrade(trade))))
  await tx.done
}

export async function addTrades(trades: Trade[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('trades', 'readwrite')
  await Promise.all(trades.map((trade) => tx.store.put(hydrateTrade(trade))))
  await tx.done
}

export async function getAccounts(): Promise<Account[]> {
  const db = await getDb()
  let rows: Account[] = []
  try {
    rows = await db.getAll('accounts')
  } catch {
    rows = []
  }
  if (rows.length > 0) {
    return rows.sort((a, b) => a.createdAt - b.createdAt)
  }
  const settings = await getSettings()
  const seeded = defaultAccounts(settings.startingCapital)
  await replaceAccounts(seeded)
  return seeded
}

export async function saveAccount(account: Account): Promise<void> {
  const db = await getDb()
  await db.put('accounts', {
    ...account,
    name: account.name.trim() || 'Untitled',
    startingCapital: Number.isFinite(account.startingCapital) ? Math.max(0, account.startingCapital) : 0,
  })
}

export async function replaceAccounts(accounts: Account[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('accounts', 'readwrite')
  await tx.store.clear()
  await Promise.all(accounts.map((account) => tx.store.put(account)))
  await tx.done
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('accounts', id)
}

export async function getSettings(): Promise<JournalSettings> {
  const db = await getDb()
  const record = await db.get('settings', 'default')
  return hydrateSettings(record)
}

export async function loadJournalState(): Promise<{
  trades: Trade[]
  settings: JournalSettings
  accounts: Account[]
}> {
  const settings = await getSettings()
  const trades = await getTrades()
  const accounts = await getAccounts()
  return { trades, settings, accounts }
}

export async function saveSettings(settings: JournalSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', { id: 'default', ...hydrateSettings(settings) })
}

export async function syncStartingCapital(accounts?: Account[]): Promise<JournalSettings> {
  const [current, nextAccounts] = await Promise.all([getSettings(), accounts ? Promise.resolve(accounts) : getAccounts()])
  const next = {
    ...current,
    startingCapital: capitalForFilter(nextAccounts, 'all'),
  }
  await saveSettings(next)
  return next
}

export async function exportBackup(): Promise<JournalBackup> {
  const [trades, settings, accounts] = await Promise.all([getTrades(), getSettings(), getAccounts()])
  return {
    version: 1,
    exportedAt: Date.now(),
    settings,
    accounts,
    trades,
  }
}

function remapTradeAccount(trade: Trade, remap: Map<string, string>, fallbackId: string): Trade {
  const accountId = trade.accountId ? remap.get(trade.accountId) ?? trade.accountId : fallbackId
  return hydrateTrade({ ...trade, accountId }, fallbackId)
}

export async function importBackup(backup: JournalBackup, mode: 'replace' | 'merge'): Promise<void> {
  if (backup.version !== 1) throw new Error('Unsupported backup version')

  if (mode === 'replace') {
    const accounts = backup.accounts?.length ? backup.accounts : defaultAccounts(backup.settings?.startingCapital ?? DEFAULT_SETTINGS.startingCapital)
    const fallbackId = accounts[0]?.id ?? DEFAULT_TAXABLE_ID
    await replaceAccounts(accounts)
    await replaceAllTrades(backup.trades.map((trade) => remapTradeAccount(trade, new Map(accounts.map((a) => [a.id, a.id])), fallbackId)))
    await saveSettings(hydrateSettings(backup.settings))
    await syncStartingCapital(accounts)
    return
  }

  const existing = await getAccounts()
  const byId = new Map(existing.map((account) => [account.id, account]))
  const byName = new Map(existing.map((account) => [account.name.toLowerCase(), account]))
  const remap = new Map<string, string>()
  const incoming = backup.accounts ?? []

  for (const account of incoming) {
    if (byId.has(account.id)) {
      remap.set(account.id, account.id)
      continue
    }
    const named = byName.get(account.name.toLowerCase())
    if (named) {
      remap.set(account.id, named.id)
      continue
    }
    await saveAccount(account)
    byId.set(account.id, account)
    byName.set(account.name.toLowerCase(), account)
    remap.set(account.id, account.id)
  }

  const fallbackId = existing[0]?.id ?? DEFAULT_TAXABLE_ID
  await addTrades(backup.trades.map((trade) => remapTradeAccount(trade, remap, fallbackId)))
  if (backup.settings) {
    const current = await getSettings()
    await saveSettings({
      ...current,
      lastAccountId: backup.settings.lastAccountId ?? current.lastAccountId,
      lastTradeAccountId: backup.settings.lastTradeAccountId ?? current.lastTradeAccountId,
    })
  }
  await syncStartingCapital()
}

export async function loadDemoJournal(): Promise<void> {
  const accounts = demoAccounts()
  await replaceAccounts(accounts)
  await replaceAllTrades(demoTrades())
  await saveSettings({
    startingCapital: capitalForFilter(accounts, 'all'),
    lastAccountId: 'all',
    lastTradeAccountId: DEFAULT_TAXABLE_ID,
  })
}

export async function clearJournal(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['trades', 'settings', 'accounts'], 'readwrite')
  await Promise.all([
    tx.objectStore('trades').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('accounts').clear(),
    tx.done,
  ])
}
