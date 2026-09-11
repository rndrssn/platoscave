#!/usr/bin/env bash
# Cloudflare Pages build entrypoint.
# Runs the required checks first — the retired .github/workflows/deploy.yml made
# `node tests/run-all.js` a hard prerequisite of every deploy (`deploy: needs: test`),
# and ci.yml runs independently of the Pages build, so nothing else gates this.
# Then generates the writing pages, then injects the real Satellite Index Worker
# key from the WORKER_API_KEY Pages environment variable in place of the
# committed __WORKER_API_KEY__ placeholder.
set -euo pipefail

node tests/run-all.js
node scripts/build-notes.js

source scripts/lib/satellite-worker-targets.sh

if [ -z "${WORKER_API_KEY:-}" ]; then
  echo "cf-build: WORKER_API_KEY is unset; Satellite Index live calls will fail until it is set in the Pages environment." >&2
else
  # perl -pi is portable across the GNU sed on the Pages build image and BSD sed
  # on a local macOS checkout; the key is interpolated as a literal string.
  for f in "${SATELLITE_WORKER_TARGETS[@]}"; do
    perl -pi -e 's/__WORKER_API_KEY__/$ENV{WORKER_API_KEY}/g' "$f"
  done
fi
