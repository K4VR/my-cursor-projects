import { useState, type FormEvent } from 'react'

export function TickerBar({
  ticker,
  loading,
  onAnalyze,
}: {
  ticker: string
  loading: boolean
  onAnalyze: (symbol: string) => void
}) {
  const [input, setInput] = useState(ticker)

  function submit(e: FormEvent) {
    e.preventDefault()
    onAnalyze(input)
  }

  return (
    <form className="ticker-bar" onSubmit={submit}>
      <label htmlFor="ticker-input">Stock ticker</label>
      <input
        id="ticker-input"
        name="ticker"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        placeholder="AAPL"
        autoComplete="off"
        spellCheck={false}
        maxLength={12}
      />
      <button type="submit" disabled={loading || !input.trim()}>
        {loading ? 'Fetching…' : ticker ? 'Refresh' : 'Analyze'}
      </button>
    </form>
  )
}
