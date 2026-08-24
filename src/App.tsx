import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { JournalShell } from './components/JournalShell'
import { JournalProvider } from './lib/hooks'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { TradeDetailPage } from './pages/TradeDetailPage'
import { TradeFormPage } from './pages/TradeFormPage'
import { TradesPage } from './pages/TradesPage'

export default function App() {
  return (
    <HashRouter>
      <JournalProvider>
      <Routes>
        <Route element={<JournalShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="trades" element={<TradesPage />} />
          <Route path="trades/new" element={<TradeFormPage />} />
          <Route path="trades/:id" element={<TradeDetailPage />} />
          <Route path="trades/:id/edit" element={<TradeFormPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </JournalProvider>
    </HashRouter>
  )
}
