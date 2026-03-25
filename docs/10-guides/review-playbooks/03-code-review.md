---
id: GUIDE-03-code-review
type: GUIDE
title: Code Review Playbook
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

# Code Review Playbook

## Scope

HTML, CSS, JS implementation quality, safety, and maintainability.

## Check

- Correctness and edge-case handling.
- Readability, cohesion, and duplication.
- Security-sensitive DOM usage and data handling.
- Performance pitfalls and unnecessary complexity.
- Standards adherence and consistency with project patterns.

## Report

- Functional bugs/regressions (Must).
- Unsafe patterns (Must).
- Fragile logic / hidden coupling (Should).
- Refactor opportunities with measurable payoff (Could).

## Verify

- Provide file/function-level evidence.
- Require tests or smoke checks for each Must/Should fix.
