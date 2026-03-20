---
id: GUIDE-architecture
type: GUIDE
title: Front-End Architecture Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE, REFERENCE-gc-model-semantics, REFERENCE-gc-viz-typography, CSS-ARCHITECTURE]
tags: [architecture, frontend]
load_when: [feature_work, gc_logic_changes]
do_not_load_when: [copy_only_changes]
token_cost_estimate: medium
---

# Front-End Architecture Guide

## Layers

- HTML: structure and script wiring.
- CSS: layered files via `css/main.css`.
- JS logic: `gc-simulation.js`, `gc-scoring.js`, `gc-diagnosis.js`, `gc-viz.js`, `gc-viz-config.js`.
- JS page wiring: Assess and Explorer scripts under `modules/garbage-can/`.

## GC Flow

Assess:
1. collect questionnaire responses
2. score to structures and load
3. map `energyLoad` to `problemIntensity`
4. run async simulation
5. render visualization and summaries

Explorer:
1. direct parameter selection
2. diagnosis preview
3. async simulation run/replay
4. visualization and summaries

## GC Viz architecture contract

1. Simulation returns renderer metadata (`meta.choices`, `meta.problems`, `meta.periods`).
2. `gc-viz.js` reads dimensions from simulation metadata/defaults instead of hardcoded simulation globals.
3. Visualization typography is controlled by CSS tokens and classes (see `docs/20-reference/REFERENCE-gc-viz-typography.md`), not inline D3 font attrs.
4. CO event semantics are computed from a shared delta function and reused by legend + motion rendering to avoid drift.
5. Node imports of `gc-simulation.js` must be side-effect free; validation runs only when executed directly.

## Alignment contract

Any change to model semantics must update:
1. code
2. tests
3. `docs/20-reference/REFERENCE-gc-model-semantics.md`
