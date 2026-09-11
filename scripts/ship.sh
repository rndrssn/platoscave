#!/usr/bin/env bash
set -euo pipefail

# Adaptive commit/promote script for the main + on-demand feature-branch
# workflow. Behavior depends on the current branch:
#
#   On main:            test, commit any staged changes, push main. Done.
#   On feature/<slug>:  test, commit any staged changes, push the branch,
#                        merge --no-ff into main, push main, delete the
#                        branch (local + remote), land back on main.
#
# Usage: scripts/ship.sh ["commit message"]
# A message is required only when there are staged changes to commit — this
# script never falls back to a generic message (a past session learned the
# hard way that a silent default like "Update all changes" is a bad idea).

MSG="${1:-}"

echo "==> Restoring API key placeholders (strips any local dev injection)..."
bash scripts/dev-satellite.sh restore

echo "==> Running tests..."
node tests/run-all.js

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

git add -A
if git diff --cached --quiet; then
  echo "==> Nothing to commit, skipping commit step."
else
  if [[ -z "$MSG" ]]; then
    echo "Staged changes exist but no commit message was given." >&2
    echo "Usage: scripts/ship.sh \"commit message\"" >&2
    exit 1
  fi
  git commit -m "$MSG"
fi

if [[ "$CURRENT_BRANCH" == "main" ]]; then
  git push origin main
  echo "==> Done — main: $(git rev-parse main)"
  exit 0
fi

if [[ "$CURRENT_BRANCH" != feature/* ]]; then
  echo "Current branch '$CURRENT_BRANCH' is neither 'main' nor 'feature/*'." >&2
  echo "This script only knows how to ship those two shapes." >&2
  exit 1
fi

echo "==> Pushing $CURRENT_BRANCH"
git push origin "$CURRENT_BRANCH"

echo "==> Merging $CURRENT_BRANCH into main"
git checkout main
git pull --ff-only origin main
git merge --no-ff "$CURRENT_BRANCH" -m "Merge branch '$CURRENT_BRANCH' into main"
git push origin main

echo "==> Deleting $CURRENT_BRANCH (local + remote)"
git branch -d "$CURRENT_BRANCH"
git push origin --delete "$CURRENT_BRANCH"

echo "==> Done — main: $(git rev-parse main)"
