import { Link } from 'react-router-dom'
import { ntBooks, otBooks } from '../data/catalog'

export function LibraryPage() {
  return (
    <div>
      <header className="page-hero">
        <p className="section-label">Personal study library</p>
        <h1 className="library-brand">KJV Study</h1>
        <p className="lede">
          Explore the King James Version book by book—with notes, highlights,
          cross-references, themes, and famous verses kept close to the text.
        </p>
      </header>

      <section className="testament-block" aria-labelledby="ot-heading">
        <h2 id="ot-heading" className="section-label">Old Testament</h2>
        <div className="book-grid">
          {otBooks().map((book) => (
            <Link key={book.slug} className="book-link" to={`/book/${book.slug}`}>
              <strong>{book.name}</strong>
              <span>{book.chapters} chapters</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="testament-block" aria-labelledby="nt-heading">
        <h2 id="nt-heading" className="section-label">New Testament</h2>
        <div className="book-grid">
          {ntBooks().map((book) => (
            <Link key={book.slug} className="book-link" to={`/book/${book.slug}`}>
              <strong>{book.name}</strong>
              <span>{book.chapters} chapters</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="footer-note">
        Scripture text: King James Version (public domain). Cross-references
        derived from OpenBible.info / Treasury of Scripture Knowledge (CC BY).
        {' '}
        <Link to="/journal">Stock trading journal</Link>
      </p>
    </div>
  )
}
