import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { BookPage } from './pages/BookPage'
import { ChapterPage } from './pages/ChapterPage'
import { FamousPage } from './pages/FamousPage'
import { LibraryPage } from './pages/LibraryPage'
import { MyStudyPage } from './pages/MyStudyPage'
import { ThemeDetailPage } from './pages/ThemeDetailPage'
import { ThemesPage } from './pages/ThemesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LibraryPage />} />
          <Route path="book/:bookSlug" element={<BookPage />} />
          <Route path="read/:bookSlug/:chapterNum" element={<ChapterPage />} />
          <Route path="themes" element={<ThemesPage />} />
          <Route path="themes/:themeId" element={<ThemeDetailPage />} />
          <Route path="famous" element={<FamousPage />} />
          <Route path="my-study" element={<MyStudyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
