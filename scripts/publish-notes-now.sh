#!/usr/bin/env bash
set -euo pipefail

# One-command note publish from sandbox:
# - Detect changed notes under content/notes/published
# - Extract slugs from frontmatter
# - Run publish-note.sh in quick mode with --only guards
#
# Usage:
#   scripts/publish-notes-now.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "sandbox" ]]; then
  echo "This script must be run from branch 'sandbox'. Current branch: $CURRENT_BRANCH" >&2
  exit 1
fi

NOTE_FILES=()
while IFS= read -r line; do
  NOTE_FILES+=("$line")
done < <(
  {
    git diff --name-only -- content/notes/published
    git diff --name-only --cached -- content/notes/published
    git ls-files --others --exclude-standard -- content/notes/published
  } | sed '/^$/d' | sort -u
)

if [[ ${#NOTE_FILES[@]} -eq 0 ]]; then
  echo "No changed note files found under content/notes/published/." >&2
  echo "Edit/create a note first, then rerun this command." >&2
  exit 1
fi

SLUGS=()
for file in "${NOTE_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    continue
  fi
  slug="$(awk -F': ' '/^slug:[[:space:]]*/{print $2; exit}' "$file" | tr -d '"' | xargs || true)"
  if [[ -z "$slug" ]]; then
    echo "Missing frontmatter slug in: $file" >&2
    exit 1
  fi
  SLUGS+=("$slug")
done

if [[ ${#SLUGS[@]} -eq 0 ]]; then
  echo "No valid note slugs found in changed note files." >&2
  exit 1
fi

# De-duplicate while preserving order.
UNIQ_SLUGS=()
for s in "${SLUGS[@]}"; do
  seen="false"
  if [[ ${#UNIQ_SLUGS[@]} -gt 0 ]]; then
    for u in "${UNIQ_SLUGS[@]}"; do
      if [[ "$u" == "$s" ]]; then
        seen="true"
        break
      fi
    done
  fi
  if [[ "$seen" == "false" ]]; then
    UNIQ_SLUGS+=("$s")
  fi
done

commit_msg="Publish notes: $(IFS=', '; echo "${UNIQ_SLUGS[*]}")"

echo "Detected slugs: ${UNIQ_SLUGS[*]}"
echo "Commit message: $commit_msg"

cmd=("scripts/publish-note.sh" "-m" "$commit_msg" "--quick")
for slug in "${UNIQ_SLUGS[@]}"; do
  cmd+=("--only" "$slug")
done

"${cmd[@]}"
