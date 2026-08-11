import { Link, Navigate, useParams } from 'react-router-dom'
import { getBook } from '../data/catalog'

export function BookPage() {
  const { bookSlug = '' } = useParams()
  const book = getBook(bookSlug)

  if (!book) return <Navigate to="/" replace />

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1)

  return (
    <div>
      <header className="page-hero">
        <p className="section-label">
          {book.testament === 'OT' ? 'Old Testament' : 'New Testament'} · Book {book.order}
        </p>
        <h1>{book.name}</h1>
        <p className="lede">
          Choose a chapter to begin reading. Select any verse to open notes,
          highlights, and cross-references.
        </p>
      </header>

      <div className="chapter-grid">
        {chapters.map((n) => (
          <Link key={n} className="chapter-link" to={`/read/${book.slug}/${n}`}>
            {n}
          </Link>
        ))}
      </div>
    </div>
  )
}
