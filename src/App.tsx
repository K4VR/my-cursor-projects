import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { JournalShell } from './journal/components/JournalShell'
import { AnalyticsPage } from './journal/pages/AnalyticsPage'
import { DashboardPage } from './journal/pages/DashboardPage'
import { SettingsPage } from './journal/pages/SettingsPage'
import { TradeDetailPage } from './journal/pages/TradeDetailPage'
import { TradeFormPage } from './journal/pages/TradeFormPage'
import { TradesPage } from './journal/pages/TradesPage'
import { BookPage } from './pages/BookPage'
import { ChapterPage } from './pages/ChapterPage'
import { FamousPage } from './pages/FamousPage'
import { LibraryPage } from './pages/LibraryPage'
import { MyStudyPage } from './pages/MyStudyPage'
import { ThemeDetailPage } from './pages/ThemeDetailPage'
import { ThemesPage } from './pages/ThemesPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="journal" element={<JournalShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="trades" element={<TradesPage />} />
          <Route path="trades/new" element={<TradeFormPage />} />
          <Route path="trades/:id" element={<TradeDetailPage />} />
          <Route path="trades/:id/edit" element={<TradeFormPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
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
