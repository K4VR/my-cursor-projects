import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  DEFAULT_SETTINGS,
  type JournalBackup,
  type JournalSettings,
  type Trade,
} from '../types'

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
}

let dbPromise: Promise<IDBPDatabase<LedgerDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<LedgerDB>('stock-ledger', 1, {
      upgrade(db) {
        const trades = db.createObjectStore('trades', { keyPath: 'id' })
        trades.createIndex('by-symbol', 'symbol')
        trades.createIndex('by-entryDate', 'entryDate')
        db.createObjectStore('settings', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function getTrades(): Promise<Trade[]> {
  const db = await getDb()
  const trades = await db.getAll('trades')
  return trades.sort((a, b) => {
    const date = b.entryDate.localeCompare(a.entryDate)
    if (date !== 0) return date
    return b.updatedAt - a.updatedAt
  })
}

export async function getTrade(id: string): Promise<Trade | undefined> {
  const db = await getDb()
  return db.get('trades', id)
}

export async function saveTrade(trade: Trade): Promise<void> {
  const db = await getDb()
  await db.put('trades', {
    ...trade,
    symbol: trade.symbol.trim().toUpperCase(),
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
  await Promise.all(trades.map((trade) => tx.store.put(trade)))
  await tx.done
}

export async function addTrades(trades: Trade[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('trades', 'readwrite')
  await Promise.all(trades.map((trade) => tx.store.put(trade)))
  await tx.done
}

export async function getSettings(): Promise<JournalSettings> {
  const db = await getDb()
  const record = await db.get('settings', 'default')
  if (!record) return { ...DEFAULT_SETTINGS }
  return { startingCapital: record.startingCapital }
}

export async function saveSettings(settings: JournalSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', { id: 'default', ...settings })
}

export async function exportBackup(): Promise<JournalBackup> {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()])
  return {
    version: 1,
    exportedAt: Date.now(),
    settings,
    trades,
  }
}

export async function importBackup(backup: JournalBackup, mode: 'replace' | 'merge'): Promise<void> {
  if (backup.version !== 1) throw new Error('Unsupported backup version')
  if (mode === 'replace') {
    await replaceAllTrades(backup.trades)
  } else {
    await addTrades(backup.trades)
  }
  if (backup.settings) await saveSettings(backup.settings)
}

export async function clearJournal(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['trades', 'settings'], 'readwrite')
  await Promise.all([tx.objectStore('trades').clear(), tx.objectStore('settings').clear(), tx.done])
}
