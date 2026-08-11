export type Testament = 'OT' | 'NT'

export type HighlightColor = 'gold' | 'sage' | 'sky' | 'rose' | 'lilac'

export interface BookMeta {
  slug: string
  name: string
  abbreviation: string
  testament: Testament
  chapters: number
  order: number
}

export interface Verse {
  verse: number
  text: string
}

export interface BookData {
  book: string
  chapters: Record<string, Verse[]>
}

export interface VerseRef {
  book: string
  chapter: number
  verse: number
}

export interface CrossRef extends VerseRef {
  note?: string
}

export type CrossRefMap = Record<string, CrossRef[]>

export interface ThemeVerse extends VerseRef {
  note?: string
}

export interface Theme {
  id: string
  name: string
  description: string
  verses: ThemeVerse[]
}

export interface FamousVerse extends VerseRef {
  label: string
  category: string
}

export interface NoteRecord {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  updatedAt: number
}

export interface HighlightRecord {
  id: string
  book: string
  chapter: number
  verse: number
  color: HighlightColor
  updatedAt: number
}

export interface UserTheme {
  id: string
  name: string
  description: string
  verses: VerseRef[]
  createdAt: number
}

export interface StudyBackup {
  version: 1
  exportedAt: number
  notes: NoteRecord[]
  highlights: HighlightRecord[]
  userThemes: UserTheme[]
}

export function verseId(book: string, chapter: number, verse: number): string {
  return `${book}.${chapter}.${verse}`
}

export function formatRef(bookName: string, chapter: number, verse: number): string {
  return `${bookName} ${chapter}:${verse}`
}
