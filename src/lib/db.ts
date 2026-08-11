import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  HighlightColor,
  HighlightRecord,
  NoteRecord,
  StudyBackup,
  UserTheme,
  VerseRef,
} from '../types'
import { verseId } from '../types'

interface StudyDB extends DBSchema {
  notes: {
    key: string
    value: NoteRecord
    indexes: { 'by-book': string }
  }
  highlights: {
    key: string
    value: HighlightRecord
    indexes: { 'by-book': string }
  }
  userThemes: {
    key: string
    value: UserTheme
  }
}

let dbPromise: Promise<IDBPDatabase<StudyDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<StudyDB>('kjv-study', 1, {
      upgrade(db) {
        const notes = db.createObjectStore('notes', { keyPath: 'id' })
        notes.createIndex('by-book', 'book')
        const highlights = db.createObjectStore('highlights', { keyPath: 'id' })
        highlights.createIndex('by-book', 'book')
        db.createObjectStore('userThemes', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function getNote(
  book: string,
  chapter: number,
  verse: number,
): Promise<NoteRecord | undefined> {
  const db = await getDb()
  return db.get('notes', verseId(book, chapter, verse))
}

export async function saveNote(
  book: string,
  chapter: number,
  verse: number,
  text: string,
): Promise<NoteRecord | null> {
  const db = await getDb()
  const id = verseId(book, chapter, verse)
  if (!text.trim()) {
    await db.delete('notes', id)
    return null
  }
  const record: NoteRecord = {
    id,
    book,
    chapter,
    verse,
    text: text.trim(),
    updatedAt: Date.now(),
  }
  await db.put('notes', record)
  return record
}

export async function getAllNotes(): Promise<NoteRecord[]> {
  const db = await getDb()
  const notes = await db.getAll('notes')
  return notes.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getNotesForBook(book: string): Promise<NoteRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('notes', 'by-book', book)
}

export async function getHighlight(
  book: string,
  chapter: number,
  verse: number,
): Promise<HighlightRecord | undefined> {
  const db = await getDb()
  return db.get('highlights', verseId(book, chapter, verse))
}

export async function setHighlight(
  book: string,
  chapter: number,
  verse: number,
  color: HighlightColor | null,
): Promise<HighlightRecord | null> {
  const db = await getDb()
  const id = verseId(book, chapter, verse)
  if (!color) {
    await db.delete('highlights', id)
    return null
  }
  const record: HighlightRecord = {
    id,
    book,
    chapter,
    verse,
    color,
    updatedAt: Date.now(),
  }
  await db.put('highlights', record)
  return record
}

export async function getAllHighlights(): Promise<HighlightRecord[]> {
  const db = await getDb()
  const items = await db.getAll('highlights')
  return items.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getHighlightsForBook(book: string): Promise<HighlightRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('highlights', 'by-book', book)
}

export async function getUserThemes(): Promise<UserTheme[]> {
  const db = await getDb()
  const themes = await db.getAll('userThemes')
  return themes.sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveUserTheme(theme: UserTheme): Promise<void> {
  const db = await getDb()
  await db.put('userThemes', theme)
}

export async function deleteUserTheme(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('userThemes', id)
}

export async function addVerseToUserTheme(
  themeId: string,
  ref: VerseRef,
): Promise<UserTheme | null> {
  const db = await getDb()
  const theme = await db.get('userThemes', themeId)
  if (!theme) return null
  const exists = theme.verses.some(
    (v) => v.book === ref.book && v.chapter === ref.chapter && v.verse === ref.verse,
  )
  if (!exists) {
    theme.verses = [...theme.verses, ref]
    await db.put('userThemes', theme)
  }
  return theme
}

export async function exportBackup(): Promise<StudyBackup> {
  const [notes, highlights, userThemes] = await Promise.all([
    getAllNotes(),
    getAllHighlights(),
    getUserThemes(),
  ])
  return {
    version: 1,
    exportedAt: Date.now(),
    notes,
    highlights,
    userThemes,
  }
}

export async function importBackup(backup: StudyBackup): Promise<void> {
  if (backup.version !== 1) throw new Error('Unsupported backup version')
  const db = await getDb()
  const tx = db.transaction(['notes', 'highlights', 'userThemes'], 'readwrite')
  await Promise.all([
    ...backup.notes.map((n) => tx.objectStore('notes').put(n)),
    ...backup.highlights.map((h) => tx.objectStore('highlights').put(h)),
    ...backup.userThemes.map((t) => tx.objectStore('userThemes').put(t)),
    tx.done,
  ])
}
