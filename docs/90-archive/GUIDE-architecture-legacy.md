---
id: GUIDE-architecture
type: GUIDE
title: Front-End Architecture Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [GUIDE-docs-index, PRINCIPLE-coding-standards, CSS-ARCHITECTURE, REFERENCE-gc-model-semantics]
tags: [architecture, frontend, modules]
---

# Front-End Architecture Guide

## System Shape

- Static multi-page site.
- Shared logic in root-level JS modules.
- Module-specific wiring scripts under each module folder.

## Layer Boundaries

### HTML

- Structural markup and script wiring only.
- No business logic.

### CSS

- `css/main.css` controls import/cascade order.
- Tokens/themes in `tokens.css` + `themes.css`.
- Shared patterns in `components.css`.
- Module/page overrides in `pages.css`.

### JavaScript Logic (root)

- `gc-simulation.js` — simulation core + async wrapper.
- `gc-scoring.js` — questionnaire scoring.
- `gc-diagnosis.js` — diagnosis lookup and wording interpolation.
- `gc-viz.js` — D3 rendering and simulation readouts.

### JavaScript Wiring (module pages)

- `modules/garbage-can/assess/assess.js`
- `modules/garbage-can/explorer/explorer.js`

These coordinate DOM events, call shared logic modules, and update UI state.

## Garbage Can Runtime Flow

### Assess flow

1. Collect 12 questionnaire responses.
2. Map to scoring output (`energyLoad`, `decisionStructure`, `accessStructure`, `raw`).
3. Convert `energyLoad` to simulation `problemIntensity`; set `problemInflow`.
4. Run simulation async (`runGarbageCanSimulationAsync`).
5. Render live viz + summaries.
6. Update diagnosis wording with unresolved problem share.

### Explorer flow

1. User picks direct simulation parameters.
2. Show diagnosis preview from structure pair.
3. Run simulation async.
4. Render same shared visualization and summaries.

## Contracts That Must Stay Aligned

- Diagnosis interpolation semantics in `gc-diagnosis.js` and diagnosis docs.
- Metric unit of analysis in UI labels (choice-level vs problem-level).
- CO label formatting (`CO1`, `CO2`, ...).
- Test invariants in `tests/test-gc-simulation-invariants.js` and summary consistency tests.

## Architecture Change Rule

Any change in data model, naming semantics, or summary math must update:

1. code
2. tests
3. `REFERENCE-gc-model-semantics.md`
4. any affected principle docs
