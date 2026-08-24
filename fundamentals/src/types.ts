export type YesNo = 'Y' | 'N' | 'y' | 'n' | 'N/A' | ''

export type CapLabel =
  | 'Micro Cap'
  | 'Small Cap'
  | 'Mid Cap'
  | 'Large Cap'
  | 'Mega Cap'
  | ''

export type MarginYoY = number | 'Improved' | 'Decreased' | ''

export interface AnnualFinancials {
  fiscalYearEnd: string
  grossMargin: number | null
  operatingMargin: number | null
  netMargin: number | null
  totalRevenue: number | null
  epsDiluted: number | null
}

export interface RawStockData {
  ticker: string
  companyName?: string
  fetchedAt: string
  finviz: Record<string, string>
  yahoo: {
    earningsHistory: Array<{
      epsActual?: number
      epsEstimate?: number
      surprisePercent?: number
      quarter?: Date
    }>
    earningsTrend: Array<{
      period?: string
      growth?: number
      earningsEstimate?: {
        avg?: number
        growth?: number
      }
    }>
    fiveYearAvgDividendYield?: number
    dividendRate?: number
    dividendYield?: number
    payoutRatio?: number
    dividendHistory: Array<{ amount: number; date: Date }>
  }
  annualFinancials: AnnualFinancials[]
  macro: {
    sp500Yield: number | null
    treasury10Y: number | null
  }
}

export interface WorksheetValues {
  ticker: string
  companyName?: string
  fetchedAt: string

  price: string
  marketCap: string
  capLabel: CapLabel
  revenue: string
  eps: string
  salesQoq: number | null
  epsQoq: number | null
  revEarningsGrowthSimilar: YesNo

  epsSurpriseCount: number | null
  increasingEpsSurprises: YesNo
  increasingSurprisesDetail: string
  positiveEpsRevisions: YesNo
  revisionChange: number | null
  epsGrowthCurrentYear: number | null
  epsGrowthNextYear: number | null
  epsGrowth5YearProjected: number | null
  epsGrowthHistorical: number | null

  grossMarginTtm: number | null
  operatingMarginTtm: number | null
  netMarginTtm: number | null
  fiscalYearEnds: string
  yoyComparisonTtm: string
  yoyComparisonYears: string

  gmPastYear: number | null
  gmRecentYear: number | null
  gmYoyChange: MarginYoY
  omPastYear: number | null
  omRecentYear: number | null
  omYoyChange: MarginYoY
  npmPastYear: number | null
  npmRecentYear: number | null
  npmYoyChange: MarginYoY

  roa: number | null
  roe: number | null
  debtToEquity: number | null

  earningsYield: number | null
  trailingPe: number | null
  forwardPe: number | null
  peg: number | null
  priceToSales: number | null
  priceToBook: number | null

  sp500Yield: number | null
  treasury10Y: number | null
  fiveYearAvgYield: number | null
  dividendYieldTtm: number | null
  fiveYearPayoutRatio: number | null
  dividend: number | null
  dividendHistoryRaising: YesNo
  stableRevenueGrowth: YesNo
  stableEpsGrowth: YesNo
  priceToFcf: number | null

  sources: {
    yahooAnalysis: string
    finvizStatistics: string
    marketWatch: string
  }
}

export type ScoreHighlight = 'pass' | 'fail' | 'neutral' | 'info'

export interface ScoredRow {
  id: string
  label: string
  value: string | number | null
  score: number | null
  scoreDetail?: string
  highlight?: ScoreHighlight
  section?: string
  isSectionHeader?: boolean
  isSegmentScore?: boolean
  isGrandTotal?: boolean
}

export interface AnalysisResult {
  worksheet: WorksheetValues
  scored: ScoredRow[]
  grandTotal: number | null
  totalPossible: number
  performanceRating: number | null
}
