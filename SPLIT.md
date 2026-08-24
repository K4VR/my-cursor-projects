# Split into three GitHub repositories

The three empty repos exist. Each app is ready on its own branch in `my-cursor-projects`.

## Finish the copy (Codespace + token)

### A. Create a token (if you do not still have one)

1. **https://github.com/settings/personal-access-tokens/new**
2. Name: `split-repos` · Expiration: 7 days · Access: **All repositories**
3. Permissions → **Contents: Read and write**
4. Generate and copy the token (do not paste it into Cursor chat)

### B. In the Codespace terminal

```bash
git fetch origin cursor/split-kjv-study-fa4e cursor/split-ledger-fa4e cursor/split-fundamentals-fa4e

export TOKEN='PASTE_TOKEN_HERE'

git push "https://x-access-token:${TOKEN}@github.com/K4VR/kjv-study.git" "refs/remotes/origin/cursor/split-kjv-study-fa4e:refs/heads/main"
git push "https://x-access-token:${TOKEN}@github.com/K4VR/ledger.git" "refs/remotes/origin/cursor/split-ledger-fa4e:refs/heads/main"
git push "https://x-access-token:${TOKEN}@github.com/K4VR/fundamentals.git" "refs/remotes/origin/cursor/split-fundamentals-fa4e:refs/heads/main"
```

Use `refs/heads/main` (not bare `main`) because the new repos are empty and Git cannot guess the branch name.

Success looks like `* [new branch] ... -> main`, not a 403 or refname error.

### C. Clean up

```bash
unset TOKEN
```

Delete the token at **https://github.com/settings/personal-access-tokens**.

Reply in Cursor: **the push finished**.

## After that

| Repo | Enable Pages | Site |
|------|--------------|------|
| https://github.com/K4VR/kjv-study | Settings → Pages → Source: **GitHub Actions** | https://k4vr.github.io/kjv-study/ |
| https://github.com/K4VR/ledger | same | https://k4vr.github.io/ledger/ |
| https://github.com/K4VR/fundamentals | same | https://k4vr.github.io/fundamentals/ |
