#!/usr/bin/env bash
set -euo pipefail

# Spins up a short-lived feature branch off the latest main. Not required
# for every change — routine, low-risk work commits directly to main via
# scripts/ship.sh. Use this only when a change warrants isolation (larger,
# multi-commit, experimental, or explicitly requested).
#
# Usage: scripts/start-feature.sh <slug>

SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "Usage: scripts/start-feature.sh <slug>" >&2
  exit 1
fi

BRANCH="feature/$SLUG"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Switch to main first (currently on '$CURRENT_BRANCH')." >&2
  exit 1
fi

git pull --ff-only origin main
git checkout -b "$BRANCH"

echo "==> On $BRANCH, branched from up-to-date main."
