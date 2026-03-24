---
id: GUIDE-testing-and-release
type: GUIDE
title: Testing and Release Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-03-24
owner: Robert Andersson
relates_to: [CORE-quality-gates, GUIDE-getting-started]
tags: [testing, release]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Testing and Release Guide

## Required checks

1. `node tests/run-all.js`
2. Optional browser smoke when Playwright is installed: `node tests/test-browser-smoke-optional.js`

## Notes-only release path

When the change is only note content/tag generation, run from `sandbox`:

```bash
scripts/publish-note.sh -m "Publish note: <slug>"
```

Optional quick mode (notes-focused checks):

```bash
scripts/publish-note.sh -m "Publish note: <slug>" --quick
```

## Release gate

- Required checks pass.
- Behavior and documentation semantics are aligned.
- Accessibility baseline remains intact.

## Scope checks

- If scoring/diagnosis changed: verify semantics docs and tests were updated.
- If simulation/viz changed: verify summary consistency tests still pass.
