import { Link } from 'react-router-dom'
import { themes } from '../data/catalog'

export function ThemesPage() {
  return (
    <div>
      <header className="page-hero">
        <p className="section-label">Topical study</p>
        <h1>Themes</h1>
        <p className="lede">
          Curated collections of verses for tracing major themes through Scripture.
          Open a theme to jump into the reader.
        </p>
      </header>

      <div className="card-list">
        {themes.map((theme) => (
          <Link key={theme.id} className="study-card" to={`/themes/${theme.id}`}>
            <h2>{theme.name}</h2>
            <p>{theme.description}</p>
            <span className="pill">{theme.verses.length} verses</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
