import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type JournalSettings, type Trade } from '../types'
import { getSettings, getTrade, getTrades, saveSettings, saveTrade } from './db'
import { ensureFills } from './position'

export function useJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [settings, setSettings] = useState<JournalSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [nextTrades, nextSettings] = await Promise.all([getTrades(), getSettings()])
      if (cancelled) return
      setTrades(nextTrades)
      setSettings(nextSettings)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [tick])

  const updateSettings = useCallback(async (next: JournalSettings) => {
    await saveSettings(next)
    setSettings(next)
  }, [])

  return { trades, settings, ready, refresh, updateSettings }
}

export function useTrade(id: string | undefined) {
  const [trade, setTrade] = useState<Trade | null | undefined>(undefined)

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

  const persist = useCallback(async (next: Trade) => {
    const stored = ensureFills({ ...next, symbol: next.symbol.trim().toUpperCase() })
    await saveTrade(stored)
    setTrade(stored)
  }, [])

  return { trade, persist, reload }
}
