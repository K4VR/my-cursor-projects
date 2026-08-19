import { useCallback, useContext, useEffect, useMemo, useState, createContext, type ReactNode } from 'react'
import {
  DEFAULT_SETTINGS,
  newAccountId,
  type Account,
  type AccountFilter,
  type JournalSettings,
  type Trade,
} from '../types'
import {
  accountById,
  capitalForFilter,
  defaultTradeAccountId,
  resolveAccountFilter,
  tradesForFilter,
  visibleAccounts,
} from './accounts'
import { getTrade, loadJournalState, saveAccount, saveSettings, saveTrade, subscribeJournalDb } from './db'
import { ensureFills } from './position'

type JournalContextValue = {
  accounts: Account[]
  trades: Trade[]
  settings: JournalSettings
  ready: boolean
  blocked: boolean
  loadError: string | null
  refresh: () => void
  updateSettings: (next: JournalSettings) => Promise<void>
  activeAccountId: AccountFilter
  setActiveAccountId: (id: AccountFilter) => Promise<void>
  filteredTrades: Trade[]
  activeCapital: number
  activeAccount: Account | undefined
  visibleAccounts: Account[]
  defaultAccountId: string
  accountLabel: (id: string | undefined) => string
  persistAccount: (account: Account) => Promise<void>
}

const JournalContext = createContext<JournalContextValue | null>(null)

export function JournalProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<JournalSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    return subscribeJournalDb((event) => {
      if (event.type === 'blocked') setBlocked(true)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setBlocked(true)
    }, 4000)
    ;(async () => {
      try {
        const next = await loadJournalState()
        if (cancelled) return
        setTrades(next.trades)
        setAccounts(next.accounts)
        setSettings(next.settings)
        setLoadError(null)
        setBlocked(false)
        setReady(true)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Could not open the journal in this browser.'
        setLoadError(message)
        setBlocked(false)
        setReady(false)
      } finally {
        window.clearTimeout(timer)
      }
    })()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [tick])

  const updateSettings = useCallback(async (next: JournalSettings) => {
    await saveSettings(next)
    setSettings(next)
  }, [])

  const visible = useMemo(() => visibleAccounts(accounts), [accounts])
  const activeAccountId = resolveAccountFilter(accounts, settings.lastAccountId)
  const filteredTrades = useMemo(
    () => tradesForFilter(trades, accounts, activeAccountId),
    [trades, accounts, activeAccountId],
  )
  const activeCapital = capitalForFilter(accounts, activeAccountId)
  const activeAccount = activeAccountId === 'all' ? undefined : accountById(accounts, activeAccountId)
  const tradeAccountId = defaultTradeAccountId(accounts, settings.lastTradeAccountId)

  const setActiveAccountId = useCallback(
    async (id: AccountFilter) => {
      const next = {
        ...settings,
        lastAccountId: resolveAccountFilter(accounts, id),
      }
      await saveSettings(next)
      setSettings(next)
    },
    [accounts, settings],
  )

  const persistAccount = useCallback(
    async (account: Account) => {
      await saveAccount(account)
      const nextAccounts = accounts.some((row) => row.id === account.id)
        ? accounts.map((row) => (row.id === account.id ? account : row))
        : [...accounts, account].sort((a, b) => a.createdAt - b.createdAt)
      setAccounts(nextAccounts)
      const nextSettings = {
        ...settings,
        startingCapital: capitalForFilter(nextAccounts, 'all'),
      }
      await saveSettings(nextSettings)
      setSettings(nextSettings)
    },
    [accounts, settings],
  )

  const value = useMemo<JournalContextValue>(
    () => ({
      accounts,
      trades,
      settings,
      ready,
      blocked,
      loadError,
      refresh,
      updateSettings,
      activeAccountId,
      setActiveAccountId,
      filteredTrades,
      activeCapital,
      activeAccount,
      visibleAccounts: visible,
      defaultAccountId: tradeAccountId,
      accountLabel: (id) => accountById(accounts, id)?.name ?? 'Unknown',
      persistAccount,
    }),
    [
      accounts,
      trades,
      settings,
      ready,
      blocked,
      loadError,
      refresh,
      updateSettings,
      activeAccountId,
      setActiveAccountId,
      filteredTrades,
      activeCapital,
      activeAccount,
      visible,
      tradeAccountId,
      persistAccount,
    ],
  )

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
}

export function useJournal() {
  const ctx = useContext(JournalContext)
  if (!ctx) throw new Error('useJournal must be used inside JournalProvider')
  return ctx
}

export function useTrade(id: string | undefined) {
  const [trade, setTrade] = useState<Trade | null | undefined>(undefined)
  const journal = useContext(JournalContext)

  const reload = useCallback(() => {
    if (!id) {
      setTrade(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const record = await getTrade(id)
      if (!cancelled) setTrade(record ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => reload(), [reload])

  const persist = useCallback(
    async (next: Trade) => {
      const stored = ensureFills({ ...next, symbol: next.symbol.trim().toUpperCase() })
      await saveTrade(stored)
      setTrade(stored)
      journal?.refresh()
    },
    [journal],
  )

  return { trade, persist, reload }
}

export function nextAccountDraft(): Account {
  return {
    id: newAccountId(),
    name: '',
    broker: '',
    startingCapital: 0,
    archived: false,
    createdAt: Date.now(),
  }
}
