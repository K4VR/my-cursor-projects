#!/bin/bash
# Optional helper. Prefer the step-by-step in SPLIT.md if this fails.
# Usage (in Codespace): TOKEN=ghp_xxx bash scripts/push-split-repos.sh
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
git fetch origin cursor/split-kjv-study-fa4e cursor/split-ledger-fa4e cursor/split-fundamentals-fa4e

if [[ -z "${TOKEN:-}" ]]; then
  echo "Set TOKEN to a Personal Access Token with Contents: Read and write on all repos."
  echo "Example: TOKEN=github_pat_xxx bash scripts/push-split-repos.sh"
  echo "See SPLIT.md — do not paste the token into Cursor chat."
  exit 1
fi

git push "https://x-access-token:${TOKEN}@github.com/K4VR/kjv-study.git" "origin/cursor/split-kjv-study-fa4e:main"
git push "https://x-access-token:${TOKEN}@github.com/K4VR/ledger.git" "origin/cursor/split-ledger-fa4e:main"
git push "https://x-access-token:${TOKEN}@github.com/K4VR/fundamentals.git" "origin/cursor/split-fundamentals-fa4e:main"

echo "Done. Each app is now on main of its own repository."
echo "Delete the token at https://github.com/settings/tokens when finished."
