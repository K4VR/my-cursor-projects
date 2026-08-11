import booksJson from './books.json'
import themesJson from './themes.json'
import famousJson from './famous-verses.json'
import type { BookData, BookMeta, CrossRefMap, FamousVerse, Theme } from '../types'

export const books: BookMeta[] = booksJson as BookMeta[]
export const themes: Theme[] = themesJson as Theme[]
export const famousVerses: FamousVerse[] = famousJson as FamousVerse[]

export function getBook(slug: string): BookMeta | undefined {
  return books.find((b) => b.slug === slug)
}

export function getBookName(slug: string): string {
  return getBook(slug)?.name ?? slug
}

export function otBooks(): BookMeta[] {
  return books.filter((b) => b.testament === 'OT')
}

export function ntBooks(): BookMeta[] {
  return books.filter((b) => b.testament === 'NT')
}

export function adjacentChapter(
  slug: string,
  chapter: number,
  delta: -1 | 1,
): { book: string; chapter: number } | null {
  const book = getBook(slug)
  if (!book) return null
  const next = chapter + delta
  if (next >= 1 && next <= book.chapters) {
    return { book: slug, chapter: next }
  }
  const idx = books.findIndex((b) => b.slug === slug)
  if (delta === 1 && idx < books.length - 1) {
    return { book: books[idx + 1].slug, chapter: 1 }
  }
  if (delta === -1 && idx > 0) {
    const prev = books[idx - 1]
    return { book: prev.slug, chapter: prev.chapters }
  }
  return null
}

const bookCache = new Map<string, BookData>()
const xrefCache = new Map<string, CrossRefMap>()

export async function loadBook(slug: string): Promise<BookData> {
  const cached = bookCache.get(slug)
  if (cached) return cached
  const res = await fetch(`/data/kjv/${slug}.json`)
  if (!res.ok) throw new Error(`Failed to load ${slug}`)
  const data = (await res.json()) as BookData
  bookCache.set(slug, data)
  return data
}

export async function loadCrossRefs(slug: string): Promise<CrossRefMap> {
  const cached = xrefCache.get(slug)
  if (cached) return cached
  const res = await fetch(`/data/crossrefs/${slug}.json`)
  if (!res.ok) return {}
  const data = (await res.json()) as CrossRefMap
  xrefCache.set(slug, data)
  return data
}

export async function loadVerseText(
  book: string,
  chapter: number,
  verse: number,
): Promise<string | null> {
  const data = await loadBook(book)
  const verses = data.chapters[String(chapter)] ?? data.chapters[chapter as unknown as string]
  if (!verses) return null
  return verses.find((v) => v.verse === verse)?.text ?? null
}

export function getTheme(id: string): Theme | undefined {
  return themes.find((t) => t.id === id)
}
