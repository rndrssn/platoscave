---
id: PRINCIPLE-design-system
type: PRINCIPLE
title: To the Bedrock — Design System (Runtime)
status: ACTIVE
created: 2026-03-15
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE-style, REFERENCE-css-architecture, PRINCIPLE-responsive]
tags: [design, ux, runtime]
load_when: [designing, ui_changes]
do_not_load_when: [pure_logic_changes]
token_cost_estimate: medium
---

# To the Bedrock — Design System (Runtime)

This is the concise runtime design contract.

Full historical rationale/examples:
- `docs/90-archive/legacy-principles/PRINCIPLE-design-system-full.md`

## Core visual direction

- Editorial scientific notebook feel.
- Typography-led hierarchy.
- Quiet, precise interfaces over dashboard styling.

## Runtime rules

1. Reuse existing component patterns before introducing new ones.
2. Keep interaction hierarchy explicit (primary action, secondary action, navigation, labels).
3. Use tokens/themes from the CSS architecture; do not bypass token layers.
4. Ensure responsive behavior on mobile/tablet/desktop for all changed views.
5. Keep motion meaningful and compatible with reduced-motion preferences.
6. Preserve semantic precision in model-driven copy and labels.

## Content and semantics rule

For Garbage Can surfaces, labels and copy must remain aligned with:
- `docs/20-reference/REFERENCE-gc-model-semantics.md`
