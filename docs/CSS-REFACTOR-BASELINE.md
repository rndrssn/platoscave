# CSS Refactor Baseline Checklist

Purpose: provide a stable visual and functional baseline for incremental CSS architecture refactoring.

## Branch and rollback safety
- Working branch: `experiment/theme-system`
- Base branch: `develop`
- Strategy: small phase commits, revert per phase if needed

## Critical pages and states to verify each phase
- Home: `/index.html`
- Modules index: `/modules/index.html`
- Colophon: `/colophon/index.html`
- Garbage Can module landing: `/modules/garbage-can/index.html`
- Garbage Can assess flow (before submission): `/modules/garbage-can/assess/index.html`
- Garbage Can assess flow (after submission/results visible)
- Garbage Can explorer: `/modules/garbage-can/explorer/index.html`
- Garbage Can taxonomy: `/modules/garbage-can/taxonomy/index.html`

## Functional checks
- Main navigation works on desktop and mobile widths
- Active nav link styling appears only on current page
- Breadcrumb current/active item uses distinct style
- Contact links (including LinkedIn and GitHub) use expected link colors
- Assessment form validation error visibility still works
- Simulation visualization still renders and animates

## Contrast checks
- Body text vs paper background remains readable
- Link states (default/hover/active) remain distinguishable
- Metadata text (mono faint labels) remains legible

## Test commands
- `node tests/test-gc-scoring.js`
- `node tests/test-gc-scoring-12.js`
- `node tests/test-gc-diagnosis.js`
- `node tests/test-navigation-links.js`

## Phase checkpoint rule
After each phase:
1. Run test commands
2. Manually verify critical pages and states
3. Commit with phase label (`phase-1`, `phase-2`, ...)
