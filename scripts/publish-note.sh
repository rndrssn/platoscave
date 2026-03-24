#!/usr/bin/env bash
set -euo pipefail

# Publish note workflow from sandbox:
# 1) Build notes
# 2) Run tests (full suite by default, quick subset optional)
# 3) Commit generated notes artifacts
# 4) Push sandbox and merge into develop + main
#
# Usage:
#   scripts/publish-note.sh -m "Publish note: <slug>"
#   scripts/publish-note.sh -m "Publish note: <slug>" --quick
#   scripts/publish-note.sh -m "Publish note: <slug>" --polish <slug-or-path>

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MSG=""
QUICK_MODE="false"
POLISH_TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      COMMIT_MSG="${2:-}"
      shift 2
      ;;
    --quick)
      QUICK_MODE="true"
      shift
      ;;
    --polish)
      POLISH_TARGET="${2:-}"
      if [[ -z "$POLISH_TARGET" ]]; then
        echo "--polish requires a target: slug or file path." >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      sed -n '1,40p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$COMMIT_MSG" ]]; then
  echo "Commit message is required. Use -m \"Publish note: <slug>\"." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "sandbox" ]]; then
  echo "This script must be run from branch 'sandbox'. Current branch: $CURRENT_BRANCH" >&2
  exit 1
fi

if [[ -n "$POLISH_TARGET" ]]; then
  echo "==> Polishing note spelling/punctuation"
  if [[ -f "$POLISH_TARGET" ]]; then
    node scripts/polish-note.js --file "$POLISH_TARGET"
  elif [[ -f "content/notes/published/$POLISH_TARGET.md" ]]; then
    node scripts/polish-note.js --file "content/notes/published/$POLISH_TARGET.md"
  else
    node scripts/polish-note.js --slug "$POLISH_TARGET"
  fi
fi

echo "==> Building notes"
node scripts/build-notes.js

if [[ "$QUICK_MODE" == "true" ]]; then
  echo "==> Running quick checks"
  node tests/test-notes-build-contract.js
  node tests/test-notes-build-negative.js
  node tests/test-navigation-links.js
else
  echo "==> Running full test suite"
  node tests/run-all.js
fi

echo "==> Staging note publish artifacts"
git add content/notes/published notes tags data

if git diff --cached --quiet; then
  echo "No staged changes to commit for note publish." >&2
  exit 1
fi

echo "==> Committing"
git commit -m "$COMMIT_MSG"

echo "==> Pushing sandbox"
git push origin sandbox

echo "==> Merging sandbox -> develop"
git checkout develop
git merge --no-ff sandbox -m "Merge branch 'sandbox' into develop"
git push origin develop

echo "==> Merging sandbox -> main"
git checkout main
git merge --no-ff sandbox -m "Merge branch 'sandbox' into main"
git push origin main

echo "==> Returning to sandbox"
git checkout sandbox

echo "==> Done"
echo "sandbox: $(git rev-parse sandbox)"
echo "develop: $(git rev-parse develop)"
echo "main:    $(git rev-parse main)"
echo "tree:    $(git rev-parse sandbox^{tree})"
