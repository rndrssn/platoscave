---
id: GUIDE-13-observability-reliability-review
type: GUIDE
title: Observability and Reliability Review Playbook
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

# Observability and Reliability Review Playbook

## Scope

Error visibility, diagnostics, and operational reliability signals.

## Check

- Error handling paths and user-facing recovery.
- Logging quality and actionable diagnostics.
- Monitoring/alert assumptions in CI/CD/release flow.
- Reliability risks from unhandled async or race conditions.

## Report

- Silent failure paths (Must).
- Missing diagnostics for incident triage (Should).
- Signal-to-noise improvements (Could).

## Verify

- Trigger representative failures and confirm visibility/recovery.
