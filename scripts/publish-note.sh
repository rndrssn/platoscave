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
#   scripts/publish-note.sh -m "Publish note: <slug>" --only <slug>
#   scripts/publish-note.sh -m "Publish notes" --only <slug-a>,<slug-b>

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MSG=""
QUICK_MODE="false"
POLISH_TARGET=""
ONLY_SPECS=()

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E "s/&/ and /g; s/[^a-z0-9[:space:]-]//g; s/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/-/g; s/-+/-/g"
}

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
    --only)
      if [[ -z "${2:-}" ]]; then
        echo "--only requires a slug (or comma-separated slug list)." >&2
        exit 1
      fi
      ONLY_SPECS+=("$2")
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

if [[ ${#ONLY_SPECS[@]} -gt 0 ]]; then
  echo "==> Enforcing --only note source guard"
  ALLOWED_NOTE_FILES=""

  for spec in "${ONLY_SPECS[@]}"; do
    IFS=',' read -r -a parts <<< "$spec"
    for raw in "${parts[@]}"; do
      slug="$(slugify "$raw")"
      if [[ -z "$slug" ]]; then
        echo "Invalid --only value: '$raw'" >&2
        exit 1
      fi
      ALLOWED_NOTE_FILES="${ALLOWED_NOTE_FILES}
content/notes/published/${slug}.md"
    done
  done

  CHANGED_NOTE_PATHS="$(
    {
      git diff --name-only -- content/notes/published
      git diff --name-only --cached -- content/notes/published
      git ls-files --others --exclude-standard -- content/notes/published
    } | sed '/^$/d' | sort -u
  )"

  if [[ -n "$CHANGED_NOTE_PATHS" ]]; then
    VIOLATIONS=""
    while IFS= read -r notePath; do
      [[ -z "$notePath" ]] && continue
      if ! printf '%s\n' "$ALLOWED_NOTE_FILES" | sed '/^$/d' | grep -Fxq "$notePath"; then
        VIOLATIONS="${VIOLATIONS}
${notePath}"
      fi
    done <<< "$CHANGED_NOTE_PATHS"

    if [[ -n "$VIOLATIONS" ]]; then
      echo "Blocked by --only guard. Unexpected changed published note files:" >&2
      printf '%s\n' "$VIOLATIONS" | sed '/^$/d' >&2
      echo "Allowed by --only:" >&2
      printf '%s\n' "$ALLOWED_NOTE_FILES" | sed '/^$/d' >&2
      echo "If intentional, pass additional --only values (repeatable or comma-separated)." >&2
      exit 1
    fi
  fi
fi

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
