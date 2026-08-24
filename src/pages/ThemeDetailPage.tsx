import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getBookName, getTheme, loadVerseText } from '../data/catalog'
import type { ThemeVerse } from '../types'

interface Row extends ThemeVerse {
  text: string | null
}

export function ThemeDetailPage() {
  const { themeId = '' } = useParams()
  const theme = getTheme(themeId)
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    if (!theme) return
    let cancelled = false
    ;(async () => {
      const loaded = await Promise.all(
        theme.verses.map(async (v) => ({
          ...v,
          text: await loadVerseText(v.book, v.chapter, v.verse),
        })),
      )
      if (!cancelled) setRows(loaded)
    })()
    return () => {
      cancelled = true
    }
  }, [theme])

  if (!theme) return <Navigate to="/themes" replace />

  return (
    <div>
      <header className="page-hero">
        <p className="section-label">
          <Link to="/themes">Themes</Link>
        </p>
        <h1>{theme.name}</h1>
        <p className="lede">{theme.description}</p>
      </header>

      <div className="card-list">
        {rows.map((row) => (
          <Link
            key={`${row.book}.${row.chapter}.${row.verse}`}
            className="study-card"
            to={`/read/${row.book}/${row.chapter}?v=${row.verse}`}
          >
            <h3>
              {getBookName(row.book)} {row.chapter}:{row.verse}
            </h3>
            {row.note ? <p className="item-meta">{row.note}</p> : null}
            <p style={{ marginTop: '0.45rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
              {row.text ?? '…'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
