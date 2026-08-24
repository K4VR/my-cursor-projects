import * as cheerio from 'cheerio'
import YahooFinance from 'yahoo-finance2'
import type { AnnualFinancials, RawStockData } from '../src/types.js'
import { fetchText, parsePercent } from './utils.js'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export async function fetchFinvizStats(ticker: string): Promise<Record<string, string>> {
  const html = await fetchText(`https://finviz.com/quote.ashx?t=${encodeURIComponent(ticker)}&p=d`)
  const $ = cheerio.load(html)
  const data: Record<string, string> = {}
  $('table.snapshot-table2 tr').each((_, row) => {
    $(row)
      .find('td')
      .each((i, cell) => {
        if (i % 2 === 0) {
          const key = $(cell).text().trim()
          const val = $(cell).next().text().trim()
          if (key) data[key] = val
        }
      })
  })
  if (Object.keys(data).length === 0) {
    throw new Error(`No Finviz statistics found for ${ticker}`)
  }
  return data
}

function annualFromYahoo(rows: Array<Record<string, unknown>>): AnnualFinancials[] {
  return rows
    .filter((r) => r.periodType === '12M' && typeof r.date === 'string')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-5)
    .map((r) => {
      const revenue = typeof r.totalRevenue === 'number' ? r.totalRevenue : null
      const grossProfit = typeof r.grossProfit === 'number' ? r.grossProfit : null
      const operatingIncome = typeof r.operatingIncome === 'number' ? r.operatingIncome : null
      const netIncome = typeof r.netIncome === 'number' ? r.netIncome : null
      const eps = typeof r.dilutedEPS === 'number' ? r.dilutedEPS : null
      const date = new Date(String(r.date))
      return {
        fiscalYearEnd: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        grossMargin: revenue && grossProfit != null ? grossProfit / revenue : null,
        operatingMargin: revenue && operatingIncome != null ? operatingIncome / revenue : null,
        netMargin: revenue && netIncome != null ? netIncome / revenue : null,
        totalRevenue: revenue,
        epsDiluted: eps,
      }
    })
}

async function fetchMacro(): Promise<{ sp500Yield: number | null; treasury10Y: number | null }> {
  try {
    const [tnx, spy] = await Promise.all([yf.quote('^TNX'), yf.quoteSummary('SPY', { modules: ['summaryDetail'] })])
    return {
      treasury10Y: typeof tnx.regularMarketPrice === 'number' ? tnx.regularMarketPrice / 100 : null,
      sp500Yield: spy.summaryDetail?.dividendYield ?? null,
    }
  } catch {
    return { sp500Yield: null, treasury10Y: null }
  }
}

function parseDualPercent(value: string | undefined, pick: 'first' | 'second' | 'last' = 'last'): number | null {
  if (!value) return null
  const parts = value.match(/-?\d+(?:\.\d+)?/g)
  if (!parts?.length) return null
  const raw = pick === 'first' ? parts[0] : pick === 'second' && parts[1] ? parts[1] : parts[parts.length - 1]
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n / 100 : null
}

export async function fetchRawStockData(ticker: string): Promise<RawStockData> {
  const symbol = ticker.trim().toUpperCase()
  const [finviz, quoteSummary, fundamentals, chart, macro] = await Promise.all([
    fetchFinvizStats(symbol),
    yf.quoteSummary(symbol, {
      modules: ['earningsHistory', 'earningsTrend', 'summaryDetail', 'price'],
    }),
    yf.fundamentalsTimeSeries(symbol, { period1: '2018-01-01', module: 'financials', type: 'annual' }),
    yf.chart(symbol, { period1: '2018-01-01', events: 'div' }),
    fetchMacro(),
  ])

  const dividendHistory = Object.values(chart.events?.dividends ?? {})
    .map((d) => ({ amount: d.amount, date: new Date(d.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return {
    ticker: symbol,
    companyName: quoteSummary.price?.shortName ?? quoteSummary.price?.longName ?? undefined,
    fetchedAt: new Date().toISOString(),
    finviz,
    yahoo: {
      earningsHistory: (quoteSummary.earningsHistory?.history ?? []).map((h) => ({
        epsActual: h.epsActual ?? undefined,
        epsEstimate: h.epsEstimate ?? undefined,
        surprisePercent: h.surprisePercent ?? undefined,
        quarter: h.quarter ? new Date(h.quarter) : undefined,
      })),
      earningsTrend: (quoteSummary.earningsTrend?.trend ?? []).map((t) => ({
        period: t.period,
        growth: t.growth ?? undefined,
        earningsEstimate: {
          avg: t.earningsEstimate?.avg ?? undefined,
          growth: t.earningsEstimate?.growth ?? undefined,
        },
      })),
      fiveYearAvgDividendYield: quoteSummary.summaryDetail?.fiveYearAvgDividendYield,
      dividendRate: quoteSummary.summaryDetail?.dividendRate,
      dividendYield: quoteSummary.summaryDetail?.dividendYield,
      payoutRatio: quoteSummary.summaryDetail?.payoutRatio,
      dividendHistory,
    },
    annualFinancials: annualFromYahoo(fundamentals as Array<Record<string, unknown>>),
    macro,
  }
}

export function finvizGrowthPercent(key: string, finviz: Record<string, string>): number | null {
  return parsePercent(finviz[key])
}

export { parseDualPercent }
