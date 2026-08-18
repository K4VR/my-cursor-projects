import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import '../journal.css'

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'

const links = [
  { to: '/journal', label: 'Dashboard', end: true },
  { to: '/journal/trades', label: 'Trades' },
  { to: '/journal/analytics', label: 'Analytics' },
  { to: '/journal/settings', label: 'Settings' },
]

export function JournalShell() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('ledger-root')
    const prevTitle = document.title
    document.title = 'Ledger — Stock Trading Journal'
    let font = document.getElementById('ledger-fonts') as HTMLLinkElement | null
    if (!font) {
      font = document.createElement('link')
      font.id = 'ledger-fonts'
      font.rel = 'stylesheet'
      font.href = FONT_HREF
      document.head.appendChild(font)
    }
    return () => {
      root.classList.remove('ledger-root')
      document.title = prevTitle
    }
  }, [])

  return (
    <div className="ledger">
      <header className="ledger-top">
        <div className="ledger-top-inner">
          <NavLink to="/journal" className="ledger-brand" end>
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
            <NavLink to="/library" className="ledger-switch">
              KJV Study
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="ledger-main">
        <Outlet />
      </main>
    </div>
  )
}
