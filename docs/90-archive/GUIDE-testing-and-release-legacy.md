---
id: GUIDE-testing-and-release
type: GUIDE
title: Testing and Release Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [GUIDE-docs-index, GUIDE-getting-started, PRINCIPLE-coding-standards]
tags: [testing, qa, release]
---

# Testing and Release Guide

## Test Inventory

### Fast automated checks

- `tests/run-all.js` — canonical full suite runner
- Unit/contract/integration tests under `tests/*.js`

### Manual/browser checks

- `tests/test-gc-viz.html`
- `tests/test-gc-simulation.html`

### Server-required check

- `tests/test-navigation-links.js` (requires local HTTP server)

## Required Commands Before Merge

1. `node tests/run-all.js`
2. If navigation touched: run local server + `node tests/test-navigation-links.js`
3. If simulation/viz semantics changed: verify one Assess run and one Explorer run in browser

## Release Gate

A change is release-ready when:

- Automated suite passes.
- No known mismatch between docs terms and UI labels.
- Accessibility baseline remains intact (skip link, semantic form grouping, nav ARIA states).
- Any changed behavior has corresponding docs updates.

## Scope-Based Checklist

### If scoring changed

- Re-check archetype outputs in scoring tests.
- Confirm thresholds described in docs still match implementation.

### If diagnosis changed

- Re-check placeholder semantics and interpolation in docs and code.
- Verify wording still respects model ontology.

### If simulation/viz changed

- Re-check summary consistency invariants.
- Verify choice-level and problem-level labels remain separated.

## Incident Handling

If a release discrepancy is found:

1. Reproduce with exact parameter set.
2. Capture the mismatch (expected vs actual).
3. Decide whether issue is code, tests, or docs.
4. Patch all three when needed.
