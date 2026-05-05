#!/usr/bin/env bash
# Local dev helper for the Satellite Index demo.
#
# Usage:
#   scripts/dev-satellite.sh inject   — substitute __WORKER_API_KEY__ from .env (for local testing)
#   scripts/dev-satellite.sh restore  — restore the placeholder (run before committing)
#
# The real key is never committed; it lives in .env (gitignored) and GitHub Actions secrets.

set -euo pipefail

TARGET="cases/satellite-index/demo/satellite-index.js"
PLACEHOLDER="__WORKER_API_KEY__"

cmd="${1:-}"

if [[ "$cmd" == "inject" ]]; then
  if [[ ! -f ".env" ]]; then
    echo "Error: .env not found. Add WORKER_API_KEY=<value> to .env first." >&2
    exit 1
  fi

  # Extract WORKER_API_KEY from .env (strips leading spaces and inline comments)
  KEY=$(grep -E '^\s*WORKER_API_KEY=' .env | tail -1 | sed 's/.*WORKER_API_KEY=//' | sed 's/[[:space:]].*//')

  if [[ -z "$KEY" ]]; then
    echo "Error: WORKER_API_KEY not found in .env" >&2
    exit 1
  fi

  if ! grep -q "$PLACEHOLDER" "$TARGET"; then
    echo "Already injected — run 'scripts/dev-satellite.sh restore' first." >&2
    exit 1
  fi

  sed -i '' "s/${PLACEHOLDER}/${KEY}/g" "$TARGET"
  echo "Key injected into $TARGET. Run 'scripts/dev-satellite.sh restore' before committing."

elif [[ "$cmd" == "restore" ]]; then
  git restore "$TARGET"
  echo "Restored $TARGET to placeholder."

else
  echo "Usage: scripts/dev-satellite.sh inject|restore" >&2
  exit 1
fi
