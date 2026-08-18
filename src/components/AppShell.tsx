import { NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'

const links = [
  { to: '/library', label: 'Library', end: true },
  { to: '/themes', label: 'Themes' },
  { to: '/famous', label: 'Famous' },
  { to: '/my-study', label: 'My Study' },
  { to: '/journal', label: 'Ledger' },
]

export function AppShell() {
  useEffect(() => {
    document.title = 'KJV Study'
  }, [])

  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="topnav-inner">
          <NavLink to="/library" className="brand" end>
            <span className="brand-mark">KJV Study</span>
            <span className="brand-sub">King James</span>
          </NavLink>
          <nav className="nav-links" aria-label="Primary">
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
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
