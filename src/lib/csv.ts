import { GRADES, DEFAULT_TAXABLE_ID, newAccountId, newTradeId, type Account, type Grade, type Side, type Trade } from '../types'
import { positionState } from './position'
import { realizedPnl } from './stats'

const HEADERS = [
  'account',
  'symbol',
  'side',
  'quantity',
  'remaining',
  'entryPrice',
  'entryDate',
  'exitPrice',
  'exitDate',
  'fees',
  'stopLoss',
  'takeProfit',
  'setup',
  'tags',
  'grade',
  'thesis',
  'emotion',
  'mistakes',
  'lessons',
  'pnl',
] as const

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function cell(value: string | number | null | undefined): string {
  if (value == null) return ''
  return escapeCell(String(value))
}

export function tradesToCsv(trades: Trade[], accounts: Account[] = []): string {
  const lines = [HEADERS.join(',')]
  const nameOf = (id: string) => accounts.find((account) => account.id === id)?.name ?? ''
  for (const trade of trades) {
    const pnl = realizedPnl(trade)
    const state = positionState(trade)
    lines.push(
      [
        cell(nameOf(trade.accountId)),
        cell(trade.symbol),
        cell(trade.side),
        cell(state.added),
        cell(state.remaining),
        cell(trade.entryPrice),
        cell(trade.entryDate),
        cell(trade.exitPrice),
        cell(trade.exitDate),
        cell(trade.fees),
        cell(trade.stopLoss),
        cell(trade.takeProfit),
        cell(trade.setup),
        cell(trade.tags.join('|')),
        cell(trade.grade),
        cell(trade.thesis),
        cell(trade.emotion),
        cell(trade.mistakes),
        cell(trade.lessons),
        cell(pnl),
      ].join(','),
    )
  }
  return lines.join('\n')
}

function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cellValue = ''
  let quoted = false

  const pushCell = () => {
    row.push(cellValue)
    cellValue = ''
  }
  const pushRow = () => {
    if (row.length === 1 && row[0] === '' && rows.length === 0) {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cellValue += '"'
        i += 1
      } else if (ch === '"') {
        quoted = false
      } else {
        cellValue += ch
      }
      continue
    }
    if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      pushCell()
    } else if (ch === '\n') {
      pushCell()
      pushRow()
    } else if (ch !== '\r') {
      cellValue += ch
    }
  }
  if (cellValue !== '' || row.length > 0) {
    pushCell()
    pushRow()
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function num(value: string | undefined): number {
  if (!value?.trim()) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function optNum(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function optStr(value: string | undefined): string | null {
  const t = value?.trim()
  return t ? t : null
}

export function csvToTrades(
  text: string,
  accounts: Account[],
): { trades: Trade[]; newAccounts: Account[] } {
  const rows = parseRows(text)
  if (rows.length === 0) return { trades: [], newAccounts: [] }
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idx = (name: string) => header.indexOf(name.toLowerCase())
  const now = Date.now()
  const known = [...accounts]
  const newAccounts: Account[] = []

  function resolveAccount(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) {
      return known.find((account) => account.id === DEFAULT_TAXABLE_ID)?.id ?? known[0]?.id ?? DEFAULT_TAXABLE_ID
    }
    const match = known.find((account) => account.name.toLowerCase() === trimmed.toLowerCase())
    if (match) return match.id
    const created: Account = {
      id: newAccountId(),
      name: trimmed,
      broker: '',
      startingCapital: 0,
      archived: false,
      createdAt: Date.now(),
    }
    known.push(created)
    newAccounts.push(created)
    return created.id
  }

  const trades = rows.slice(1).map((row, i) => {
    const get = (name: string) => {
      const at = idx(name)
      return at >= 0 ? row[at] : ''
    }
    const sideRaw = (get('side') || 'long').toLowerCase()
    const side: Side = sideRaw === 'short' ? 'short' : 'long'
    const gradeRaw = (get('grade') || '').trim() as Grade
    const grade = GRADES.includes(gradeRaw) ? gradeRaw : null
    const tags = (get('tags') || '')
      .split(/[|,]/)
      .map((t) => t.trim())
      .filter(Boolean)

    return {
      id: newTradeId(),
      accountId: resolveAccount(get('account')),
      symbol: (get('symbol') || 'UNKNOWN').trim().toUpperCase(),
      side,
      quantity: num(get('quantity')),
      entryPrice: num(get('entryprice') || get('entry_price')),
      entryDate: (get('entrydate') || get('entry_date') || new Date().toISOString().slice(0, 10)).slice(0, 10),
      exitPrice: optNum(get('exitprice') || get('exit_price')),
      exitDate: optStr(get('exitdate') || get('exit_date'))?.slice(0, 10) ?? null,
      fees: num(get('fees')),
      stopLoss: optNum(get('stoploss') || get('stop_loss')),
      takeProfit: optNum(get('takeprofit') || get('take_profit')),
      setup: (get('setup') || '').trim(),
      tags,
      grade,
      thesis: get('thesis') || '',
      emotion: get('emotion') || '',
      mistakes: get('mistakes') || '',
      lessons: get('lessons') || '',
      fills: [],
      createdAt: now + i,
      updatedAt: now + i,
    }
  })

  return { trades, newAccounts }
}
