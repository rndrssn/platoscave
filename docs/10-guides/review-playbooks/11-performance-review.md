---
id: GUIDE-11-performance-review
type: GUIDE
title: Performance Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-03-25
owner: Robert Andersson
relates_to: [GUIDE-llm-review-playbooks-index, CORE-quality-gates]
tags: [llm, review, playbook]
load_when: [when-running-reviews]
do_not_load_when: []
token_cost_estimate: low
---

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
