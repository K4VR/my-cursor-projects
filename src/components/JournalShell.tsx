import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useJournal } from '../lib/hooks'
import '../journal.css'

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/trades', label: 'Trades' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

export function JournalShell() {
  const { ready, blocked, loadError, visibleAccounts, activeAccountId, setActiveAccountId } = useJournal()

  useEffect(() => {
    document.documentElement.classList.add('ledger-root')
    document.title = 'Ledger — Stock Trading Journal'
    if (document.getElementById('ledger-fonts')) return
    const font = document.createElement('link')
    font.id = 'ledger-fonts'
    font.rel = 'stylesheet'
    font.href = FONT_HREF
    document.head.appendChild(font)
  }, [])

  return (
    <div className="ledger">
      <header className="ledger-top">
        <div className="ledger-top-inner">
          <NavLink to="/" className="ledger-brand" end>
            <strong>Ledger</strong>
            <span>Stock journal</span>
          </NavLink>
          {ready ? (
            <div className="account-switch" role="tablist" aria-label="Account">
              <button
                type="button"
                role="tab"
                aria-selected={activeAccountId === 'all'}
                className={activeAccountId === 'all' ? 'active' : undefined}
                onClick={() => void setActiveAccountId('all')}
              >
                All
              </button>
              {visibleAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  role="tab"
                  aria-selected={activeAccountId === account.id}
                  className={activeAccountId === account.id ? 'active' : undefined}
                  onClick={() => void setActiveAccountId(account.id)}
                >
                  {account.name}
                </button>
              ))}
            </div>
          ) : null}
          <nav className="ledger-nav" aria-label="Journal">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="ledger-main">
        {!ready ? (
          <div className="empty">
            {loadError ? (
              <p style={{ margin: 0 }}>{loadError}</p>
            ) : blocked ? (
              <>
                <p style={{ margin: 0 }}>
                  Another Ledger tab is holding the old data file. Close every other Ledger tab,
                  then refresh.
                </p>
                <div className="ledger-actions" style={{ marginTop: '0.9rem' }}>
                  <button type="button" className="l-btn l-btn-primary" onClick={() => window.location.reload()}>
                    Refresh
                  </button>
                </div>
              </>
            ) : (
              <p style={{ margin: 0 }}>Loading journal…</p>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}
