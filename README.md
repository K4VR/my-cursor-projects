# Jack's projects

These apps now each live in their **own** GitHub repository.

| App | Repository | Site |
|-----|------------|------|
| **KJV Study** | [K4VR/kjv-study](https://github.com/K4VR/kjv-study) | https://k4vr.github.io/kjv-study/ |
| **Ledger** | [K4VR/ledger](https://github.com/K4VR/ledger) | https://k4vr.github.io/ledger/ |
| **Fundamentals** | [K4VR/fundamentals](https://github.com/K4VR/fundamentals) | https://k4vr.github.io/fundamentals/ |

This repository (`my-cursor-projects`) is **legacy**. It still has the old combined copy of the three apps. Prefer the repos above for any new work.

## Enable GitHub Pages on each new repo

For **kjv-study**, **ledger**, and **fundamentals**:

1. Open the repo on GitHub
2. **Settings → Pages**
3. Under **Build and deployment → Source**, choose **GitHub Actions**
4. Open the **Actions** tab → if a failed “Deploy GitHub Pages” run appears, open it and **Re-run jobs**

Sites may take a minute after the first successful workflow.

## Fundamentals live data

GitHub Pages hosts the Fundamentals UI. For ticker fetching, connect this repo to Render using its `render.yaml` (see that repo’s README). Optional: set Actions variable `FUNDAMENTALS_API_URL` on the Fundamentals repo to your Render URL.

## Cleanup (optional)

- Delete the `split-repos` Personal Access Token if you still have it: https://github.com/settings/personal-access-tokens
- Delete any Codespace for `my-cursor-projects` when you are done
- Later, **Settings → General → Danger zone → Archive this repository** so `my-cursor-projects` becomes read-only history
