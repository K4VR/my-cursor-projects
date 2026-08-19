# Ledger

A local-first stock trading journal. Open it in a browser on any computer. You do not need npm.

**https://k4vr.github.io/my-cursor-projects/ledger/**

This is a separate app from KJV Study. Trades stay in that browser unless you export a backup.

On an open position you can **add** (scale in) or **trim** (take some off, or close the rest). Average entry and booked P&L update from those fills.

Use **All / Taxable / IRA** at the top to switch accounts. Each trade belongs to one account. Add more accounts in Settings. Starting capital is per account; All uses the sum. Archive an account instead of deleting it if it still has trades.

## Optional local run

If you have Node.js installed:

```bash
cd ledger
npm install
npm run dev
```
