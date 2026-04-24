#!/usr/bin/env bash
set -euo pipefail

# Publish writing workflow from sandbox:
# 1) Build writing outputs (notes + articles + tags)
# 2) Validate targeted writing items (and optionally run full test suite)
# 3) Commit generated artifacts
# 4) Push sandbox and merge into develop + main
#
# Usage:
#   scripts/publish-note.sh -m "Publish writing: <slug>" --only notes:<slug>
#   scripts/publish-note.sh -m "Publish writing: <slug>" --only articles:<slug> --full-suite
#   scripts/publish-note.sh -m "Publish writing: <slug>" --polish articles:<slug> --only articles:<slug>
#   scripts/publish-note.sh -m "Publish writing" --only notes:<slug-a>,articles:<slug-b>
#
# Notes:
# - The script name is retained for compatibility.
# - --only accepts either <collection>:<slug> or bare <slug>.
#   Bare slugs auto-resolve only when unique across notes/articles.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MSG=""
RUN_FULL_SUITE="false"
POLISH_TARGET=""
ONLY_SPECS=()
COLLECTIONS=("notes" "articles")
ALLOWED_ITEMS=""

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E "s/&/ and /g; s/[^a-z0-9[:space:]-]//g; s/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/-/g; s/-+/-/g"
}

is_valid_collection() {
  local candidate="${1:-}"
  for collection in "${COLLECTIONS[@]}"; do
    if [[ "$candidate" == "$collection" ]]; then
      return 0
    fi
  done
  return 1
}

source_dir_for_collection() {
  local collection="$1"
  case "$collection" in
    notes) printf '%s' "content/notes/published" ;;
    articles) printf '%s' "content/articles/published" ;;
    *)
      echo "Unknown collection: $collection" >&2
      exit 1
      ;;
  esac
}

output_dir_for_collection() {
  local collection="$1"
  case "$collection" in
    notes) printf '%s' "notes" ;;
    articles) printf '%s' "articles" ;;
    *)
      echo "Unknown collection: $collection" >&2
      exit 1
      ;;
  esac
}

data_index_path_for_collection() {
  local collection="$1"
  case "$collection" in
    notes) printf '%s' "data/notes-index.json" ;;
    articles) printf '%s' "data/articles-index.json" ;;
    *)
      echo "Unknown collection: $collection" >&2
      exit 1
      ;;
  esac
}

extract_field_from_file() {
  local file_path="$1"
  local field_name="$2"
  local content=""

  if [[ -f "$file_path" ]]; then
    content="$(cat "$file_path")"
  else
    # Handle renamed/deleted paths still present in git diff output.
    content="$(git show "HEAD:$file_path" 2>/dev/null || true)"
  fi

  if [[ -z "$content" ]]; then
    printf ''
    return 0
  fi

  printf '%s' "$content" \
    | awk -F': ' -v key="$field_name" '$1 == key {print $2; exit}' \
    | tr -d '"' \
    | xargs
}

extract_slug_from_file() {
  extract_field_from_file "$1" "slug"
}

extract_status_from_file() {
  extract_field_from_file "$1" "status"
}

find_source_path_by_slug() {
  local collection="$1"
  local target_slug="$2"
  local source_dir
  local file_path=""
  local found_slug=""

  source_dir="$(source_dir_for_collection "$collection")"
  if [[ ! -d "$source_dir" ]]; then
    return 1
  fi

  while IFS= read -r file_path; do
    found_slug="$(extract_slug_from_file "$file_path")"
    [[ -z "$found_slug" ]] && continue
    found_slug="$(slugify "$found_slug")"
    if [[ "$found_slug" == "$target_slug" ]]; then
      printf '%s' "$file_path"
      return 0
    fi
  done < <(find "$source_dir" -type f -name '*.md' | sort)

  return 1
}

index_contains_slug() {
  local collection="$1"
  local target_slug="$2"
  local index_path

  index_path="$(data_index_path_for_collection "$collection")"

  node -e "
    const fs = require('fs');
    const indexPath = process.argv[1];
    const target = process.argv[2];
    if (!fs.existsSync(indexPath)) process.exit(1);
    const rows = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    process.exit(rows.some((item) => item.slug === target) ? 0 : 1);
  " "$index_path" "$target_slug" >/dev/null 2>&1
}

add_allowed_item() {
  local collection="$1"
  local slug="$2"
  ALLOWED_ITEMS="${ALLOWED_ITEMS}
${collection}|${slug}"
}

resolve_only_spec() {
  local spec="$1"
  local explicit_collection=""
  local raw_slug="$spec"
  local normalized_slug=""

  if [[ "$spec" == *:* ]]; then
    explicit_collection="${spec%%:*}"
    raw_slug="${spec#*:}"
    explicit_collection="$(printf '%s' "$explicit_collection" | tr '[:upper:]' '[:lower:]' | xargs)"

    if ! is_valid_collection "$explicit_collection"; then
      echo "Invalid collection in --only value: '$spec'" >&2
      echo "Expected prefix one of: notes:, articles:" >&2
      exit 1
    fi

    normalized_slug="$(slugify "$raw_slug")"
    if [[ -z "$normalized_slug" ]]; then
      echo "Invalid --only slug value: '$spec'" >&2
      exit 1
    fi

    add_allowed_item "$explicit_collection" "$normalized_slug"
    return
  fi

  normalized_slug="$(slugify "$raw_slug")"
  if [[ -z "$normalized_slug" ]]; then
    echo "Invalid --only value: '$spec'" >&2
    exit 1
  fi

  local matches=0
  local found_collection=""
  for collection in "${COLLECTIONS[@]}"; do
    if find_source_path_by_slug "$collection" "$normalized_slug" >/dev/null; then
      matches=$((matches + 1))
      found_collection="$collection"
    fi
  done

  if [[ "$matches" -eq 0 ]]; then
    echo "--only slug '$normalized_slug' not found in notes/articles. Use <collection>:<slug>." >&2
    exit 1
  fi

  if [[ "$matches" -gt 1 ]]; then
    echo "--only slug '$normalized_slug' is ambiguous across notes and articles." >&2
    echo "Use an explicit prefix, for example: notes:$normalized_slug or articles:$normalized_slug" >&2
    exit 1
  fi

  add_allowed_item "$found_collection" "$normalized_slug"
}

parse_allowed_specs() {
  ALLOWED_ITEMS=""
  for spec in "${ONLY_SPECS[@]}"; do
    IFS=',' read -r -a parts <<< "$spec"
    for raw in "${parts[@]}"; do
      resolve_only_spec "$raw"
    done
  done
}

allowed_item_exists() {
  local collection="$1"
  local slug="$2"
  printf '%s\n' "$ALLOWED_ITEMS" | sed '/^$/d' | grep -Fxq "${collection}|${slug}"
}

allowed_slug_exists() {
  local slug="$1"
  printf '%s\n' "$ALLOWED_ITEMS" | sed '/^$/d' | grep -E "^[^|]+\|${slug}$" -q
}

collection_for_source_path() {
  local file_path="$1"
  case "$file_path" in
    content/notes/published/*) printf '%s' "notes" ;;
    content/articles/published/*) printf '%s' "articles" ;;
    *) printf '' ;;
  esac
}

collect_changed_source_paths() {
  {
    git diff --name-only -- content/notes/published content/articles/published
    git diff --name-only --cached -- content/notes/published content/articles/published
    git ls-files --others --exclude-standard -- content/notes/published content/articles/published
  } | sed '/^$/d' | sort -u
}

validate_allowed_outputs() {
  local item=""
  local collection=""
  local allowed_slug=""
  local source_path=""
  local status=""
  local normalized_status=""
  local output_dir=""

  while IFS= read -r item; do
    [[ -z "$item" ]] && continue
    collection="${item%%|*}"
    allowed_slug="${item#*|}"

    source_path="$(find_source_path_by_slug "$collection" "$allowed_slug" || true)"
    if [[ -z "$source_path" ]]; then
      echo "Validation failed: no $collection source found for slug '$allowed_slug'." >&2
      exit 1
    fi

    status="$(extract_status_from_file "$source_path")"
    normalized_status="$(printf '%s' "$status" | tr '[:upper:]' '[:lower:]' | xargs)"
    output_dir="$(output_dir_for_collection "$collection")"

    if [[ "$normalized_status" == "published" ]]; then
      if [[ ! -f "$output_dir/$allowed_slug/index.html" ]]; then
        echo "Validation failed: expected generated page $output_dir/$allowed_slug/index.html for published $collection slug '$allowed_slug'." >&2
        exit 1
      fi
      if ! index_contains_slug "$collection" "$allowed_slug"; then
        echo "Validation failed: published $collection slug '$allowed_slug' is missing from $(data_index_path_for_collection "$collection")." >&2
        exit 1
      fi
    else
      if [[ -f "$output_dir/$allowed_slug/index.html" ]]; then
        echo "Validation failed: found $output_dir/$allowed_slug/index.html but status is '$normalized_status'." >&2
        exit 1
      fi
      if index_contains_slug "$collection" "$allowed_slug"; then
        echo "Validation failed: $collection slug '$allowed_slug' appears in $(data_index_path_for_collection "$collection") with status '$normalized_status'." >&2
        exit 1
      fi
    fi
  done < <(printf '%s\n' "$ALLOWED_ITEMS" | sed '/^$/d' | sort -u)
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      COMMIT_MSG="${2:-}"
      shift 2
      ;;
    --quick)
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
        echo "--polish requires a target: slug, collection:slug, or file path." >&2
        exit 1
      fi
      shift 2
      ;;
    --only)
      if [[ -z "${2:-}" ]]; then
        echo "--only requires a slug or collection-prefixed slug." >&2
        exit 1
      fi
      ONLY_SPECS+=("$2")
      shift 2
      ;;
    -h|--help)
      sed -n '1,60p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$COMMIT_MSG" ]]; then
  echo "Commit message is required. Use -m \"Publish writing: <slug>\"." >&2
  exit 1
fi

if [[ ${#ONLY_SPECS[@]} -eq 0 ]]; then
  echo "--only is required (single value or comma-separated list)." >&2
  echo "Examples:" >&2
  echo "  scripts/publish-note.sh -m \"Publish writing\" --only notes:my-note" >&2
  echo "  scripts/publish-note.sh -m \"Publish writing\" --only articles:my-article" >&2
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

parse_allowed_specs

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
  echo "==> Polishing writing spelling/punctuation"
  if [[ -f "$POLISH_TARGET" ]]; then
    node scripts/polish-note.js --file "$POLISH_TARGET"
  elif [[ "$POLISH_TARGET" == *:* ]]; then
    polish_collection="${POLISH_TARGET%%:*}"
    polish_slug="${POLISH_TARGET#*:}"
    polish_collection="$(printf '%s' "$polish_collection" | tr '[:upper:]' '[:lower:]' | xargs)"
    if is_valid_collection "$polish_collection"; then
      node scripts/polish-note.js --collection "$polish_collection" --slug "$polish_slug"
    else
      node scripts/polish-note.js --slug "$POLISH_TARGET"
    fi
  elif [[ -f "content/notes/published/$POLISH_TARGET.md" ]]; then
    node scripts/polish-note.js --file "content/notes/published/$POLISH_TARGET.md"
  elif [[ -f "content/articles/published/$POLISH_TARGET.md" ]]; then
    node scripts/polish-note.js --file "content/articles/published/$POLISH_TARGET.md"
  else
    node scripts/polish-note.js --slug "$POLISH_TARGET"
  fi
fi

echo "==> Building writing"
node scripts/build-notes.js

echo "==> Enforcing --only source guard"
CHANGED_SOURCE_PATHS="$(collect_changed_source_paths)"

if [[ -n "$CHANGED_SOURCE_PATHS" ]]; then
  VIOLATIONS=""
  while IFS= read -r source_path; do
    [[ -z "$source_path" ]] && continue

    source_collection="$(collection_for_source_path "$source_path")"
    if [[ -z "$source_collection" ]]; then
      VIOLATIONS="${VIOLATIONS}
${source_path} (unknown collection)"
      continue
    fi

    source_slug="$(extract_slug_from_file "$source_path")"
    if [[ -z "$source_slug" ]]; then
      VIOLATIONS="${VIOLATIONS}
${source_path} (missing slug)"
      continue
    fi

    source_slug="$(slugify "$source_slug")"

    if allowed_item_exists "$source_collection" "$source_slug"; then
      continue
    fi

    # Allow deleted/moved source paths when slug is explicitly allowed in the
    # opposite collection during migrations.
    if [[ ! -f "$source_path" ]] && allowed_slug_exists "$source_slug"; then
      continue
    fi

    VIOLATIONS="${VIOLATIONS}
${source_path} (collection: ${source_collection}, slug: ${source_slug})"
  done <<< "$CHANGED_SOURCE_PATHS"

  if [[ -n "$VIOLATIONS" ]]; then
    echo "Blocked by --only guard. Unexpected changed published source files:" >&2
    printf '%s\n' "$VIOLATIONS" | sed '/^$/d' >&2
    echo "Allowed items by --only:" >&2
    printf '%s\n' "$ALLOWED_ITEMS" | sed '/^$/d' >&2
    echo "If intentional, pass additional --only values (repeatable or comma-separated)." >&2
    exit 1
  fi
fi

echo "==> Validating target outputs"
validate_allowed_outputs

if [[ "$RUN_FULL_SUITE" == "true" ]]; then
  echo "==> Running full test suite"
  node tests/run-all.js
else
  echo "==> Running writing-focused checks"
  node tests/test-notes-build-contract.js
fi

echo "==> Staging publish artifacts"
git add notes articles tags data
while IFS= read -r source_path; do
  [[ -z "$source_path" ]] && continue

  source_collection="$(collection_for_source_path "$source_path")"
  [[ -z "$source_collection" ]] && continue

  source_slug="$(extract_slug_from_file "$source_path")"
  [[ -z "$source_slug" ]] && continue
  source_slug="$(slugify "$source_slug")"

  if allowed_item_exists "$source_collection" "$source_slug" || ([[ ! -f "$source_path" ]] && allowed_slug_exists "$source_slug"); then
    git add -- "$source_path" 2>/dev/null || true
  fi
done <<< "$CHANGED_SOURCE_PATHS"

if git diff --cached --quiet; then
  echo "No staged changes to commit for publish." >&2
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
