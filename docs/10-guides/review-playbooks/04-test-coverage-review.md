---
id: GUIDE-04-test-coverage-review
type: GUIDE
title: Test Coverage Review Playbook
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

# Test Coverage Review Playbook

## Scope

Adequacy of unit/integration/e2e coverage and regression protection.

## Check

- High-risk logic coverage.
- Contract/boundary/error-path tests.
- Accessibility and navigation baseline checks.
- CI gating alignment with required tests.

## Report

- Untested critical paths (Must).
- Missing regressions for previously fixed bugs (Should).
- Weak assertions/false-confidence tests (Should).
- Flaky or redundant tests (Could).

## Verify

- Map risks to specific test files.
- Propose exact new tests with expected assertions.
