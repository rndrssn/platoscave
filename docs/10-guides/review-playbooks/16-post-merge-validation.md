---
id: GUIDE-16-post-merge-validation
type: GUIDE
title: Post-Merge Validation Playbook
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

# Post-Merge Validation Playbook

## Scope

Quick confidence checks immediately after merge/deploy.

## Check

- Critical paths load and function on target environments.
- No console/runtime errors on key flows.
- Monitoring/alerts stable after release.
- No regressions in navigation, forms, and primary interactions.

## Report

- Confirmed checks passed.
- Any regressions with owner and mitigation timeline.

## Verify

- Run a small deterministic smoke matrix (desktop/mobile + key pages).
