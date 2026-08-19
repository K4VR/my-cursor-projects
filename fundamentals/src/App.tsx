import { useCallback, useState } from 'react'
import type { AnalysisResult } from './types.ts'
import { AdvancedWorksheet } from './components/AdvancedWorksheet.tsx'
import { ScoredWorksheet } from './components/ScoredWorksheet.tsx'
import { TickerBar } from './components/TickerBar.tsx'
import { analyzeTicker, isLikelyStaticHost } from './lib/api.ts'

type Tab = 'advanced' | 'scored'

export default function App() {
  const [tab, setTab] = useState<Tab>('advanced')
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyze = useCallback(async (symbol: string) => {
    const next = symbol.trim().toUpperCase()
    if (!next) return
    setTicker(next)
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeTicker(next)
      setResult(data as AnalysisResult)
    } catch (err) {
      setResult(null)
      const message = err instanceof Error ? err.message : 'Analysis failed.'
      if (isLikelyStaticHost() && message.toLowerCase().includes('fetch')) {
        setError(
          'Live data is not available on the GitHub Pages preview alone. Use the full hosted app (Render) or ask to have FUNDAMENTALS_API_URL configured for this site.',
        )
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="fundamentals">
      <header className="fundamentals-top">
        <div className="fundamentals-top-inner">
          <div className="fundamentals-brand">
            <strong>Fundamentals</strong>
            <span>Advanced Peer-to-Peer</span>
          </div>
          <nav className="fundamentals-tabs" aria-label="Worksheet views">
            <button type="button" className={tab === 'advanced' ? 'active' : ''} onClick={() => setTab('advanced')}>
              Advanced P2P
            </button>
            <button type="button" className={tab === 'scored' ? 'active' : ''} onClick={() => setTab('scored')}>
              Scored P2P
            </button>
          </nav>
        </div>
      </header>

      <main className="fundamentals-main">
        <TickerBar ticker={ticker} loading={loading} onAnalyze={analyze} />

        {error ? <p className="fundamentals-error">{error}</p> : null}

        {!result && !loading && !error ? (
          <section className="fundamentals-empty">
            <h1>Fundamental stock evaluation</h1>
            <p>
              Enter a ticker to populate the Advanced Peer-to-Peer worksheet. Data is pulled from Yahoo Finance
              and Finviz, matching the spreadsheet workflow.
            </p>
            <p className="fundamentals-note">
              <strong>No npm required on your computer.</strong> Use the full hosted app (UI + data) after a
              one-time cloud deploy, or open this page from a host that includes the API.
            </p>
            <ul className="fundamentals-help-list">
              <li>
                <strong>Recommended:</strong> Deploy once on{' '}
                <a href="https://render.com/docs/infrastructure-as-code" target="_blank" rel="noreferrer">
                  Render
                </a>{' '}
                using the repo&apos;s <code>render.yaml</code> (Render installs Node and builds in the cloud).
              </li>
              <li>
                <strong>GitHub Pages</strong> hosts this UI at{' '}
                <code>/my-cursor-projects/fundamentals/</code> — set repo variable{' '}
                <code>FUNDAMENTALS_API_URL</code> to point at your Render service for live fetches.
              </li>
            </ul>
          </section>
        ) : null}

        {result ? (
          <>
            <div className="fundamentals-meta">
              <div>
                <h2>{result.worksheet.ticker}</h2>
                {result.worksheet.companyName ? <p>{result.worksheet.companyName}</p> : null}
              </div>
              <div className="fundamentals-meta-links">
                <a href={result.worksheet.sources.yahooAnalysis} target="_blank" rel="noreferrer">
                  Yahoo Analysis
                </a>
                <a href={result.worksheet.sources.finvizStatistics} target="_blank" rel="noreferrer">
                  Finviz Statistics
                </a>
                <a href={result.worksheet.sources.marketWatch} target="_blank" rel="noreferrer">
                  MarketWatch
                </a>
              </div>
              <p className="fundamentals-fetched">
                Fetched {new Date(result.worksheet.fetchedAt).toLocaleString()}
              </p>
            </div>

            {tab === 'advanced' ? (
              <AdvancedWorksheet worksheet={result.worksheet} />
            ) : (
              <ScoredWorksheet
                rows={result.scored}
                grandTotal={result.grandTotal}
                totalPossible={result.totalPossible}
                performanceRating={result.performanceRating}
                ticker={result.worksheet.ticker}
              />
            )}
          </>
        ) : null}
      </main>

      <footer className="fundamentals-footer">
        <p>
          Content presented here is for educational and informational purposes only and is not investment advice.
          Investing involves risk, including risk of loss.
        </p>
        <p className="fundamentals-footer-copy">© 2026 Payne&apos;s Education worksheet layout · Last updated 08/18/2026</p>
      </footer>
    </div>
  )
}
