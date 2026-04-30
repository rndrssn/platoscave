#!/usr/bin/env bash
set -euo pipefail

MSG="${1:-Update all changes}"

git checkout sandbox
git pull --ff-only origin sandbox

echo "==> Running tests..."
node tests/run-all.js

git add -A

if git diff --cached --quiet; then
  echo "==> Nothing to commit, skipping commit step."
else
  git commit -m "$MSG"
  git push origin sandbox
fi

git checkout develop
git pull --ff-only origin develop
git merge --no-ff sandbox -m "Merge branch 'sandbox' into develop"
git push origin develop

git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "Merge branch 'develop' into main"
git push origin main

git checkout sandbox
