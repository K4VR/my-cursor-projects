# Split into three GitHub repositories

The three empty repos exist. Each app is already prepared as its own branch in `my-cursor-projects`.

## Why Cursor could not copy the files

**Cursor → GitHub → All repositories** is the correct setting. Keep it that way.

A Cloud Agent still only gets a GitHub token for **the repo it was started on**. This agent was started on `my-cursor-projects`, so GitHub rejects writes to `kjv-study`, `ledger`, and `fundamentals` (`cursor[bot]` permission denied). That is a GitHub limit, not a mistake on your access screen.

Finish the copy in the browser with **GitHub Codespaces** (no npm, no install on your computer). Codespaces logs in as **you**, so the push is allowed.

## Finish the copy (about 2 minutes)

1. Open **https://github.com/K4VR/my-cursor-projects**
2. Click the green **Code** button
3. Open the **Codespaces** tab
4. Click **Create codespace on main**  
   (If it asks for a branch, `cursor/split-into-repos-fa4e` is also fine.)
5. Wait until the browser VS Code finishes loading (often 30–60 seconds)
6. Click **Terminal → New Terminal** (or `` Ctrl+` ``)
7. Paste this and press Enter:

```bash
bash scripts/push-split-repos.sh
```

If `scripts/push-split-repos.sh` is missing in that codespace, paste this instead:

```bash
git fetch origin cursor/split-kjv-study-fa4e cursor/split-ledger-fa4e cursor/split-fundamentals-fa4e
git push https://github.com/K4VR/kjv-study.git origin/cursor/split-kjv-study-fa4e:main
git push https://github.com/K4VR/ledger.git origin/cursor/split-ledger-fa4e:main
git push https://github.com/K4VR/fundamentals.git origin/cursor/split-fundamentals-fa4e:main
```

8. You should see three successful pushes. You can delete the codespace afterward (**Code → Codespaces → ⋯ → Delete**).

Then reply in Cursor: **the push finished**.

## After that

| Repo | Site (enable Pages: Settings → Pages → Source: GitHub Actions) |
|------|----------------------------------------------------------------|
| https://github.com/K4VR/kjv-study | https://k4vr.github.io/kjv-study/ |
| https://github.com/K4VR/ledger | https://k4vr.github.io/ledger/ |
| https://github.com/K4VR/fundamentals | https://k4vr.github.io/fundamentals/ |

Ready-to-copy branches (do **not** merge these into `main` of `my-cursor-projects`):

- `cursor/split-kjv-study-fa4e`
- `cursor/split-ledger-fa4e`
- `cursor/split-fundamentals-fa4e`
