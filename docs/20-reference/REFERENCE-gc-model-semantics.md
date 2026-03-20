---
id: REFERENCE-gc-model-semantics
type: REFERENCE
title: Garbage Can Model Semantics Reference
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE, GUIDE-architecture, PRINCIPLE-organised-anarchy-diagnosis]
tags: [garbage-can, semantics, taxonomy, ontology]
load_when: [gc_logic_changes, copy_changes]
do_not_load_when: [unrelated_tasks]
token_cost_estimate: medium
---

# Garbage Can Model Semantics Reference

## Canonical entities

- Problem
- Choice opportunity (CO)
- Decision maker/participant
- Energy

## Parameter semantics

- `problemIntensity`: burden per attached problem
- `problemInflow`: problem arrival schedule
- `decisionStructure`: decision maker access to choices
- `accessStructure`: problem access to choices

Note: scoring returns `energyLoad`; Assess maps it to `problemIntensity`.

## Outcome semantics

Choice-level descriptors:
- Deliberation
- Oversight
- Flight

Problem-level outcomes:
- Resolved
- Displaced
- Adrift
- In choice opportunity
- Never entered

Renderer-support metrics:
- `choiceResolvedPerCoMean` (Monte Carlo mean resolved problems per CO, length = number of COs)

## Labeling rules

1. Keep choice-level and problem-level metrics in separate sections.
2. Do not label choice-style shares as problem resolution rates.
3. Use CO labels as `CO1`, `CO2`, ...

## Diagnosis contract

- `getDiagnosis(decisionStructure, accessStructure, unresolvedShare)`
- `unresolvedShare` is in [0, 1]
- diagnosis text may interpolate `{resolved}` and `{unresolved}`

## Source-of-truth files

- `gc-simulation.js`
- `gc-scoring.js`
- `gc-diagnosis.js`
- `gc-viz.js`
- `gc-viz-config.js`

## Renderer metadata contract

- Simulation results include `meta` with:
  - `choices`
  - `problems`
  - `periods`
- `gc-viz.js` should consume these values (or simulation defaults) rather than hardcoded module globals.
