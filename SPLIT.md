# Split into three GitHub repositories

You do **not** need npm or git on your computer. This is all done in the GitHub website.

Cursor cannot create new GitHub repositories (the login it uses is only allowed to work inside `my-cursor-projects`). You create three empty repos; then reply in Cursor and the code will be copied over.

## Step 1 — Create `kjv-study`

1. Open **https://github.com/new** (sign in as **K4VR** if asked).
2. **Repository name:** `kjv-study`  
   Type it exactly, lowercase, with the hyphen.
3. **Description (optional):** `KJV Bible study tool`
4. Choose **Public**.
5. Leave these **unchecked** (important):
   - Add a README file
   - Add .gitignore
   - Choose a license
6. Click **Create repository**.

You should land on an empty repo page that says something like “set up Git”. You can leave that page.

## Step 2 — Create `ledger`

Same as Step 1, but:

- Open **https://github.com/new** again
- **Repository name:** `ledger`
- **Description (optional):** `Local-first stock trading journal`
- **Public**, no README / gitignore / license
- **Create repository**

## Step 3 — Create `fundamentals`

Same again:

- **https://github.com/new**
- **Repository name:** `fundamentals`
- **Description (optional):** `Advanced P2P fundamental stock analysis`
- **Public**, no README / gitignore / license
- **Create repository**

## Step 4 — Let Cursor use the new repos

Cursor’s GitHub app must be allowed to see the new repositories.

1. Open **https://github.com/settings/installations**
2. Find **Cursor** (or **Cursor Agent**) and click **Configure**
3. Under **Repository access**:
   - **All repositories** is simplest, or
   - **Only select repositories** and add `kjv-study`, `ledger`, `fundamentals`, and `my-cursor-projects`
4. Save

## Step 5 — Reply here

Send a message like:

> The three repos are created: kjv-study, ledger, and fundamentals.

Then Cursor will push each app into its own repo, set up GitHub Pages on each, and turn `my-cursor-projects` into a short directory of links.

## What already exists (you can ignore this)

Ready-to-copy branches are already in `my-cursor-projects` (each branch is one app only):

- `cursor/split-kjv-study-fa4e`
- `cursor/split-ledger-fa4e`
- `cursor/split-fundamentals-fa4e`

Do not merge those branches into `main` of this repo — they would replace everything with a single app.

## After the split

| Repo | Pages URL | Notes |
|------|-----------|--------|
| `kjv-study` | https://k4vr.github.io/kjv-study/ | Settings → Pages → Source: GitHub Actions |
| `ledger` | https://k4vr.github.io/ledger/ | Same Pages setting |
| `fundamentals` | https://k4vr.github.io/fundamentals/ | UI only on Pages; live ticker data still uses Render on **this** repo |

You can archive `my-cursor-projects` later so it is read-only history. Nothing is deleted until you say so.
