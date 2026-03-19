---
id: REFERENCE-gc-model-semantics
type: REFERENCE
title: Garbage Can Model Semantics Reference
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [PRINCIPLE-organised-anarchy-questions, PRINCIPLE-organised-anarchy-diagnosis, PRINCIPLE-coding-standards]
tags: [garbage-can, semantics, taxonomy, ontology]
---

# Garbage Can Model Semantics Reference

## Purpose

Define canonical terminology and metric semantics used across:

- narrative and taxonomy pages
- assess and explorer interfaces
- simulation summaries and labels
- diagnosis text

## Canonical Entities

- Problem: issue seeking closure.
- Choice opportunity (CO): forum where decisions could be made.
- Participant/decision maker: allocates energy to accessible choice opportunities.
- Energy: attention/capacity spent toward closing a choice opportunity.

## Parameter Semantics

- `problemIntensity`: burden per attached problem (`light` | `moderate` | `heavy`).
- `problemInflow`: arrival schedule of problems over iterations (`light` | `moderate` | `heavy`).
- `decisionStructure`: who can allocate energy to which choice opportunities.
- `accessStructure`: which problems can attach to which choice opportunities.

Note: scoring output still uses `energyLoad`; Assess maps `energyLoad -> problemIntensity`.

## Outcome Semantics

### Choice-level descriptors (canonical GC decision styles)

- Deliberation: choice opportunity closes after sustained engagement.
- Oversight: choice opportunity closes with no problem attached.
- Flight: choice opportunity closes after problems flee.

These are reported as choice-style shares in the simulation summary.

### Problem-level outcomes (interpretive extension)

- Resolved: genuinely closed at a choice opportunity.
- Displaced: left attached context when a choice opportunity closed without resolving it.
- Adrift: detached or never attached to a resolvable choice opportunity.
- In choice opportunity: still attached to an active choice opportunity at the final iteration.
- Never entered: not yet active by final iteration (depends on inflow schedule).

These are reported as mean counts out of 20 problems.

## Labeling Rules

- Always keep choice-level and problem-level metrics in separate sections.
- Do not label choice outcomes as problem resolution rates.
- Use CO labels as `CO1`, `CO2`, ... (no hyphen form).

## Diagnosis Interpolation Contract

- `getDiagnosis(decisionStructure, accessStructure, unresolvedShare)`
- `unresolvedShare` is a problem-level proportion in [0, 1].
- Diagnosis copy may interpolate `{unresolved}` and `{resolved}` percentages.

## Source of Truth

Implementation source files:

- `gc-simulation.js`
- `gc-scoring.js`
- `gc-diagnosis.js`
- `gc-viz.js`

If docs conflict with these files and tests, update docs immediately.
