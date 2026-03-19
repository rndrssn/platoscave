---
id: TASK-current-work
type: TASK
title: Current Work Entry Point
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE-loading-rules, GUIDE-testing-and-release]
tags: [task, current, handoff]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Current Work Entry Point

Primary task source is `HANDOFF.md` when present.

If `HANDOFF.md` is missing:
1. use explicit user request as task source
2. state assumptions before implementation
3. do not load archive docs unless needed
