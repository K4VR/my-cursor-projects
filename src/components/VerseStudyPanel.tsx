import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CrossRef, HighlightColor, UserTheme } from '../types'
import { getBookName } from '../data/catalog'
import { addVerseToUserTheme, getUserThemes, saveUserTheme } from '../lib/db'

const COLORS: HighlightColor[] = ['gold', 'sage', 'sky', 'rose', 'lilac']

interface Props {
  book: string
  chapter: number
  verse: number
  verseText: string
  note: string
  color: HighlightColor | null
  saving: boolean
  crossRefs: CrossRef[]
  onNoteChange: (text: string) => void
  onColorChange: (color: HighlightColor | null) => void
  onClose: () => void
}

export function VerseStudyPanel({
  book,
  chapter,
  verse,
  verseText,
  note,
  color,
  saving,
  crossRefs,
  onNoteChange,
  onColorChange,
  onClose,
}: Props) {
  const [themes, setThemes] = useState<UserTheme[]>([])
  const [newThemeName, setNewThemeName] = useState('')
  const title = useMemo(
    () => `${getBookName(book)} ${chapter}:${verse}`,
    [book, chapter, verse],
  )

  useEffect(() => {
    getUserThemes().then(setThemes)
  }, [book, chapter, verse])

  async function handleAddToTheme(themeId: string) {
    await addVerseToUserTheme(themeId, { book, chapter, verse })
    setThemes(await getUserThemes())
  }

  async function handleCreateTheme() {
    const name = newThemeName.trim()
    if (!name) return
    const theme: UserTheme = {
      id: `user-${Date.now()}`,
      name,
      description: 'Personal theme',
      verses: [{ book, chapter, verse }],
      createdAt: Date.now(),
    }
    await saveUserTheme(theme)
    setNewThemeName('')
    setThemes(await getUserThemes())
  }

  return (
    <>
      <button type="button" className="sheet-backdrop" aria-label="Close study panel" onClick={onClose} />
      <aside className="study-panel" aria-label="Verse study panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <h2>{title}</h2>
            <p className="muted">{verseText}</p>
          </div>
          <button type="button" className="btn" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <section className="panel-section">
          <h3>Highlight</h3>
          <div className="color-row">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch ${c}${color === c ? ' active' : ''}`}
                aria-label={`Highlight ${c}`}
                aria-pressed={color === c}
                onClick={() => onColorChange(color === c ? null : c)}
              />
            ))}
            <button type="button" className="btn" onClick={() => onColorChange(null)}>
              Clear
            </button>
          </div>
        </section>

        <section className="panel-section">
          <h3>Notes {saving ? '· saving…' : ''}</h3>
          <textarea
            className="note-box"
            value={note}
            placeholder="Write a note for this verse…"
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </section>

        <section className="panel-section">
          <h3>Cross-references</h3>
          {crossRefs.length === 0 ? (
            <p className="muted">No cross-references for this verse.</p>
          ) : (
            <ul className="xref-list">
              {crossRefs.map((ref) => (
                <li key={`${ref.book}.${ref.chapter}.${ref.verse}`}>
                  <Link to={`/read/${ref.book}/${ref.chapter}?v=${ref.verse}`}>
                    {getBookName(ref.book)} {ref.chapter}:{ref.verse}
                    {ref.note ? <span className="xref-note">{ref.note}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-section">
          <h3>Add to theme</h3>
          {themes.length > 0 ? (
            <ul className="plain-list">
              {themes.map((t) => (
                <li key={t.id}>
                  <button type="button" className="btn" onClick={() => handleAddToTheme(t.id)}>
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No personal themes yet.</p>
          )}
          <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.55rem' }}>
            <input
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="New theme name"
              style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 8, padding: '0.45rem 0.7rem', background: '#fffdf7' }}
            />
            <button type="button" className="btn btn-primary" onClick={handleCreateTheme}>
              Create
            </button>
          </div>
        </section>
      </aside>
    </>
  )
}
