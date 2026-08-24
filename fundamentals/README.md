# Fundamentals

Advanced Peer-to-Peer fundamental stock analysis. Enter a ticker to populate the worksheet and scored summary — the same criteria as the Payne's Education Advanced P2P spreadsheet.

## No npm on your computer

You do **not** need Node.js or npm installed locally. The app is built and run in the cloud.

### Recommended: Render (full app — UI + live data)

1. Sign in at [render.com](https://render.com).
2. **New → Blueprint** and connect this GitHub repo.
3. Render reads [`render.yaml`](../render.yaml) at the repo root, builds `fundamentals/` in the cloud, and gives you a URL like `https://fundamentals-xxxx.onrender.com`.
4. Bookmark that URL — enter a ticker and analyze. Nothing is stored.

Render’s free tier may sleep after inactivity; the first request after sleep can take ~30 seconds.

### GitHub Pages (UI only, unless API URL is configured)

**https://k4vr.github.io/my-cursor-projects/fundamentals/**

GitHub Actions builds the UI automatically (no local npm). Live ticker fetches need a backend:

- Deploy on Render (above), then in GitHub repo **Settings → Secrets and variables → Actions → Variables**, set `FUNDAMENTALS_API_URL` to your Render URL (no trailing slash).
- Re-run the Pages deploy workflow so the UI calls that API.

## What it does

- **Advanced P2P** — full criteria worksheet (price, margins, growth, valuation, dividends, etc.)
- **Scored P2P** — segment scores and grand total (out of 20)
- **One ticker in** — manual refresh when researching; nothing is stored

## Data sources

| Source | Used for |
|--------|----------|
| [Yahoo Finance Analysis](https://finance.yahoo.com) | Earnings history (surprises), EPS trend / revisions, annual financials |
| [Finviz Statistics](https://finviz.com) | Price, market cap, margins, valuation ratios, quarterly growth |
| Macro | S&P 500 yield (via SPY), 10-year Treasury (^TNX) |

## Optional: developers with Node installed

```bash
cd fundamentals
npm install
npm run dev    # UI at :5173, API at :3001
npm run build && npm start   # single port :3001
```

## Disclaimer

Content is for educational and informational purposes only and is not investment advice. Investing involves risk, including risk of loss.
