#!/usr/bin/env bash
set -euo pipefail

# One-command writing publish from sandbox:
# - Detect changed published writing under content/notes/published and content/articles/published
# - Extract slugs from frontmatter
# - Run publish-note.sh with explicit --only guards
#
# Usage:
#   scripts/publish-notes-now.sh
#
# Note:
# - Script name retained for compatibility.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "sandbox" ]]; then
  echo "This script must be run from branch 'sandbox'. Current branch: $CURRENT_BRANCH" >&2
  exit 1
fi

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E "s/&/ and /g; s/[^a-z0-9[:space:]-]//g; s/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/-/g; s/-+/-/g"
}

collection_for_path() {
  local file_path="$1"
  case "$file_path" in
    content/notes/published/*) printf '%s' "notes" ;;
    content/articles/published/*) printf '%s' "articles" ;;
    *) printf '' ;;
  esac
}

extract_slug_from_file() {
  local file_path="$1"
  local content=""

  if [[ -f "$file_path" ]]; then
    content="$(cat "$file_path")"
  else
    content="$(git show "HEAD:$file_path" 2>/dev/null || true)"
  fi

  if [[ -z "$content" ]]; then
    printf ''
    return 0
  fi

  printf '%s' "$content" \
    | awk -F': ' '/^slug:[[:space:]]*/{print $2; exit}' \
    | tr -d '"' \
    | xargs
}

SOURCE_FILES=()
while IFS= read -r line; do
  SOURCE_FILES+=("$line")
done < <(
  {
    git diff --name-only -- content/notes/published content/articles/published
    git diff --name-only --cached -- content/notes/published content/articles/published
    git ls-files --others --exclude-standard -- content/notes/published content/articles/published
  } | sed '/^$/d' | sort -u
)

if [[ ${#SOURCE_FILES[@]} -eq 0 ]]; then
  echo "No changed published source files found under notes/articles." >&2
  echo "Edit/create a note or article first, then rerun this command." >&2
  exit 1
fi

SPECS=()
for file in "${SOURCE_FILES[@]}"; do
  collection="$(collection_for_path "$file")"
  [[ -z "$collection" ]] && continue

  slug="$(extract_slug_from_file "$file" || true)"
  if [[ -z "$slug" ]]; then
    echo "Missing frontmatter slug in: $file" >&2
    exit 1
  fi

  slug="$(slugify "$slug")"
  if [[ -z "$slug" ]]; then
    echo "Invalid slug derived from: $file" >&2
    exit 1
  fi

  SPECS+=("${collection}:${slug}")
done

if [[ ${#SPECS[@]} -eq 0 ]]; then
  echo "No valid writing targets found in changed source files." >&2
  exit 1
fi

# De-duplicate while preserving order.
UNIQ_SPECS=()
for spec in "${SPECS[@]}"; do
  seen="false"
  if [[ ${#UNIQ_SPECS[@]} -gt 0 ]]; then
    for existing in "${UNIQ_SPECS[@]}"; do
      if [[ "$existing" == "$spec" ]]; then
        seen="true"
        break
      fi
    done
  fi
  if [[ "$seen" == "false" ]]; then
    UNIQ_SPECS+=("$spec")
  fi
done

commit_msg="Publish writing: $(IFS=', '; echo "${UNIQ_SPECS[*]}")"

echo "Detected writing targets: ${UNIQ_SPECS[*]}"
echo "Commit message: $commit_msg"

cmd=("scripts/publish-note.sh" "-m" "$commit_msg")
for spec in "${UNIQ_SPECS[@]}"; do
  cmd+=("--only" "$spec")
done

"${cmd[@]}"
