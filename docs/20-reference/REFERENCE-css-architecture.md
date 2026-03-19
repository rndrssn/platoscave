---
id: REFERENCE-css-architecture
type: REFERENCE
title: CSS Architecture Reference
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [CORE, PRINCIPLE-design-system, CSS-ARCHITECTURE]
tags: [css, architecture, reference]
load_when: [ui_changes, css_changes]
do_not_load_when: [pure_logic_changes]
token_cost_estimate: low
---

# CSS Architecture Reference

## Layer order

`css/main.css` imports layers in order:
1. tokens
2. base
3. layout
4. components
5. utilities
6. themes
7. pages

## Responsibilities

- `tokens.css`: base design tokens
- `themes.css`: theme overrides
- `base.css`: reset + global primitives
- `layout.css`: layout primitives
- `components.css`: reusable components
- `utilities.css`: utility/keyframe helpers
- `pages.css`: page-specific overrides

## Rules

- Keep selector ownership in one layer.
- Prefer tokens over literals.
- Keep page-specific styling out of shared component layers.
