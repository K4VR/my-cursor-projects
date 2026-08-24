import type { AnalysisResult, RawStockData, ScoredRow, WorksheetValues, YesNo } from '../src/types.js'
import { finvizGrowthPercent, parseDualPercent } from './fetchStockData.js'
import {
  capLabelFromBillions,
  formatMarketValue,
  marginYoY,
  marketCapBillions,
  parseNumber,
  parsePercent,
  revGrowthSimilar,
} from './utils.js'

function trendGrowth(raw: RawStockData, period: string): number | null {
  const row = raw.yahoo.earningsTrend.find((t) => t.period === period)
  return typeof row?.growth === 'number' ? row.growth : null
}

function positiveSurpriseCount(raw: RawStockData): number {
  return raw.yahoo.earningsHistory.filter((h) => (h.surprisePercent ?? 0) > 0).length
}

function increasingSurprises(raw: RawStockData): { answer: YesNo; detail: string } {
  const surprises = raw.yahoo.earningsHistory
    .map((h) => h.surprisePercent)
    .filter((v): v is number => typeof v === 'number')
  if (surprises.length < 2) return { answer: '', detail: '' }
  const prev = surprises[surprises.length - 2]
  const last = surprises[surprises.length - 1]
  const detail = `${(prev * 100).toFixed(1)}% → ${(last * 100).toFixed(1)}%`
  return { answer: prev < last ? 'Y' : 'N', detail }
}

function positiveRevisions(raw: RawStockData): { answer: YesNo; change: number | null } {
  const current = raw.yahoo.earningsTrend.find((t) => t.period === '0y')?.earningsEstimate?.avg
  const trendRow = raw.yahoo.earningsTrend.find((t) => t.period === '0y')
  const growth = trendRow?.earningsEstimate?.growth
  if (typeof current !== 'number' || typeof growth !== 'number') {
    return { answer: '', change: null }
  }
  const prior = current / (1 + growth)
  return {
    answer: current > prior ? 'Y' : 'N',
    change: prior !== 0 ? current / prior - 1 : null,
  }
}

function stableGrowth(values: Array<number | null>): YesNo {
  if (values.length < 3 || values.some((v) => v == null)) return ''
  const [recent, middle, oldest] = values as [number, number, number]
  if (recent >= middle && middle >= oldest * 1.02) return 'Y'
  return 'N'
}

function dividendRaising(raw: RawStockData): YesNo {
  const divs = raw.yahoo.dividendHistory
  if (divs.length < 4) return 'n'
  const annual: number[] = []
  const byYear = new Map<number, number[]>()
  for (const d of divs) {
    const y = d.date.getFullYear()
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(d.amount)
  }
  for (const amounts of byYear.values()) {
    annual.push(amounts.reduce((a, b) => a + b, 0))
  }
  annual.sort((a, b) => a - b)
  const last4 = annual.slice(-4)
  if (last4.length < 4) return 'n'
  const rising =
    last4[3] > last4[2] &&
    last4[2] > last4[1] &&
    last4[1] > last4[0]
  return rising ? 'y' : 'n'
}

export function computeWorksheet(raw: RawStockData): WorksheetValues {
  const f = raw.finviz
  const annual = raw.annualFinancials
  const recentAnnual = annual.at(-1)
  const pastAnnual = annual.at(-2)

  const yoyTtmYear = recentAnnual?.fiscalYearEnd
    ? String(new Date(recentAnnual.fiscalYearEnd).getFullYear()).slice(-2)
    : ''
  const yoyPastYear = pastAnnual?.fiscalYearEnd
    ? String(new Date(pastAnnual.fiscalYearEnd).getFullYear()).slice(-2)
    : ''

  const surprises = increasingSurprises(raw)
  const revisions = positiveRevisions(raw)
  const salesQoq = parsePercent(f['Sales Q/Q'])
  const epsQoq = parsePercent(f['EPS Q/Q'])

  return {
    ticker: raw.ticker,
    companyName: raw.companyName,
    fetchedAt: raw.fetchedAt,
    price: f['Price'] ?? '',
    marketCap: formatMarketValue(f['Market Cap']),
    capLabel: capLabelFromBillions(marketCapBillions(f['Market Cap'])),
    revenue: formatMarketValue(f['Sales']),
    eps: f['EPS (ttm)'] ?? '',
    salesQoq,
    epsQoq,
    revEarningsGrowthSimilar: revGrowthSimilar(salesQoq, epsQoq),
    epsSurpriseCount: positiveSurpriseCount(raw),
    increasingEpsSurprises: surprises.answer,
    increasingSurprisesDetail: surprises.detail,
    positiveEpsRevisions: revisions.answer,
    revisionChange: revisions.change,
    epsGrowthCurrentYear: finvizGrowthPercent('EPS this Y', f) ?? trendGrowth(raw, '0y'),
    epsGrowthNextYear: finvizGrowthPercent('EPS next Y', f) ?? trendGrowth(raw, '+1y'),
    epsGrowth5YearProjected: finvizGrowthPercent('EPS next 5Y', f),
    epsGrowthHistorical: parseDualPercent(f['EPS past 3/5Y'], 'last'),
    grossMarginTtm: parsePercent(f['Gross Margin']),
    operatingMarginTtm: parsePercent(f['Oper. Margin']),
    netMarginTtm: parsePercent(f['Profit Margin']),
    fiscalYearEnds: recentAnnual?.fiscalYearEnd ?? '',
    yoyComparisonTtm: yoyTtmYear ? `TTM vs '${yoyTtmYear}` : '',
    yoyComparisonYears: yoyTtmYear && yoyPastYear ? `'${yoyPastYear} vs '${yoyTtmYear}` : '',
    gmPastYear: pastAnnual?.grossMargin ?? null,
    gmRecentYear: recentAnnual?.grossMargin ?? parsePercent(f['Gross Margin']),
    gmYoyChange: marginYoY(pastAnnual?.grossMargin ?? null, recentAnnual?.grossMargin ?? null),
    omPastYear: pastAnnual?.operatingMargin ?? null,
    omRecentYear: recentAnnual?.operatingMargin ?? parsePercent(f['Oper. Margin']),
    omYoyChange: marginYoY(pastAnnual?.operatingMargin ?? null, recentAnnual?.operatingMargin ?? null),
    npmPastYear: pastAnnual?.netMargin ?? null,
    npmRecentYear: recentAnnual?.netMargin ?? parsePercent(f['Profit Margin']),
    npmYoyChange: marginYoY(pastAnnual?.netMargin ?? null, recentAnnual?.netMargin ?? null),
    roa: parsePercent(f['ROA']),
    roe: parsePercent(f['ROE']),
    debtToEquity: parseNumber(f['Debt/Eq']),
    earningsYield: (() => {
      const pe = parseNumber(f['P/E'])
      return pe && pe > 0 ? 1 / pe : null
    })(),
    trailingPe: parseNumber(f['P/E']),
    forwardPe: parseNumber(f['Forward P/E']),
    peg: parseNumber(f['PEG']),
    priceToSales: parseNumber(f['P/S']),
    priceToBook: parseNumber(f['P/B']),
    sp500Yield: raw.macro.sp500Yield,
    treasury10Y: raw.macro.treasury10Y,
    fiveYearAvgYield:
      raw.yahoo.fiveYearAvgDividendYield != null ? raw.yahoo.fiveYearAvgDividendYield / 100 : parsePercent(f['Dividend Gr. 3/5Y']?.split(' ').at(-1)),
    dividendYieldTtm: parsePercent(f['Dividend TTM']?.match(/\(([^)]+)\)/)?.[1]) ?? raw.yahoo.dividendYield ?? null,
    fiveYearPayoutRatio: parsePercent(f['Payout']) ?? raw.yahoo.payoutRatio ?? null,
    dividend: raw.yahoo.dividendRate ?? parseNumber(f['Dividend TTM']?.split(' ')[0]),
    dividendHistoryRaising: dividendRaising(raw),
    stableRevenueGrowth: stableGrowth(annual.slice(-3).map((a) => a.totalRevenue)),
    stableEpsGrowth: stableGrowth(annual.slice(-3).map((a) => a.epsDiluted)),
    priceToFcf: parseNumber(f['P/FCF']),
    sources: {
      yahooAnalysis: `https://finance.yahoo.com/quote/${raw.ticker}/analysis?p=${raw.ticker}`,
      finvizStatistics: `https://finviz.com/quote.ashx?t=${raw.ticker}&p=d`,
      marketWatch: `https://www.marketwatch.com/investing/stock/${raw.ticker}`,
    },
  }
}

function scorePass(value: number | null, threshold: number, mode: '>=' | '<' | 'between' = '>='): number | null {
  if (value == null) return null
  if (mode === '>=') return value >= threshold ? 1 : 0
  if (mode === '<') return value < threshold ? 1 : 0
  return null
}

function yoyScore(recent: number | null, past: number | null, threshold: number): number | null {
  if (recent == null || past == null) return null
  const improved = recent > past
  const meets = recent >= threshold
  if (improved && meets) return 1
  if (improved) return 1
  return 0
}

export function computeScored(worksheet: WorksheetValues): { rows: ScoredRow[]; grandTotal: number | null; totalPossible: number; performanceRating: number | null } {
  const capB = marketCapBillions(worksheet.marketCap)
  const rows: ScoredRow[] = []

  const push = (row: ScoredRow) => rows.push(row)
  const section = (label: string) =>
    push({ id: label, label, value: null, score: null, isSectionHeader: true, section: label })

  push({
    id: 'price',
    label: 'Price',
    value: worksheet.price,
    score: null,
  })
  push({
    id: 'marketCap',
    label: 'Market Cap (In Billions) i.e. 1 Billion = 1.0',
    value: worksheet.marketCap,
    score: null,
    scoreDetail: capB != null ? capLabelFromBillions(capB).replace(' Cap', ' CAP').toUpperCase() : undefined,
  })
  push({
    id: 'revenue',
    label: 'Revenue (In Billions) i.e. 1 Billion = 1.0',
    value: worksheet.revenue,
    score: null,
  })
  push({
    id: 'salesQoq',
    label: 'Quarterly Rev Growth YOY',
    value: worksheet.salesQoq,
    score: null,
  })
  push({
    id: 'eps',
    label: 'Earnings Per Share (EPS)',
    value: worksheet.eps,
    score: null,
  })
  push({
    id: 'epsQoq',
    label: 'Quarterly Earnings Growth YOY',
    value: worksheet.epsQoq,
    score: null,
    scoreDetail:
      worksheet.salesQoq != null && worksheet.epsQoq != null
        ? worksheet.revEarningsGrowthSimilar === 'Y'
          ? 'Similar'
          : worksheet.revEarningsGrowthSimilar === 'N'
            ? 'Not Sim.'
            : ''
        : undefined,
  })

  section('Quick Fundamental Analysis Criteria')

  const qRows: Array<{ id: string; label: string; value: unknown; score: number | null; highlight?: ScoredRow['highlight'] }> = [
    {
      id: 'epsSurprises',
      label: '# of EPS Surprises in Last 4 Quarters',
      value: worksheet.epsSurpriseCount,
      score: worksheet.epsSurpriseCount != null && worksheet.epsSurpriseCount > 2 ? 1 : worksheet.epsSurpriseCount != null ? 0 : null,
      highlight: worksheet.epsSurpriseCount != null ? (worksheet.epsSurpriseCount > 2 ? 'pass' : 'fail') : 'neutral',
    },
    {
      id: 'increasingSurprises',
      label: 'Increasing EPS Surprises? (Y/N)',
      value: worksheet.increasingEpsSurprises,
      score: worksheet.increasingEpsSurprises === 'Y' ? 1 : worksheet.increasingEpsSurprises === 'N' ? 0 : null,
      highlight: worksheet.increasingEpsSurprises === 'Y' ? 'pass' : worksheet.increasingEpsSurprises === 'N' ? 'fail' : 'neutral',
    },
    {
      id: 'positiveRevisions',
      label: 'Positive EPS Revisions? (Y/N)',
      value: worksheet.positiveEpsRevisions,
      score: worksheet.positiveEpsRevisions === 'Y' ? 1 : worksheet.positiveEpsRevisions === 'N' ? 0 : null,
      highlight: worksheet.positiveEpsRevisions === 'Y' ? 'pass' : worksheet.positiveEpsRevisions === 'N' ? 'fail' : 'neutral',
    },
    {
      id: 'epsGrowthCurrentYear',
      label: "Curr Year's Year Over Year (yoy) EPS % Growth",
      value: worksheet.epsGrowthCurrentYear,
      score: scorePass(worksheet.epsGrowthCurrentYear, 0.15),
      highlight: worksheet.epsGrowthCurrentYear != null && worksheet.epsGrowthCurrentYear >= 0.15 ? 'pass' : 'fail',
    },
    {
      id: 'epsGrowthNextYear',
      label: "Next Year's Year Over Year (yoy) EPS % Growth",
      value: worksheet.epsGrowthNextYear,
      score: scorePass(worksheet.epsGrowthNextYear, 0.15),
      highlight: worksheet.epsGrowthNextYear != null && worksheet.epsGrowthNextYear >= 0.15 ? 'pass' : 'fail',
    },
    {
      id: 'epsGrowth5Y',
      label: '5-year Projected EPS Growth',
      value: worksheet.epsGrowth5YearProjected,
      score: scorePass(worksheet.epsGrowth5YearProjected, 0.15),
      highlight: worksheet.epsGrowth5YearProjected != null && worksheet.epsGrowth5YearProjected >= 0.15 ? 'pass' : 'fail',
    },
    {
      id: 'epsGrowthHistorical',
      label: '3/5-year Historical EPS Growth',
      value: worksheet.epsGrowthHistorical,
      score: null,
    },
  ]

  for (const r of qRows) {
    push({ ...r, value: r.value as string | number | null })
  }

  const qSegment = qRows.reduce((sum, r) => sum + (r.score ?? 0), 0)
  push({
    id: 'qSegment',
    label: 'Segment Score',
    value: null,
    score: qSegment || null,
    isSegmentScore: true,
  })

  section('Profitability Ratios')
  const pRows = [
    {
      id: 'gmTtm',
      label: 'Gross Margin (GM) for TTM',
      value: worksheet.grossMarginTtm,
      score: scorePass(worksheet.grossMarginTtm, 0.4),
      highlight: worksheet.grossMarginTtm != null && worksheet.grossMarginTtm >= 0.4 ? 'pass' : 'fail',
    },
    {
      id: 'omTtm',
      label: 'Operating Margin (OM) for TTM',
      value: worksheet.operatingMarginTtm,
      score: scorePass(worksheet.operatingMarginTtm, 0.15),
      highlight: worksheet.operatingMarginTtm != null && worksheet.operatingMarginTtm >= 0.15 ? 'pass' : 'fail',
    },
    {
      id: 'npmTtm',
      label: 'Net Profit Margin (NPM) for TTM',
      value: worksheet.netMarginTtm,
      score: scorePass(worksheet.netMarginTtm, 0.07),
      highlight: worksheet.netMarginTtm != null && worksheet.netMarginTtm >= 0.07 ? 'pass' : 'fail',
    },
  ] as ScoredRow[]
  rows.push(...pRows)
  push({
    id: 'pSegment',
    label: 'Segment Score',
    value: null,
    score: pRows.reduce((s, r) => s + (r.score ?? 0), 0) || null,
    isSegmentScore: true,
  })

  section('Year Over Year (yoy) Comparisons')
  const yoyRows: ScoredRow[] = [
    {
      id: 'gmPast',
      label: 'GM Past Year',
      value: worksheet.gmPastYear,
      score: yoyScore(worksheet.gmRecentYear, worksheet.gmPastYear, 0.4),
    },
    {
      id: 'gmRecent',
      label: 'GM Recent Year',
      value: worksheet.gmRecentYear,
      score: scorePass(worksheet.gmRecentYear, 0.4),
      highlight: worksheet.gmRecentYear != null && worksheet.gmRecentYear >= 0.4 ? 'pass' : 'fail',
    },
    {
      id: 'omPast',
      label: 'OM Past Year',
      value: worksheet.omPastYear,
      score: yoyScore(worksheet.omRecentYear, worksheet.omPastYear, 0.15),
    },
    {
      id: 'omRecent',
      label: 'OM Recent Year',
      value: worksheet.omRecentYear,
      score: scorePass(worksheet.omRecentYear, 0.15),
      highlight: worksheet.omRecentYear != null && worksheet.omRecentYear >= 0.15 ? 'pass' : 'fail',
    },
    {
      id: 'npmPast',
      label: 'NPM Past Year',
      value: worksheet.npmPastYear,
      score: yoyScore(worksheet.npmRecentYear, worksheet.npmPastYear, 0.07),
    },
    {
      id: 'npmRecent',
      label: 'NPM Recent Year',
      value: worksheet.npmRecentYear,
      score: scorePass(worksheet.npmRecentYear, 0.07),
      highlight: worksheet.npmRecentYear != null && worksheet.npmRecentYear >= 0.07 ? 'pass' : 'fail',
    },
  ]
  rows.push(...yoyRows)
  push({
    id: 'yoySegment',
    label: 'Segment Score',
    value: null,
    score: yoyRows.reduce((s, r) => s + (r.score ?? 0), 0) || null,
    isSegmentScore: true,
  })

  section('Management Effectiveness')
  const mRows: ScoredRow[] = [
    {
      id: 'roa',
      label: 'Return on Assets (ROA)',
      value: worksheet.roa,
      score: scorePass(worksheet.roa, 0.07),
      highlight: worksheet.roa != null && worksheet.roa >= 0.07 ? 'pass' : 'fail',
    },
    {
      id: 'roe',
      label: 'Return on Equity (ROE)',
      value: worksheet.roe,
      score: scorePass(worksheet.roe, 0.15),
      highlight: worksheet.roe != null && worksheet.roe >= 0.15 ? 'pass' : 'fail',
    },
  ]
  rows.push(...mRows)
  push({
    id: 'mSegment',
    label: 'Segment Score',
    value: null,
    score: mRows.reduce((s, r) => s + (r.score ?? 0), 0) || null,
    isSegmentScore: true,
  })

  section('Solvency Ratios')
  push({
    id: 'debtEq',
    label: 'Debt-to-Equity (D/E)',
    value: worksheet.debtToEquity,
    score:
      worksheet.debtToEquity != null && worksheet.debtToEquity > 0 && worksheet.debtToEquity < 0.5 ? 1 : worksheet.debtToEquity != null ? 0 : null,
    highlight:
      worksheet.debtToEquity != null && worksheet.debtToEquity > 0 && worksheet.debtToEquity < 0.5 ? 'pass' : 'fail',
  })
  push({
    id: 'sSegment',
    label: 'Segment Score',
    value: null,
    score:
      worksheet.debtToEquity != null && worksheet.debtToEquity > 0 && worksheet.debtToEquity < 0.5 ? 1 : worksheet.debtToEquity != null ? 0 : null,
    isSegmentScore: true,
  })

  section('Valuation Ratios')
  const vRows: ScoredRow[] = [
    {
      id: 'earningsYield',
      label: 'Earnings Yield',
      value: worksheet.earningsYield,
      score: scorePass(worksheet.earningsYield, 0.05),
      highlight: worksheet.earningsYield != null && worksheet.earningsYield >= 0.05 ? 'pass' : 'fail',
    },
    {
      id: 'trailingPe',
      label: 'Trailing Price Earnings Ratio (P/E)',
      value: worksheet.trailingPe,
      score: null,
    },
    {
      id: 'forwardPe',
      label: 'Forward Price Earnings Ratio (P/E)',
      value: worksheet.forwardPe,
      score:
        worksheet.forwardPe != null && worksheet.trailingPe != null && worksheet.forwardPe < worksheet.trailingPe ? 1 : worksheet.forwardPe != null ? 0 : null,
      highlight:
        worksheet.forwardPe != null && worksheet.trailingPe != null
          ? worksheet.forwardPe < worksheet.trailingPe
            ? 'pass'
            : 'fail'
          : 'neutral',
    },
    {
      id: 'peg',
      label: 'Price Earnings Growth Ratio (PEG)',
      value: worksheet.peg,
      score: worksheet.peg != null && worksheet.peg > 0 && worksheet.peg < 1 ? 1 : worksheet.peg != null ? 0 : null,
      highlight: worksheet.peg != null && worksheet.peg > 0 && worksheet.peg < 1 ? 'pass' : 'fail',
    },
    {
      id: 'ps',
      label: 'Price to Sales Ratio (P/S)',
      value: worksheet.priceToSales,
      score: worksheet.priceToSales != null && worksheet.priceToSales > 0 && worksheet.priceToSales < 2 ? 1 : worksheet.priceToSales != null ? 0 : null,
      highlight: worksheet.priceToSales != null && worksheet.priceToSales > 0 && worksheet.priceToSales < 2 ? 'pass' : 'fail',
    },
    {
      id: 'pb',
      label: 'Price to Book Ratio (P/B)',
      value: worksheet.priceToBook,
      score: worksheet.priceToBook != null && worksheet.priceToBook > 0 && worksheet.priceToBook < 3 ? 1 : worksheet.priceToBook != null ? 0 : null,
      highlight: worksheet.priceToBook != null && worksheet.priceToBook > 0 && worksheet.priceToBook < 3 ? 'pass' : 'fail',
    },
  ]
  rows.push(...vRows)
  push({
    id: 'vSegment',
    label: 'Segment Score',
    value: null,
    score: vRows.reduce((s, r) => s + (r.score ?? 0), 0) || null,
    isSegmentScore: true,
  })

  const segmentScores = rows.filter((r) => r.isSegmentScore).map((r) => r.score ?? 0)
  const grandTotal = segmentScores.length ? segmentScores.reduce((a, b) => a + b, 0) : null
  const totalPossible = 20

  push({
    id: 'grandTotal',
    label: 'GRAND TOTAL SCORE',
    value: null,
    score: grandTotal,
    isGrandTotal: true,
  })
  push({
    id: 'totalPossible',
    label: 'TOTAL SCORE POSSIBLE',
    value: totalPossible,
    score: null,
  })
  push({
    id: 'rating',
    label: 'COMPANY PERFORMANCE RATING',
    value: grandTotal != null ? grandTotal / totalPossible : null,
    score: null,
    highlight: grandTotal != null && grandTotal / totalPossible >= 0.7 ? 'pass' : 'info',
  })

  return {
    rows,
    grandTotal,
    totalPossible,
    performanceRating: grandTotal != null ? grandTotal / totalPossible : null,
  }
}

export function buildAnalysis(raw: RawStockData): AnalysisResult {
  const worksheet = computeWorksheet(raw)
  const scored = computeScored(worksheet)
  return {
    worksheet,
    scored: scored.rows,
    grandTotal: scored.grandTotal,
    totalPossible: scored.totalPossible,
    performanceRating: scored.performanceRating,
  }
}
