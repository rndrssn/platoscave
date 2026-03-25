---
id: GUIDE-15-release-readiness-review
type: GUIDE
title: Release Readiness Review Playbook
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

# Release Readiness Review Playbook

## Scope

Final quality gate before shipping.

## Check

- Required automated tests pass.
- Must/Should findings status and sign-offs.
- User-facing change notes/documentation updates.
- Rollback and on-call ownership clarity.

## Report

- Any unresolved Must items (block release).
- Unresolved Should items (document risk acceptance).
- Deferred Could items (tracked follow-up).

## Verify

- Produce a ship/no-ship decision with explicit rationale.
