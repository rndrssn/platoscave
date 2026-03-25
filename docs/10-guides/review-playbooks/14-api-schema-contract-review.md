---
id: GUIDE-14-api-schema-contract-review
type: GUIDE
title: API and Schema Contract Review Playbook
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

# API and Schema Contract Review Playbook

## Scope

Contracts between modules/services/components and data schemas.

## Check

- Contract clarity and backward compatibility.
- Error contracts and fallback behavior.
- Validation and parsing strictness.
- Versioning/deprecation strategy.

## Report

- Breaking contract risks (Must).
- Ambiguous/under-specified contracts (Should).
- Documentation and schema tightening (Could).

## Verify

- Contract tests for happy path + malformed inputs + version drift.
