#!/bin/bash
# Push the three standalone app branches into K4VR/kjv-study, ledger, and fundamentals.
# Run this from a GitHub Codespace on my-cursor-projects (uses YOUR GitHub login, not Cursor's).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
git fetch origin cursor/split-kjv-study-fa4e cursor/split-ledger-fa4e cursor/split-fundamentals-fa4e

git push "https://github.com/K4VR/kjv-study.git" "origin/cursor/split-kjv-study-fa4e:main"
git push "https://github.com/K4VR/ledger.git" "origin/cursor/split-ledger-fa4e:main"
git push "https://github.com/K4VR/fundamentals.git" "origin/cursor/split-fundamentals-fa4e:main"

echo "Done. Each app is now on main of its own repository."
