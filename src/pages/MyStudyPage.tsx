import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { books, getBookName } from '../data/catalog'
import { exportBackup, importBackup } from '../lib/db'
import { useAllStudy } from '../lib/hooks'
import type { StudyBackup } from '../types'

export function MyStudyPage() {
  const { notes, highlights, userThemes, refresh } = useAllStudy()
  const [bookFilter, setBookFilter] = useState('all')
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filteredNotes = useMemo(
    () => (bookFilter === 'all' ? notes : notes.filter((n) => n.book === bookFilter)),
    [notes, bookFilter],
  )
  const filteredHighlights = useMemo(
    () =>
      bookFilter === 'all' ? highlights : highlights.filter((h) => h.book === bookFilter),
    [highlights, bookFilter],
  )

  async function handleExport() {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kjv-study-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as StudyBackup
      await importBackup(data)
      refresh()
      setMessage(`Imported ${data.notes.length} notes and ${data.highlights.length} highlights.`)
    } catch {
      setMessage('Could not import that file. Check that it is a KJV Study backup.')
    }
  }

  return (
    <div>
      <header className="page-hero">
        <p className="section-label">Personal annotations</p>
        <h1>My Study</h1>
        <p className="lede">
          Everything you have highlighted or noted, kept in this browser. Export a
          backup anytime so your work travels with you.
        </p>
      </header>

      <div className="backup-actions">
        <button type="button" className="btn btn-primary" onClick={handleExport}>
          Export backup
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
            e.target.value = ''
          }}
        />
      </div>
      {message ? <p className="muted">{message}</p> : null}

      <div className="filter-row">
        <label>
          Filter by book{' '}
          <select value={bookFilter} onChange={(e) => setBookFilter(e.target.value)}>
            <option value="all">All books</option>
            {books.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2 className="section-label">Notes ({filteredNotes.length})</h2>
        {filteredNotes.length === 0 ? (
          <div className="empty-state">No notes yet. Open a verse and start writing.</div>
        ) : (
          <div className="card-list">
            {filteredNotes.map((n) => (
              <Link
                key={n.id}
                className="study-card"
                to={`/read/${n.book}/${n.chapter}?v=${n.verse}`}
              >
                <h3>
                  {getBookName(n.book)} {n.chapter}:{n.verse}
                </h3>
                <p>{n.text}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 className="section-label">Highlights ({filteredHighlights.length})</h2>
        {filteredHighlights.length === 0 ? (
          <div className="empty-state">No highlights yet.</div>
        ) : (
          <ul className="plain-list">
            {filteredHighlights.map((h) => (
              <li key={h.id}>
                <Link to={`/read/${h.book}/${h.chapter}?v=${h.verse}`}>
                  {getBookName(h.book)} {h.chapter}:{h.verse}
                  <span className="item-meta">Color: {h.color}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="section-label">Personal themes ({userThemes.length})</h2>
        {userThemes.length === 0 ? (
          <div className="empty-state">
            Create a theme from the verse study panel while reading.
          </div>
        ) : (
          <div className="card-list">
            {userThemes.map((t) => (
              <div key={t.id} className="study-card">
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <ul className="plain-list" style={{ marginTop: '0.65rem' }}>
                  {t.verses.map((v) => (
                    <li key={`${v.book}.${v.chapter}.${v.verse}`}>
                      <Link to={`/read/${v.book}/${v.chapter}?v=${v.verse}`}>
                        {getBookName(v.book)} {v.chapter}:{v.verse}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
