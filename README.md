# KJV Study

A local-first King James Version Bible study tool organized by book.

## Features

- **Library** — browse all 66 books (Old & New Testament)
- **Chapter reader** — read KJV text with previous/next navigation
- **Notes & highlights** — per-verse annotations stored in IndexedDB
- **Cross-references** — verse links from OpenBible.info / Treasury of Scripture Knowledge
- **Themes** — curated topical verse collections
- **Famous verses** — well-known passages with jump-to-context
- **My Study** — review your notes/highlights; export/import JSON backups

## Live site (GitHub Pages)

After Pages is enabled on the repo (Settings → Pages → Source: **GitHub Actions**), the app is at:

**https://k4vr.github.io/my-cursor-projects/**

## Develop

```bash
npm install
npm run download-data   # optional: refresh public KJV + cross-ref JSON
npm run dev
```

### Other apps in this repo

- **Ledger** — stock trading journal at [`ledger/`](ledger/) → [/ledger/](https://k4vr.github.io/my-cursor-projects/ledger/)
- **Fundamentals** — Advanced P2P fundamental analysis at [`fundamentals/`](fundamentals/) → [/fundamentals/](https://k4vr.github.io/my-cursor-projects/fundamentals/) (live data requires `npm run dev` locally)

## Build

```bash
npm run build
npm run preview
```

## Data attribution

- **Scripture text:** King James Version (public domain), sourced via community JSON editions.
- **Cross-references:** Derived from [OpenBible.info](https://www.openbible.info/labs/cross-references/) / Treasury of Scripture Knowledge (CC BY), via structured exports used by kjvstudy.org.

Personal notes, highlights, and custom themes never leave your browser unless you export a backup.
