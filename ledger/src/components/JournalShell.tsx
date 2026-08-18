import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
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
        <Outlet />
      </main>
    </div>
  )
}
