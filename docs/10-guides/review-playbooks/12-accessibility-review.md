---
id: GUIDE-12-accessibility-review
type: GUIDE
title: Accessibility Review Playbook
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

# Accessibility Review Playbook

## Scope

WCAG-aligned baseline for semantics, keyboard support, and assistive tech compatibility.

## Check

- Landmark/headings/form labels and control semantics.
- Keyboard operability and visible focus.
- Contrast, motion sensitivity, and status announcements.
- ARIA usage correctness (no redundant/misleading ARIA).

## Report

- Task-blocking accessibility failures (Must).
- Important but non-blocking gaps (Should).
- Progressive enhancements (Could).

## Verify

- Keyboard-only smoke test.
- Automated a11y checks + manual spot check.
