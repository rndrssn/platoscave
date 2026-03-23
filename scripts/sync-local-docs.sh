#!/usr/bin/env bash
set -euo pipefail

# Sync private/local docs into this repo so local coding agents can read them.
# Docs stay untracked because `docs/` is gitignored.
#
# Usage:
#   scripts/sync-local-docs.sh
#   scripts/sync-local-docs.sh --source ~/private/platoscave-docs
#   scripts/sync-local-docs.sh --delete
#
# Defaults:
#   source: $LOCAL_DOCS_SOURCE or ~/private/platoscave-docs
#   target: <repo>/docs

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_SOURCE="${LOCAL_DOCS_SOURCE:-$HOME/private/platoscave-docs}"
SOURCE_DIR="$DEFAULT_SOURCE"
TARGET_DIR="$ROOT_DIR/docs"
DELETE_FLAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE_DIR="${2:-}"
      shift 2
      ;;
    --delete)
      DELETE_FLAG="--delete"
      shift
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

if [[ -z "$SOURCE_DIR" ]]; then
  echo "Source path is empty. Use --source or set LOCAL_DOCS_SOURCE." >&2
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source docs directory not found: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

echo "Syncing docs"
echo "  from: $SOURCE_DIR"
echo "    to: $TARGET_DIR"
if [[ -n "$DELETE_FLAG" ]]; then
  echo "  mode: mirror (includes delete)"
else
  echo "  mode: additive sync (no delete)"
fi

rsync -a "$DELETE_FLAG" --exclude ".DS_Store" --exclude ".obsidian/" "$SOURCE_DIR"/ "$TARGET_DIR"/

echo "Done."
echo "Note: docs remain local-only unless you force-add them to git."
