# Split into three GitHub repositories

The three empty repos exist. Each app is ready on its own branch in `my-cursor-projects`.

## Why you were not asked for a username / token

Codespaces already logs Git in automatically with a **limited** token that only works for `my-cursor-projects`. Git uses that token right away and never prompts — then GitHub returns:

```text
Permission to K4VR/kjv-study.git denied to K4VR.
```

You are not doing anything wrong. Put your Personal Access Token **in the push command** so Git uses that instead of the limited Codespace login.

## Finish the copy

### A. Create a token

1. Open **https://github.com/settings/personal-access-tokens/new**
2. **Token name:** `split-repos`
3. **Expiration:** 7 days
4. **Repository access:** **All repositories**
5. **Permissions → Repository permissions → Contents:** **Read and write**
6. **Generate token** → **copy** it  
   Do **not** paste the token into Cursor chat.

### B. In the Codespace terminal

Fetch once:

```bash
git fetch origin cursor/split-kjv-study-fa4e cursor/split-ledger-fa4e cursor/split-fundamentals-fa4e
```

Then set your token (paste it in place of `PASTE_TOKEN_HERE` — no spaces):

```bash
export TOKEN='PASTE_TOKEN_HERE'
```

Push all three (no username prompt — the token is in the URL):

```bash
git push "https://x-access-token:${TOKEN}@github.com/K4VR/kjv-study.git" origin/cursor/split-kjv-study-fa4e:main
git push "https://x-access-token:${TOKEN}@github.com/K4VR/ledger.git" origin/cursor/split-ledger-fa4e:main
git push "https://x-access-token:${TOKEN}@github.com/K4VR/fundamentals.git" origin/cursor/split-fundamentals-fa4e:main
```

Success looks like `main -> main` or “created branch main”, not a 403.

### C. Clean up

```bash
unset TOKEN
```

Then delete the token at **https://github.com/settings/personal-access-tokens** → find `split-repos` → **Delete**.

Reply in Cursor: **the push finished**.

## After that

| Repo | Enable Pages | Site |
|------|--------------|------|
| https://github.com/K4VR/kjv-study | Settings → Pages → Source: **GitHub Actions** | https://k4vr.github.io/kjv-study/ |
| https://github.com/K4VR/ledger | same | https://k4vr.github.io/ledger/ |
| https://github.com/K4VR/fundamentals | same | https://k4vr.github.io/fundamentals/ |
