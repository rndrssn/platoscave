---
id: GUIDE-07-interaction-design-review
type: GUIDE
title: Interaction Design Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-04-25
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

### Repeat-pattern behaviour parity

When the codebase already has one instance of a pattern (force graph, animation, simulation, slider-driven viz), a new instance must replicate the behavioural conventions of the precedent — not just its visual style. Visual parity without behavioural parity produces components that look the same but feel inconsistent.

For force-directed graphs specifically, check the precedent ([modules/experience-skill-graph/index.html](modules/experience-skill-graph/index.html)) for these behaviours and verify the new graph honours each:

- [ ] **Stable layout via banded forces.** `forceX` / `forceY` per category produces predictable layouts across loads. Centre + collide alone produces a different blob each time.
- [ ] **Position preservation across resize.** State saved by node id, rescaled to the new dimensions, restored on rerender. Not: full simulation reset.
- [ ] **Ambient nudge.** Low-amplitude periodic alpha kick keeps the graph "alive" instead of frozen after settling. Skipped under `prefers-reduced-motion`.
- [ ] **Mobile label compaction.** Long labels mapped to short forms below ~760px; font-size adjusted; layout aspect-ratio shifted (taller, narrower).
- [ ] **Coarse-pointer hit areas.** Larger invisible circles overlaid for touch; drag-vs-tap distinguished by movement threshold.
- [ ] **Fallback messaging.** Visible fallback paragraph when D3 fails to load, instead of silent bail.
- [ ] **Reduced-motion path.** Run the simulation synchronously then stop; do not animate.

For animations driven by `d3.timer` or `requestAnimationFrame`, also check:

- [ ] Active timer is held in a variable and stopped before re-running, to avoid duplicate timers stacking on resize.
- [ ] Reduced-motion fallback renders a single representative static frame.

## Report

- Inconsistent behavior causing errors/confusion (Must).
- Behavioural parity gaps with established precedent for the same pattern (Should).
- State/motion inconsistencies across components (Should).
- Micro-interaction polish improvements (Could).

## Verify

- Keyboard-only traversal.
- Reduced-motion and small-screen interaction pass.
- For repeat patterns: open the precedent and the new instance side by side, exercise the same gestures, confirm parity.
