import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getAllHighlights,
  getAllNotes,
  getHighlight,
  getHighlightsForBook,
  getNote,
  getNotesForBook,
  getUserThemes,
  saveNote,
  setHighlight,
} from './db'
import type {
  HighlightColor,
  HighlightRecord,
  NoteRecord,
  UserTheme,
} from '../types'

export function useVerseStudy(book: string, chapter: number, verse: number | null) {
  const [note, setNote] = useState('')
  const [color, setColor] = useState<HighlightColor | null>(null)
  const [saving, setSaving] = useState(false)
  const dirtyRef = useRef(false)
  const noteRef = useRef('')
  const contextRef = useRef({ book, chapter, verse })

  useEffect(() => {
    contextRef.current = { book, chapter, verse }
  }, [book, chapter, verse])

  useEffect(() => {
    dirtyRef.current = false
    if (verse == null) {
      setNote('')
      noteRef.current = ''
      setColor(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const [n, h] = await Promise.all([
        getNote(book, chapter, verse),
        getHighlight(book, chapter, verse),
      ])
      if (cancelled) return
      const text = n?.text ?? ''
      setNote(text)
      noteRef.current = text
      setColor(h?.color ?? null)
      dirtyRef.current = false
    })()
    return () => {
      cancelled = true
      if (dirtyRef.current && verse != null) {
        void saveNote(book, chapter, verse, noteRef.current)
        dirtyRef.current = false
      }
    }
  }, [book, chapter, verse])

  useEffect(() => {
    if (verse == null || !dirtyRef.current) return
    const handle = window.setTimeout(() => {
      const ctx = contextRef.current
      if (ctx.verse == null) return
      setSaving(true)
      void saveNote(ctx.book, ctx.chapter, ctx.verse, noteRef.current).finally(() =>
        setSaving(false),
      )
      dirtyRef.current = false
    }, 400)
    return () => window.clearTimeout(handle)
  }, [note, book, chapter, verse])

  const updateNote = useCallback((text: string) => {
    setNote(text)
    noteRef.current = text
    dirtyRef.current = true
  }, [])

  const persistHighlight = useCallback(
    async (next: HighlightColor | null) => {
      if (verse == null) return
      setColor(next)
      await setHighlight(book, chapter, verse, next)
    },
    [book, chapter, verse],
  )

  return { note, color, saving, updateNote, persistHighlight }
}

export function useBookAnnotations(book: string) {
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [highlights, setHighlights] = useState<HighlightRecord[]>([])
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [n, h] = await Promise.all([
        getNotesForBook(book),
        getHighlightsForBook(book),
      ])
      if (cancelled) return
      setNotes(n)
      setHighlights(h)
    })()
    return () => {
      cancelled = true
    }
  }, [book, tick])

  return { notes, highlights, refresh }
}

export function useAllStudy() {
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [highlights, setHighlights] = useState<HighlightRecord[]>([])
  const [userThemes, setUserThemes] = useState<UserTheme[]>([])
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [n, h, t] = await Promise.all([
        getAllNotes(),
        getAllHighlights(),
        getUserThemes(),
      ])
      if (cancelled) return
      setNotes(n)
      setHighlights(h)
      setUserThemes(t)
    })()
    return () => {
      cancelled = true
    }
  }, [tick])

  return { notes, highlights, userThemes, refresh }
}
