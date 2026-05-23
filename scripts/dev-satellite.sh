#!/usr/bin/env bash
# Local dev helper for the Satellite Index demo.
#
# Usage:
#   scripts/dev-satellite.sh inject   — substitute __WORKER_API_KEY__ from .env (for local testing)
#   scripts/dev-satellite.sh restore  — restore the placeholder (run before committing)
#
# The real key is never committed; it lives in .env (gitignored) and GitHub Actions secrets.

set -euo pipefail

TARGETS=(
  "cases/satellite-index/demo/satellite-index.js"
  "cases/satellite-index/three/satellite-index-three.js"
)
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

  for target in "${TARGETS[@]}"; do
    if ! grep -q "$PLACEHOLDER" "$target"; then
      echo "Already injected or placeholder missing in $target — run 'scripts/dev-satellite.sh restore' first." >&2
      exit 1
    fi
  done

  for target in "${TARGETS[@]}"; do
    sed -i '' "s/${PLACEHOLDER}/${KEY}/g" "$target"
  done
  echo "Key injected into Satellite Index demo scripts. Run 'scripts/dev-satellite.sh restore' before committing."

elif [[ "$cmd" == "restore" ]]; then
  for target in "${TARGETS[@]}"; do
    sed -i '' "s/[0-9a-f]\{64\}/${PLACEHOLDER}/g" "$target"
  done
  echo "Restored Satellite Index demo scripts to placeholder."

else
  echo "Usage: scripts/dev-satellite.sh inject|restore" >&2
  exit 1
fi
