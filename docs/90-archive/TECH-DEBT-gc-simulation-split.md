---
id: TECH-DEBT-gc-simulation-split
type: TECH-DEBT
title: Split gc-simulation.js into core and public API
status: DRAFT
created: 2026-03-15
updated: 2026-03-15
owner: Robert Andersson
relates_to: [TECH-DEBT-tracker, PRINCIPLE-coding-standards, GUIDE-architecture]
tags: [javascript, refactor, simulation, separation-of-concerns]
---

# Split gc-simulation.js into core and public API

## Current State

`gc-simulation.js` is ~1000 lines and contains six distinct responsibilities:

| Responsibility | Description |
|---------------|-------------|
| Matrix builders | `buildAccessMatrices()`, `buildDecisionMatrices()`, `buildEnergyVectors()` |
| Core simulation loop | `garbageCan()` — the Fortran port |
| Outcome counting | `countDecisionTypes()` |
| Tick snapshot builder | `buildTickSnapshots()` — converts raw state to d3-consumable format |
| Validation | `validateSimulation()` — test runner |
| Public API | `runGarbageCanSimulation()` — the single exposed function |

This violates the single responsibility principle defined in `PRINCIPLE-coding-standards.md`.

---

## Risk

- **Debugging** — finding issues requires scanning 1000 lines rather than focused files
- **Claude Code context** — large files leave less room for other files in context, increasing risk of incomplete reads
- **Maintainability** — changes to the core loop risk unintended side effects on the public API and vice versa

---

## Proposed Fix

Split into two files:

**`gc-simulation-core.js`**
- Matrix builders
- `garbageCan()` core loop
- `countDecisionTypes()`
- `buildTickSnapshots()`
- No public API — internal only

**`gc-simulation.js`** (reduced)
- Imports/depends on `gc-simulation-core.js`
- `runGarbageCanSimulation()` — public API only
- `validateSimulation()` — test runner
- ~200 lines

Both files loaded in HTML pages that use the simulation:
```html
<script src="../../gc-simulation-core.js"></script>
<script src="../../gc-simulation.js"></script>
```

---

## When to Do This

Not now — the simulation is working and the module is in active development.
Do this when `SPIKE-organised-anarchy-mapper` reaches `VALIDATED` and the
module is being prepared for merge to `develop`.

---

## Acceptance Criteria

- [ ] `gc-simulation-core.js` contains all internal logic
- [ ] `gc-simulation.js` contains only the public API and validation
- [ ] `node tests/test-gc-simulation.js` still passes after split
- [ ] `modules/garbage-can/index.html` loads both files and works correctly
- [ ] No change to the public API — `runGarbageCanSimulation()` signature unchanged
