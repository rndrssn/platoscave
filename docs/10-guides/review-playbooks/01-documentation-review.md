---
id: GUIDE-01-documentation-review
type: GUIDE
title: Documentation Review Playbook
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

# Documentation Review Playbook

## Scope

Repository docs quality, correctness, freshness, and developer usability.

## Check

- Source-of-truth alignment with code/tests.
- Broken paths/commands/version drift.
- Missing prerequisites and ambiguous setup steps.
- Contradictions across docs.
- Missing decision records for non-obvious architecture choices.

## Report

- Incorrect instructions (Must if they break setup/release).
- Outdated commands/paths (Should unless blocking).
- Redundant or conflicting docs (Should).
- Missing ownership/update cadence fields (Could).

## Verify

- Execute documented commands.
- Validate links and referenced files exist.
- Ask: could a new contributor succeed from docs alone?
