# Performance Review Playbook

## Scope

Runtime rendering cost, asset loading, and responsiveness.

## Check

- Render/reflow hotspots and expensive loops/listeners.
- Asset weight and loading strategy.
- Mobile performance and interaction latency.
- Repeated DOM queries/layout thrash.

## Report

- Issues harming perceived performance on common devices (Must/Should).
- Budget breaches and heavy assets (Should).
- Low-yield micro-optimizations (Could).

## Verify

- Capture before/after metrics (LCP/CLS/INP or local proxies).
- Validate no functional regressions.
