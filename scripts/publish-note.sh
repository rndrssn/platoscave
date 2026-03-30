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

extract_slug_from_note_file() {
  local note_path="$1"
  local note_content=""

  if [[ -f "$note_path" ]]; then
    note_content="$(cat "$note_path")"
  else
    # Handle renamed/deleted paths still present in git diff output.
    note_content="$(git show "HEAD:$note_path" 2>/dev/null || true)"
  fi

  if [[ -z "$note_content" ]]; then
    printf ''
    return 0
  fi

  printf '%s' "$note_content" \
    | awk -F': ' '/^slug:[[:space:]]*/{print $2; exit}' \
    | tr -d '"' \
    | xargs
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

if ! git diff --cached --quiet; then
  echo "Index is not clean. Please commit or unstage existing staged changes before running publish-note." >&2
  exit 1
fi

sync_target_branch() {
  local target="$1"
  echo "==> Preparing $target"
  if git show-ref --verify --quiet "refs/heads/$target"; then
    git checkout "$target"
  else
    git checkout -B "$target" "origin/$target"
  fi
  git merge --ff-only "origin/$target"
}

promote_sandbox_to_target() {
  local target="$1"
  echo "==> Merging sandbox -> $target"
  sync_target_branch "$target"
  git merge --no-ff sandbox -m "Merge branch 'sandbox' into $target"
  git push origin "$target"
}

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
  ALLOWED_NOTE_SLUGS=""

  for spec in "${ONLY_SPECS[@]}"; do
    IFS=',' read -r -a parts <<< "$spec"
    for raw in "${parts[@]}"; do
      slug="$(slugify "$raw")"
      if [[ -z "$slug" ]]; then
        echo "Invalid --only value: '$raw'" >&2
        exit 1
      fi
      ALLOWED_NOTE_SLUGS="${ALLOWED_NOTE_SLUGS}
${slug}"
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
      noteSlug="$(extract_slug_from_note_file "$notePath")"
      if [[ -z "$noteSlug" ]]; then
        VIOLATIONS="${VIOLATIONS}
${notePath} (missing slug)"
        continue
      fi
      noteSlug="$(slugify "$noteSlug")"
      if ! printf '%s\n' "$ALLOWED_NOTE_SLUGS" | sed '/^$/d' | grep -Fxq "$noteSlug"; then
        VIOLATIONS="${VIOLATIONS}
${notePath} (slug: ${noteSlug})"
      fi
    done <<< "$CHANGED_NOTE_PATHS"

    if [[ -n "$VIOLATIONS" ]]; then
      echo "Blocked by --only guard. Unexpected changed published note files:" >&2
      printf '%s\n' "$VIOLATIONS" | sed '/^$/d' >&2
      echo "Allowed slugs by --only:" >&2
      printf '%s\n' "$ALLOWED_NOTE_SLUGS" | sed '/^$/d' >&2
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
if [[ ${#ONLY_SPECS[@]} -gt 0 ]]; then
  git add notes tags data
  while IFS= read -r notePath; do
    [[ -z "$notePath" ]] && continue
    noteSlug="$(extract_slug_from_note_file "$notePath")"
    [[ -z "$noteSlug" ]] && continue
    noteSlug="$(slugify "$noteSlug")"
    if printf '%s\n' "$ALLOWED_NOTE_SLUGS" | sed '/^$/d' | grep -Fxq "$noteSlug"; then
      git add -- "$notePath" 2>/dev/null || true
    fi
  done <<< "$CHANGED_NOTE_PATHS"
else
  git add content/notes/published notes tags data
fi

if git diff --cached --quiet; then
  echo "No staged changes to commit for note publish." >&2
  exit 1
fi

echo "==> Committing"
git commit -m "$COMMIT_MSG"

echo "==> Pushing sandbox"
git push origin sandbox

echo "==> Fetching remote branch tips"
git fetch origin sandbox develop main

promote_sandbox_to_target develop
promote_sandbox_to_target main

echo "==> Returning to sandbox"
git checkout sandbox

echo "==> Verifying branch promotion"
git fetch origin sandbox develop main
SANDBOX_SHA="$(git rev-parse sandbox)"
for target in develop main; do
  if git merge-base --is-ancestor "$SANDBOX_SHA" "origin/$target"; then
    echo "OK: origin/$target contains sandbox commit $SANDBOX_SHA"
  else
    echo "FAIL: origin/$target does not contain sandbox commit $SANDBOX_SHA" >&2
    exit 1
  fi
done

echo "==> Done"
echo "sandbox: $(git rev-parse sandbox)"
echo "develop: $(git rev-parse develop)"
echo "main:    $(git rev-parse main)"
echo "tree:    $(git rev-parse sandbox^{tree})"
