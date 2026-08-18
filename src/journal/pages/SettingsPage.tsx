import { useEffect, useRef, useState } from 'react'
import { csvToTrades, tradesToCsv } from '../lib/csv'
import {
  addTrades,
  clearJournal,
  exportBackup,
  importBackup,
  replaceAllTrades,
  saveSettings,
} from '../lib/db'
import { demoTrades } from '../lib/demo'
import { useJournal } from '../lib/hooks'
import type { JournalBackup } from '../types'

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const { trades, settings, ready, refresh, updateSettings } = useJournal()
  const [capital, setCapital] = useState(String(settings.startingCapital))
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (ready) setCapital(String(settings.startingCapital))
  }, [ready, settings.startingCapital])
  const jsonRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  if (!ready) return <p className="muted">Loading settings…</p>

  async function handleSaveCapital() {
    const value = Number(capital)
    if (!Number.isFinite(value) || value < 0) {
      setMessage('Starting capital must be a positive number.')
      return
    }
    await updateSettings({ startingCapital: value })
    setMessage('Starting capital saved.')
  }

  async function handleExportJson() {
    const backup = await exportBackup()
    download(
      `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      'application/json',
    )
    setMessage('JSON backup downloaded.')
  }

  async function handleExportCsv() {
    download(
      `ledger-trades-${new Date().toISOString().slice(0, 10)}.csv`,
      tradesToCsv(trades),
      'text/csv',
    )
    setMessage('CSV downloaded.')
  }

  async function handleImportJson(file: File, mode: 'replace' | 'merge') {
    try {
      const data = JSON.parse(await file.text()) as JournalBackup
      await importBackup(data, mode)
      refresh()
      setMessage(`Imported ${data.trades.length} trades (${mode}).`)
    } catch {
      setMessage('Could not import that JSON backup.')
    }
  }

  async function handleImportCsv(file: File) {
    try {
      const parsed = csvToTrades(await file.text())
      await addTrades(parsed)
      refresh()
      setMessage(`Imported ${parsed.length} trades from CSV.`)
    } catch {
      setMessage('Could not import that CSV file.')
    }
  }

  async function handleDemo() {
    await replaceAllTrades(demoTrades())
    await saveSettings({ startingCapital: 25_000 })
    refresh()
    setCapital('25000')
    setMessage('Demo journal loaded. Your previous trades were replaced.')
  }

  async function handleClear() {
    if (!confirm('Erase every trade and setting stored in this browser?')) return
    await clearJournal()
    refresh()
    setCapital('25000')
    setMessage('Journal cleared.')
  }

  return (
    <div>
      <header className="ledger-hero">
        <div>
          <p className="ledger-kicker">Local data</p>
          <h1>Settings</h1>
          <p className="ledger-lede">
            Trades live in IndexedDB on this device. Export a backup before switching browsers.
          </p>
        </div>
      </header>

      {message ? <p className="message">{message}</p> : null}

      <div className="stack">
        <section className="panel settings-card">
          <h2>Account</h2>
          <label className="l-field" style={{ maxWidth: '16rem' }}>
            <span>Starting capital</span>
            <input value={capital} onChange={(e) => setCapital(e.target.value)} inputMode="decimal" />
          </label>
          <div className="settings-row">
            <button type="button" className="l-btn l-btn-primary" onClick={() => void handleSaveCapital()}>
              Save capital
            </button>
          </div>
        </section>

        <section className="panel settings-card">
          <h2>Backup</h2>
          <div className="settings-row">
            <button type="button" className="l-btn l-btn-primary" onClick={() => void handleExportJson()}>
              Export JSON
            </button>
            <button type="button" className="l-btn" onClick={() => void handleExportCsv()}>
              Export CSV
            </button>
            <button type="button" className="l-btn" onClick={() => jsonRef.current?.click()}>
              Import JSON
            </button>
            <button type="button" className="l-btn" onClick={() => csvRef.current?.click()}>
              Import CSV
            </button>
            <input
              ref={jsonRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImportJson(file, 'merge')
                e.target.value = ''
              }}
            />
            <input
              ref={csvRef}
              type="file"
              accept="text/csv,.csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImportCsv(file)
                e.target.value = ''
              }}
            />
          </div>
          <p className="muted">JSON import merges into the current journal. CSV always appends new rows.</p>
        </section>

        <section className="panel settings-card">
          <h2>Sample &amp; reset</h2>
          <div className="settings-row">
            <button type="button" className="l-btn" onClick={() => void handleDemo()}>
              Load demo trades
            </button>
            <button type="button" className="l-btn l-btn-danger" onClick={() => void handleClear()}>
              Clear journal
            </button>
          </div>
          <p className="muted">{trades.length} trades currently stored in this browser.</p>
        </section>
      </div>
    </div>
  )
}
