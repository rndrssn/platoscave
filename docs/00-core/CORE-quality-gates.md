---
id: CORE-quality-gates
type: CORE
title: Quality Gates
status: ACTIVE
created: 2026-03-19
updated: 2026-03-24
owner: Robert Andersson
relates_to: [CORE, GUIDE-testing-and-release, REFERENCE-gc-model-semantics]
tags: [core, quality, testing, release]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Quality Gates

## Required for code changes

1. Run `node tests/run-all.js`.
2. `run-all` already includes navigation link checks and notes build checks.
3. Optional browser smoke can be run when Playwright is installed (`node tests/test-browser-smoke-optional.js`).

## Required for semantics/copy changes

1. Keep terms aligned with `docs/20-reference/REFERENCE-gc-model-semantics.md`.
2. Update relevant docs in the same change.

## Merge readiness

- Tests pass.
- No unresolved docs integrity errors.
- No known mismatch between code behavior and documented semantics.
