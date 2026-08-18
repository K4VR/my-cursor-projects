import { useMemo, useState } from 'react'
import type { EquityPoint } from '../lib/stats'
import { formatDate, formatMoney, formatSignedMoney } from '../lib/money'

export function EquityChart({ points, startingCapital }: { points: EquityPoint[]; startingCapital: number }) {
  const [hover, setHover] = useState<number | null>(null)

  const chart = useMemo(() => {
    const width = 800
    const height = 240
    const pad = { top: 18, right: 16, bottom: 28, left: 16 }
    const innerW = width - pad.left - pad.right
    const innerH = height - pad.top - pad.bottom
    const values = [startingCapital, ...points.map((p) => p.equity)]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const xs = points.map((_, i) => pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW))
    const y = (value: number) => pad.top + innerH - ((value - min) / span) * innerH
    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${y(p.equity).toFixed(1)}`)
      .join(' ')
    const area = points.length
      ? `${line} L ${xs[xs.length - 1].toFixed(1)} ${pad.top + innerH} L ${xs[0].toFixed(1)} ${pad.top + innerH} Z`
      : ''
    const baseline = y(startingCapital)
    return { width, height, pad, xs, y, line, area, baseline, min, max }
  }, [points, startingCapital])

  if (points.length === 0) {
    return <div className="equity-empty">Close a trade to start the equity curve.</div>
  }

  const active = hover != null ? points[hover] : points[points.length - 1]

  return (
    <div>
      <svg
        className="equity-svg"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        role="img"
        aria-label="Equity curve"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={active.equity >= startingCapital ? '#3ee09a' : '#ff6d7b'} stopOpacity="0.32" />
            <stop offset="100%" stopColor={active.equity >= startingCapital ? '#3ee09a' : '#ff6d7b'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={chart.pad.left}
          x2={chart.width - chart.pad.right}
          y1={chart.baseline}
          y2={chart.baseline}
          stroke="rgba(148,174,201,0.25)"
          strokeDasharray="4 4"
        />
        <path d={chart.area} fill="url(#equityFill)" />
        <path d={chart.line} fill="none" stroke={active.equity >= startingCapital ? '#3ee09a' : '#ff6d7b'} strokeWidth="2.4" />
        {chart.xs.map((x, i) => (
          <rect
            key={points[i].tradeId}
            x={x - 10}
            y={0}
            width={20}
            height={chart.height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {active ? (
          <circle
            cx={chart.xs[hover ?? points.length - 1]}
            cy={chart.y(active.equity)}
            r="4.5"
            fill="#e8eef6"
          />
        ) : null}
      </svg>
      {active ? (
        <p className="equity-tip">
          {formatDate(active.date)} · {active.symbol} {formatSignedMoney(active.pnl)} · equity{' '}
          {formatMoney(active.equity)}
        </p>
      ) : null}
    </div>
  )
}
