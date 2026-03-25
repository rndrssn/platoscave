---
id: GUIDE-05-architecture-review
type: GUIDE
title: Architecture Review Playbook
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

# Architecture Review Playbook

## Scope

System structure, boundaries, dependency direction, and changeability.

## Check

- Module boundaries and ownership clarity.
- Data/control flow coherence.
- Single-responsibility and layering discipline.
- Hotspots of coupling and duplicated logic.
- Evolution path: extensibility and migration safety.

## Report

- Boundary violations causing regressions (Must).
- Coupling that blocks safe change (Should).
- Opportunities for clearer seams/contracts (Could).

## Verify

- Provide current-state map and target-state map.
- Include phased migration with rollback points.
