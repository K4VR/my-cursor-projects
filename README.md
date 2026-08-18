# my-cursor-projects

Local-first personal tools, deployed together on GitHub Pages:

**https://k4vr.github.io/my-cursor-projects/**

| App | Path |
| --- | --- |
| [KJV Study](#kjv-study) | `/` |
| [Ledger — Stock Trading Journal](#ledger--stock-trading-journal) | `/journal` |

## KJV Study

A local-first King James Version Bible study tool organized by book.

- **Library** — browse all 66 books (Old & New Testament)
- **Chapter reader** — read KJV text with previous/next navigation
- **Notes & highlights** — per-verse annotations stored in IndexedDB
- **Cross-references** — verse links from OpenBible.info / Treasury of Scripture Knowledge
- **Themes** — curated topical verse collections
- **Famous verses** — well-known passages with jump-to-context
- **My Study** — review your notes/highlights; export/import JSON backups

Live: **https://k4vr.github.io/my-cursor-projects/**

## Ledger — Stock Trading Journal

A local-first journal for stock trades: fills, risk, and review notes, with performance stats.

- **Dashboard** — realized P&L, equity curve, win rate, profit factor, expectancy, average R, max drawdown, open positions
- **Trade log** — long/short, size, entry/exit, fees, stop, target, setup, tags, grade
- **Review** — thesis, emotion, mistakes, and lessons per trade
- **Analytics** — breakdowns by symbol, setup, grade, side, and weekday
- **Backup** — export/import JSON or CSV; optional demo journal

Live: **https://k4vr.github.io/my-cursor-projects/journal**

Trades never leave this browser unless you export a backup.

## Develop

```bash
npm install
npm run download-data   # optional: refresh public KJV + cross-ref JSON
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Data attribution

- **Scripture text:** King James Version (public domain), sourced via community JSON editions.
- **Cross-references:** Derived from [OpenBible.info](https://www.openbible.info/labs/cross-references/) / Treasury of Scripture Knowledge (CC BY), via structured exports used by kjvstudy.org.

Personal notes, highlights, custom themes, and trade records never leave your browser unless you export a backup.
