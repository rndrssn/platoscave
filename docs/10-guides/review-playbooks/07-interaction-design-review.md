---
id: GUIDE-07-interaction-design-review
type: GUIDE
title: Interaction Design Review Playbook
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

# Interaction Design Review Playbook

## Scope

Behavioral consistency of controls, states, transitions, and affordances.

## Check

- Consistent hover/focus/active/disabled/error states.
- Control semantics (button vs link) and affordance clarity.
- Motion purpose, timing consistency, reduced-motion support.
- Predictable keyboard interaction and focus management.

## Report

- Inconsistent behavior causing errors/confusion (Must).
- State/motion inconsistencies across components (Should).
- Micro-interaction polish improvements (Could).

## Verify

- Keyboard-only traversal.
- Reduced-motion and small-screen interaction pass.
