import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { VerseStudyPanel } from '../components/VerseStudyPanel'
import {
  adjacentChapter,
  getBook,
  loadBook,
  loadCrossRefs,
  sortCrossRefs,
} from '../data/catalog'
import { useBookAnnotations, useVerseStudy } from '../lib/hooks'
import type { BookData, CrossRefMap, HighlightColor, Verse } from '../types'

export function ChapterPage() {
  const { bookSlug = '', chapterNum = '' } = useParams()
  const chapter = Number(chapterNum)
  const book = getBook(bookSlug)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedVerse = Number(searchParams.get('v') || 0) || null
  const navigate = useNavigate()

  const [data, setData] = useState<BookData | null>(null)
  const [xrefs, setXrefs] = useState<CrossRefMap>({})
  const [error, setError] = useState<string | null>(null)
  const { highlights, refresh } = useBookAnnotations(bookSlug)

  const selectedText = (() => {
    if (!data || !selectedVerse) return ''
    const verses = data.chapters[String(chapter)] ?? []
    return verses.find((v) => v.verse === selectedVerse)?.text ?? ''
  })()

  const study = useVerseStudy(bookSlug, chapter, selectedVerse)

  useEffect(() => {
    if (!book || !chapter || chapter < 1 || chapter > book.chapters) return
    let cancelled = false
    setData(null)
    setError(null)
    ;(async () => {
      try {
        const [bookData, refs] = await Promise.all([
          loadBook(book.slug),
          loadCrossRefs(book.slug),
        ])
        if (cancelled) return
        setData(bookData)
        setXrefs(refs)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [book, chapter])

  useEffect(() => {
    if (!selectedVerse) return
    const el = document.getElementById(`v-${selectedVerse}`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedVerse, data])

  // Refresh highlight markers after color changes settle
  useEffect(() => {
    if (!selectedVerse) return
    const t = window.setTimeout(refresh, 50)
    return () => window.clearTimeout(t)
  }, [study.color, selectedVerse, refresh])

  if (!book || !chapter || chapter < 1 || chapter > book.chapters) {
    return <Navigate to="/library" replace />
  }

  const verses: Verse[] = data?.chapters[String(chapter)] ?? []
  const prev = adjacentChapter(book.slug, chapter, -1)
  const next = adjacentChapter(book.slug, chapter, 1)
  const highlightMap = new Map(highlights.map((h) => [`${h.chapter}:${h.verse}`, h.color]))

  function selectVerse(v: number) {
    setSearchParams({ v: String(v) })
  }

  function closePanel() {
    setSearchParams({})
  }

  async function handleColor(color: HighlightColor | null) {
    await study.persistHighlight(color)
    refresh()
  }

  const verseXrefs = selectedVerse
    ? sortCrossRefs(xrefs[`${chapter}:${selectedVerse}`] ?? [])
    : []

  return (
    <div className="reader-layout">
      <div className="reader-column">
        <div className="reader-toolbar">
          <div>
            <p className="section-label" style={{ marginBottom: '0.2rem' }}>
              <Link to={`/book/${book.slug}`}>{book.name}</Link>
            </p>
            <h1>
              {book.name} {chapter}
            </h1>
          </div>
          <div className="reader-nav">
            <button
              type="button"
              className="btn"
              disabled={!prev}
              onClick={() => prev && navigate(`/read/${prev.book}/${prev.chapter}`)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn"
              disabled={!next}
              onClick={() => next && navigate(`/read/${next.book}/${next.chapter}`)}
            >
              Next
            </button>
          </div>
        </div>

        {error ? <p className="empty-state">{error}</p> : null}
        {!data && !error ? <p className="muted">Loading chapter…</p> : null}

        <div className="verse-list">
          {verses.map((v) => {
            const color = highlightMap.get(`${chapter}:${v.verse}`)
            return (
              <button
                key={v.verse}
                id={`v-${v.verse}`}
                type="button"
                className={`verse-row${selectedVerse === v.verse ? ' selected' : ''}`}
                onClick={() => selectVerse(v.verse)}
              >
                <span className="verse-num">{v.verse}</span>
                <span className={`verse-text${color ? ` hl-${color}` : ''}`}>{v.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedVerse ? (
        <VerseStudyPanel
          book={book.slug}
          chapter={chapter}
          verse={selectedVerse}
          verseText={selectedText}
          note={study.note}
          color={study.color}
          saving={study.saving}
          crossRefs={verseXrefs}
          onNoteChange={study.updateNote}
          onColorChange={handleColor}
          onClose={closePanel}
        />
      ) : (
        <aside className="study-panel" aria-label="Study tips">
          <h2>Study panel</h2>
          <p className="muted">
            Select a verse to highlight it, add a note, browse cross-references,
            or save it to a personal theme.
          </p>
        </aside>
      )}
    </div>
  )
}
