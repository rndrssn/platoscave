---
id: GUIDE-llm-review-playbooks-index
type: GUIDE
title: LLM Review Playbooks Index
status: ACTIVE
created: 2026-03-25
updated: 2026-04-19
owner: Robert Andersson
relates_to: [CORE, CORE-quality-gates, GUIDE-contributing, GUIDE-testing-and-release]
tags: [llm, review, playbook, quality]
load_when: [when-running-reviews, when-planning-refactors]
do_not_load_when: []
token_cost_estimate: low
---

# LLM Review Playbooks Index

Use these playbooks when an agent is asked to perform a review. They are optimized for concrete findings, severity prioritization, and actionable refactor plans.

## Required output contract for every review

1. Findings first, ordered by severity (`Must`, `Should`, then `Could`).
2. Every finding includes:
- file/selector/function/location
- issue description
- why it matters
- exact fix recommendation
- verification method
3. No coding unless explicitly requested.
4. If user asks to discuss/plan/confirm understanding, return analysis only and wait for explicit proceed.

## Severity mapping (MoSCoW)

- Critical -> `Must`
- High -> `Must`
- Medium -> `Should`
- Low -> `Could`
- Explicitly deferred/non-goal -> `Won't` (with rationale and review date)

## Playbooks

- `01-documentation-review.md`
- `02-content-design-review.md`
- `03-code-review.md`
- `04-test-coverage-review.md`
- `05-architecture-review.md`
- `06-ux-review.md`
- `07-interaction-design-review.md`
- `08-ui-design-system-review.md`
- `09-devops-cicd-review.md`
- `10-security-review.md`
- `11-performance-review.md`
- `12-accessibility-review.md`
- `13-observability-reliability-review.md`
- `14-api-schema-contract-review.md`
- `15-release-readiness-review.md`
- `16-post-merge-validation.md`
- `17-information-architecture-review.md`

## Shared finding template

```md
### <Short finding title>
- Priority: Must | Should | Could | Won't
- Location: <path:line | selector | function>
- Issue: <what is wrong>
- Impact: <risk / UX / reliability / maintenance cost>
- Fix: <specific change>
- Verify: <test/smoke check>
```

## Shared review checklist

- Scope is explicit and bounded.
- Assumptions are listed.
- Findings are evidence-backed (no speculation).
- Refactor plan has sequence, owner, and rollback notes.
