import { useEffect, useRef, useState } from 'react'
import { csvToTrades, tradesToCsv } from '../lib/csv'
import {
  addTrades,
  clearJournal,
  deleteAccount,
  exportBackup,
  importBackup,
  loadDemoJournal,
  saveAccount,
} from '../lib/db'
import { visibleAccounts } from '../lib/accounts'
import { nextAccountDraft, useJournal } from '../lib/hooks'
import { formatMoney } from '../lib/money'
import type { Account, JournalBackup } from '../types'

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
  const {
    trades,
    accounts,
    settings,
    ready,
    refresh,
    persistAccount,
    setActiveAccountId,
    visibleAccounts: visible,
  } = useJournal()
  const [message, setMessage] = useState<string | null>(null)
  const [draft, setDraft] = useState(nextAccountDraft())
  const jsonRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  if (!ready) return <p className="muted">Loading settings…</p>

  const tradeCount = (id: string) => trades.filter((trade) => trade.accountId === id).length

  async function handleSaveAccount(account: Account) {
    if (!account.name.trim()) {
      setMessage('Account name is required.')
      return
    }
    await persistAccount(account)
    setMessage(`Saved ${account.name.trim()}.`)
  }

  async function handleArchive(account: Account) {
    if (!account.archived && visibleAccounts(accounts).length <= 1) {
      setMessage('Keep at least one active account.')
      return
    }
    const next = { ...account, archived: !account.archived }
    await persistAccount(next)
    if (next.archived && settings.lastAccountId === account.id) {
      await setActiveAccountId('all')
    }
    setMessage(next.archived ? `Archived ${account.name}.` : `Restored ${account.name}.`)
  }

  async function handleDelete(account: Account) {
    if (tradeCount(account.id) > 0) {
      setMessage('Archive that account instead. It still has trades.')
      return
    }
    if (visibleAccounts(accounts).filter((row) => row.id !== account.id).length === 0 && !account.archived) {
      setMessage('Keep at least one active account.')
      return
    }
    if (!confirm(`Delete ${account.name}?`)) return
    await deleteAccount(account.id)
    if (settings.lastAccountId === account.id) await setActiveAccountId('all')
    refresh()
    setMessage(`Deleted ${account.name}.`)
  }

  async function handleAddAccount() {
    if (!draft.name.trim()) {
      setMessage('New accounts need a name.')
      return
    }
    await persistAccount({ ...draft, name: draft.name.trim(), createdAt: Date.now() })
    setDraft(nextAccountDraft())
    setMessage('Account added.')
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
      tradesToCsv(trades, accounts),
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
      const parsed = csvToTrades(await file.text(), accounts)
      for (const account of parsed.newAccounts) {
        await saveAccount(account)
      }
      await addTrades(parsed.trades)
      refresh()
      setMessage(`Imported ${parsed.trades.length} trades from CSV.`)
    } catch {
      setMessage('Could not import that CSV file.')
    }
  }

  async function handleDemo() {
    await loadDemoJournal()
    refresh()
    setMessage('Demo journal loaded. Your previous trades were replaced.')
  }

  async function handleClear() {
    if (!confirm('Erase every trade and setting stored in this browser?')) return
    await clearJournal()
    refresh()
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
          <h2>Accounts</h2>
          <p className="muted" style={{ margin: 0 }}>
            Each trade belongs to one account. All rolls up the unarchived accounts
            ({formatMoney(visible.reduce((sum, account) => sum + account.startingCapital, 0))} starting capital).
          </p>
          <div className="account-list">
            {accounts.map((account) => (
              <AccountEditor
                key={account.id}
                account={account}
                trades={tradeCount(account.id)}
                canArchive={!account.archived ? visible.length > 1 : true}
                onSave={handleSaveAccount}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <div className="account-editor add">
            <label className="l-field">
              <span>New account</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Roth IRA"
              />
            </label>
            <label className="l-field">
              <span>Broker</span>
              <input
                value={draft.broker}
                onChange={(e) => setDraft((prev) => ({ ...prev, broker: e.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label className="l-field">
              <span>Starting capital</span>
              <input
                inputMode="decimal"
                value={draft.startingCapital || ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, startingCapital: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <button type="button" className="l-btn l-btn-primary" onClick={() => void handleAddAccount()}>
              Add account
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

function AccountEditor({
  account,
  trades,
  canArchive,
  onSave,
  onArchive,
  onDelete,
}: {
  account: Account
  trades: number
  canArchive: boolean
  onSave: (account: Account) => Promise<void>
  onArchive: (account: Account) => Promise<void>
  onDelete: (account: Account) => Promise<void>
}) {
  const [name, setName] = useState(account.name)
  const [broker, setBroker] = useState(account.broker)
  const [capital, setCapital] = useState(String(account.startingCapital))

  useEffect(() => {
    setName(account.name)
    setBroker(account.broker)
    setCapital(String(account.startingCapital))
  }, [account.name, account.broker, account.startingCapital])

  return (
    <div className={`account-editor ${account.archived ? 'archived' : ''}`}>
      <label className="l-field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="l-field">
        <span>Broker</span>
        <input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="Optional" />
      </label>
      <label className="l-field">
        <span>Starting capital</span>
        <input value={capital} onChange={(e) => setCapital(e.target.value)} inputMode="decimal" />
      </label>
      <div className="account-editor-actions">
        <button
          type="button"
          className="l-btn l-btn-primary"
          onClick={() =>
            void onSave({
              ...account,
              name,
              broker,
              startingCapital: Number(capital) || 0,
            })
          }
        >
          Save
        </button>
        <button type="button" className="l-btn" disabled={!canArchive} onClick={() => void onArchive(account)}>
          {account.archived ? 'Restore' : 'Archive'}
        </button>
        <button
          type="button"
          className="l-btn l-btn-danger"
          disabled={trades > 0}
          onClick={() => void onDelete(account)}
        >
          Delete
        </button>
        <p className="muted">
          {trades} trade{trades === 1 ? '' : 's'}
          {account.archived ? ' · archived' : ''}
        </p>
      </div>
    </div>
  )
}
