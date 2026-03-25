---
id: GUIDE-02-content-design-review
type: GUIDE
title: Content Design Review Playbook
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

# Content Design Review Playbook

## Scope

Clarity, consistency, information architecture, and tone across product copy.

## Check

- Terminology consistency across pages/components.
- Heading hierarchy and scanability.
- CTA clarity and user intent fit.
- Redundancy, verbosity, ambiguous wording.
- Error/help text quality and actionability.

## Report

- Terminology conflicts (Must if user-facing confusion risk).
- Missing hierarchy/signposting (Should).
- Weak microcopy in forms/errors (Should).
- Style/tone drift from system voice (Could).

## Verify

- Run a first-time-user reading pass.
- Validate that critical tasks can be completed without interpretation gaps.
