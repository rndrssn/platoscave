# Shared source list for the Satellite Index Worker key placeholder.
# Sourced by scripts/cf-build.sh (Cloudflare Pages build) and
# scripts/dev-satellite.sh (local inject/restore) so the two can't drift.
SATELLITE_WORKER_TARGETS=(
  "modules/satellite-index/demo/satellite-index.js"
  "modules/satellite-index/three/satellite-index-three.js"
)
