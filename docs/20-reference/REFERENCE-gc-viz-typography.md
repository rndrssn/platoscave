---
id: REFERENCE-gc-viz-typography
type: REFERENCE
title: GC Viz Typography and Sizing Contract
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [TASK-feature-garbage-can, PRINCIPLE-coding-standards]
tags: [gc-viz, typography, css-tokens, architecture]
load_when: [gc_feature_work]
do_not_load_when: [unrelated_tasks]
token_cost_estimate: low
---

# GC Viz Typography and Sizing Contract

## Goal

Keep visualization typography easy to change without hunting through D3 inline attributes.

## Source of truth

Typography and spacing tokens live in `css/tokens.css`:

- `--viz-fs-track-label`
- `--viz-fs-track-end`
- `--viz-fs-label`
- `--viz-fs-legend`
- `--viz-fs-co-label`
- `--viz-fs-top-legend`
- `--viz-lh-top`
- `--viz-lh-legend`
- `--viz-scale`
- `--viz-scale-mobile`

Component styles live in `css/gc-viz.css` and are imported from `css/main.css`.

## Rules

1. Do not set SVG text typography via inline D3 `.attr('font-size')` or `.attr('font-family')` in `gc-viz.js`.
2. Use CSS classes on SVG text nodes:
   - `.gc-viz__track-label`
   - `.gc-viz__track-end`
   - `.gc-viz__top-legend`
   - `.gc-viz__legend-text`
   - `.gc-viz__choice-label`
3. Keep visual counts (`choices`, `problems`, `periods`) sourced from simulation metadata/defaults, not from hardcoded globals in `gc-viz.js`.

## Runtime scaling (optional)

Set preset scale via SVG data attribute:

```html
<svg id="viz-svg" data-viz-scale="compact"></svg>
```

Supported presets:

- `compact`
- `default`
- `large`

Or pass `textScale` option to `drawEmptyState(options)` / `drawViz(simResult, options)`.
