# Fundamentals

Advanced Peer-to-Peer fundamental stock analysis. Enter a ticker to populate the worksheet and scored summary — the same criteria as the Payne's Education Advanced P2P spreadsheet.

**Live UI (GitHub Pages):** https://k4vr.github.io/my-cursor-projects/fundamentals/

Data fetching requires the local API server (see below). The hosted page shows the interface; run locally to pull live figures from Yahoo Finance and Finviz.

## What it does

- **Advanced P2P** — full criteria worksheet (price, margins, growth, valuation, dividends, etc.)
- **Scored P2P** — segment scores and grand total (out of 20)
- **One ticker in** — manual refresh when researching; nothing is stored

## Data sources

Matches the spreadsheet instructions:

| Source | Used for |
|--------|----------|
| [Yahoo Finance Analysis](https://finance.yahoo.com) | Earnings history (surprises), EPS trend / revisions, annual financials |
| [Finviz Statistics](https://finviz.com) | Price, market cap, margins, valuation ratios, quarterly growth |
| Macro | S&P 500 yield (via SPY), 10-year Treasury (^TNX) |

## Run locally

```bash
cd fundamentals
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the Express server on port 3001.

Production-style (built UI + API on one port):

```bash
npm run build
npm start
```

Open http://localhost:3001

## Disclaimer

Content is for educational and informational purposes only and is not investment advice. Investing involves risk, including risk of loss.
