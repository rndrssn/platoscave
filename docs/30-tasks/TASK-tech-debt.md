---
id: TASK-tech-debt
type: TASK
title: Active Technical Debt Queue
status: IN-PROGRESS
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [TECH-DEBT-tracker, GUIDE-architecture]
tags: [task, tech-debt]
load_when: [debt_work]
do_not_load_when: [unrelated_feature_work]
token_cost_estimate: low
---

# Active Technical Debt Queue

Use `docs/30-tasks/TECH-DEBT-tracker.md` as the detailed tracker.

This task file is the retrieval target for agents. Keep it short and current.

## Current items

- Re-evaluate whether `gc-simulation.js` file split is still needed after metadata decoupling from `gc-viz.js`.
- Continue reducing duplicate policy text in docs.
