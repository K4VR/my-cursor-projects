# Split into three GitHub repositories

The three empty repos exist. Each app is ready on its own branch in `my-cursor-projects`.

## Why the Codespaces push failed

You saw:

```text
Permission to K4VR/kjv-study.git denied to K4VR.
```

That is **not** a Cursor setting problem. A Codespace on `my-cursor-projects` gets a GitHub login that can only write to **that** repo. Pushing to `kjv-study`, `ledger`, or `fundamentals` is rejected even though you own them.

Fix: give the Codespace a **Personal Access Token** that can write to all your repos (one-time, about 2 minutes).

## Finish the copy (Codespace + token)

### A. Create a token

1. Open **https://github.com/settings/tokens?type=beta**  
   (Or: GitHub profile picture → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**)
2. **Token name:** `split-repos`
3. **Expiration:** 7 days (short is fine; you can delete it afterward)
4. **Repository access:** **All repositories**
5. Under **Permissions** → **Repository permissions**:
   - **Contents:** Read and write
   - **Metadata:** Read-only (usually already set)
6. Click **Generate token**
7. **Copy the token** and keep the tab open until the pushes succeed  
   (GitHub will not show it again. Do not paste it into Cursor chat.)

### B. Open the Codespace again

1. **https://github.com/K4VR/my-cursor-projects**
2. **Code → Codespaces** → open your existing codespace (or create one)

### C. Push with the token

In the Codespace terminal, paste **one line at a time**. When it asks for a password, paste the **token** (not your GitHub password).

First, fetch the branches:

```bash
git fetch origin cursor/split-kjv-study-fa4e cursor/split-ledger-fa4e cursor/split-fundamentals-fa4e
```

Then push (GitHub will ask for username and password):

```bash
git push https://github.com/K4VR/kjv-study.git origin/cursor/split-kjv-study-fa4e:main
```

- **Username:** `K4VR`
- **Password:** paste the token

Repeat for the other two:

```bash
git push https://github.com/K4VR/ledger.git origin/cursor/split-ledger-fa4e:main
```

```bash
git push https://github.com/K4VR/fundamentals.git origin/cursor/split-fundamentals-fa4e:main
```

You should see `main -> main` (or “new branch”) for each — not a 403.

### D. Clean up

1. Delete the token: **https://github.com/settings/tokens** → find `split-repos` → **Delete**
2. You can delete the Codespace when you are done
3. Reply in Cursor: **the push finished**

## After that

| Repo | Enable Pages | Site |
|------|--------------|------|
| https://github.com/K4VR/kjv-study | Settings → Pages → Source: **GitHub Actions** | https://k4vr.github.io/kjv-study/ |
| https://github.com/K4VR/ledger | same | https://k4vr.github.io/ledger/ |
| https://github.com/K4VR/fundamentals | same | https://k4vr.github.io/fundamentals/ |

Ready-to-copy branches (do **not** merge these into `main` of `my-cursor-projects`):

- `cursor/split-kjv-study-fa4e`
- `cursor/split-ledger-fa4e`
- `cursor/split-fundamentals-fa4e`
