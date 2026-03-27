---
id: GUIDE-09-devops-cicd-review
type: GUIDE
title: DevOps and CI/CD Review Playbook
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

# DevOps and CI/CD Review Playbook

## Scope

Build/test/release pipeline quality, reproducibility, and deployment safety.

## Check

- Required checks enforced pre-merge.
- Branch/release strategy consistency.
- Artifact reproducibility and cache correctness.
- Rollback strategy and release observability.
- Global dependency-source migrations are enforced repo-wide (no partial rollouts).

## Report

- Missing mandatory gates (Must).
- Slow/flaky pipeline stages (Should).
- Manual steps that should be automated (Could).

## Verify

- Trace one change from PR to production.
- Validate rollback execution path and ownership.
