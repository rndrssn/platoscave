---
id: GUIDE-08-ui-design-system-review
type: GUIDE
title: UI Design System Review Playbook
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

# UI Design System Review Playbook

## Scope

Visual consistency, token usage, component reuse, and style drift control.

## Check

- Color, typography, spacing consistency against tokens.
- Icon style/size alignment and rendering approach.
- Component variants and repeated custom one-offs.
- Page-to-page visual drift and ad-hoc overrides.

## Report

- Token bypasses that fragment visual system (Should).
- Accessibility-threatening contrast/state issues (Must).
- Component consolidation opportunities (Could).

## Verify

- Side-by-side page comparison.
- Token-level diff for hardcoded values.
