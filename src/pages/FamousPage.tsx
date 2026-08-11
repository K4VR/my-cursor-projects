import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { famousVerses, getBookName, loadVerseText } from '../data/catalog'
import type { FamousVerse } from '../types'

interface Row extends FamousVerse {
  text: string | null
}

export function FamousPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const set = new Set(famousVerses.map((v) => v.category))
    return ['all', ...Array.from(set).sort()]
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const loaded = await Promise.all(
        famousVerses.map(async (v) => ({
          ...v,
          text: await loadVerseText(v.book, v.chapter, v.verse),
        })),
      )
      if (!cancelled) setRows(loaded)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = rows.filter((r) => category === 'all' || r.category === category)

  return (
    <div>
      <header className="page-hero">
        <p className="section-label">Well-known passages</p>
        <h1>Famous Verses</h1>
        <p className="lede">
          A starter collection of cherished verses. Open any entry to read it in
          context and begin your own notes.
        </p>
      </header>

      <div className="filter-row">
        <label>
          Category{' '}
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card-list">
        {filtered.map((row) => (
          <Link
            key={`${row.book}.${row.chapter}.${row.verse}`}
            className="study-card"
            to={`/read/${row.book}/${row.chapter}?v=${row.verse}`}
          >
            <h3>
              {getBookName(row.book)} {row.chapter}:{row.verse}
            </h3>
            <p className="item-meta">{row.label}</p>
            <p style={{ marginTop: '0.45rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
              {row.text ?? '…'}
            </p>
            <span className="pill">{row.category}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
