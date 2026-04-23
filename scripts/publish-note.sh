#!/usr/bin/env bash
set -euo pipefail

# Publish note workflow from sandbox:
# 1) Build notes
# 2) Validate targeted notes (and optionally run full test suite)
# 3) Commit generated notes artifacts
# 4) Push sandbox and merge into develop + main
#
# Usage:
#   scripts/publish-note.sh -m "Publish note: <slug>" --only <slug>
#   scripts/publish-note.sh -m "Publish note: <slug>" --only <slug> --full-suite
#   scripts/publish-note.sh -m "Publish note: <slug>" --polish <slug-or-path> --only <slug>
#   scripts/publish-note.sh -m "Publish notes" --only <slug-a>,<slug-b>

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MSG=""
RUN_FULL_SUITE="false"
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

extract_status_from_note_file() {
  local note_path="$1"
  local note_content=""

  if [[ -f "$note_path" ]]; then
    note_content="$(cat "$note_path")"
  else
    note_content="$(git show "HEAD:$note_path" 2>/dev/null || true)"
  fi

  if [[ -z "$note_content" ]]; then
    printf ''
    return 0
  fi

  printf '%s' "$note_content" \
    | awk -F': ' '/^status:[[:space:]]*/{print $2; exit}' \
    | tr -d '"' \
    | xargs
}

find_note_path_by_slug() {
  local target_slug="$1"
  local file_path=""
  local note_slug=""

  while IFS= read -r file_path; do
    note_slug="$(extract_slug_from_note_file "$file_path")"
    [[ -z "$note_slug" ]] && continue
    note_slug="$(slugify "$note_slug")"
    if [[ "$note_slug" == "$target_slug" ]]; then
      printf '%s' "$file_path"
      return 0
    fi
  done < <(find content/notes/published -type f -name '*.md' | sort)

  return 1
}

note_index_contains_slug() {
  local target_slug="$1"
  node -e "
    const fs = require('fs');
    const target = process.argv[1];
    const notes = JSON.parse(fs.readFileSync('data/notes-index.json', 'utf8'));
    process.exit(notes.some((note) => note.slug === target) ? 0 : 1);
  " "$target_slug" >/dev/null 2>&1
}

parse_allowed_note_slugs() {
  local spec=""
  local raw=""
  local slug=""
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
}

validate_allowed_note_outputs() {
  local allowed_slug=""
  local note_path=""
  local note_status=""
  local note_status_normalized=""

  while IFS= read -r allowed_slug; do
    [[ -z "$allowed_slug" ]] && continue
    note_path="$(find_note_path_by_slug "$allowed_slug" || true)"
    if [[ -z "$note_path" ]]; then
      echo "Validation failed: no note source found for slug '$allowed_slug' under content/notes/published/." >&2
      exit 1
    fi

    note_status="$(extract_status_from_note_file "$note_path")"
    note_status_normalized="$(printf '%s' "$note_status" | tr '[:upper:]' '[:lower:]' | xargs)"

    if [[ "$note_status_normalized" == "published" ]]; then
      if [[ ! -f "notes/$allowed_slug/index.html" ]]; then
        echo "Validation failed: expected generated page notes/$allowed_slug/index.html for published note '$allowed_slug'." >&2
        exit 1
      fi
      if ! note_index_contains_slug "$allowed_slug"; then
        echo "Validation failed: published note '$allowed_slug' is missing from data/notes-index.json." >&2
        exit 1
      fi
    else
      if [[ -f "notes/$allowed_slug/index.html" ]]; then
        echo "Validation failed: found notes/$allowed_slug/index.html but note status is '$note_status_normalized'." >&2
        exit 1
      fi
      if note_index_contains_slug "$allowed_slug"; then
        echo "Validation failed: note '$allowed_slug' appears in data/notes-index.json with status '$note_status_normalized'." >&2
        exit 1
      fi
    fi
  done < <(printf '%s\n' "$ALLOWED_NOTE_SLUGS" | sed '/^$/d' | sort -u)
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      COMMIT_MSG="${2:-}"
      shift 2
      ;;
    --quick)
      # Backward-compatible alias for note-focused validation (now the default).
      RUN_FULL_SUITE="false"
      shift
      ;;
    --full|--full-suite)
      RUN_FULL_SUITE="true"
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

if [[ ${#ONLY_SPECS[@]} -eq 0 ]]; then
  echo "--only is required (single slug or comma-separated slugs)." >&2
  echo "Example: scripts/publish-note.sh -m \"Publish note: lowvolumehighsoftware\" --only lowvolumehighsoftware" >&2
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

parse_allowed_note_slugs

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

echo "==> Enforcing --only note source guard"
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

echo "==> Validating target note outputs"
validate_allowed_note_outputs

if [[ "$RUN_FULL_SUITE" == "true" ]]; then
  echo "==> Running full test suite"
  node tests/run-all.js
else
  echo "==> Running note-focused checks"
  node tests/test-notes-build-contract.js
fi

echo "==> Staging note publish artifacts"
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
