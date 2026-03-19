---
id: REFERENCE-css-architecture-detail
type: REFERENCE
title: CSS Architecture Detailed Reference
status: ACTIVE
created: 2026-03-15
updated: 2026-03-19
owner: Robert Andersson
relates_to: [REFERENCE-css-architecture, PRINCIPLE-design-system]
tags: [css, architecture, layers, themes]
load_when: [css_changes, theme_changes]
do_not_load_when: [pure_logic_changes]
token_cost_estimate: low
---

# CSS Architecture

This project uses plain CSS with a layered import structure.

## File order
`css/main.css` imports in this order:
1. `fonts.css`
2. `tokens.css`
3. `base.css`
4. `layout.css`
5. `components.css`
6. `utilities.css`
7. `themes.css`
8. `gc-viz.css`
9. `pages.css`

Keep this order stable unless there is a clear cascade reason.

## Responsibilities
- `tokens.css`: design tokens (`--paper`, `--ink-*`, font families, semantic font sizes `--fs-*`, and viz tokens `--viz-*`)
- `base.css`: reset and element defaults
- `layout.css`: global layout primitives (`main`, `section`, wrappers)
- `components.css`: reusable UI components (cards, nav blocks, buttons, shared module UI)
- `utilities.css`: small utility classes and shared keyframes
- `themes.css`: theme overrides using token reassignment
- `gc-viz.css`: GC visualization-specific styles and typography classes
- `pages.css`: page/module-specific styles

## Theming
- Default values are in `:root` in `tokens.css`
- Optional theme overrides use `[data-theme='...']` in `themes.css`
- Active theme is applied globally by `theme.config.js` + `js/theme-bootstrap.js`
- Change only `window.PLATOSCAVE_THEME` in `theme.config.js` to switch the whole site
- Theme names are defined in `css/themes.css` (for example: `high-contrast`, `urban-grid*`, `decision-collision*`, `new-yorker`)

## JS/SVG styling contract
- `gc-viz.js` reads visual token values from CSS custom properties with fallback values
- SVG text styling for GC viz is class-based in CSS (`gc-viz.css`), not inline font attributes in D3
- Keep behavioral simulation constants separate from visual constants
- Keep intentional visual differences explicit (`VIZ_LAYOUT.empty` vs `VIZ_LAYOUT.live`)

## Naming guidance
- Keep existing class names unless refactoring a specific component
- New component classes should be BEM-ish where useful
- Prefer semantic names over visual names

## Change checklist
1. Update tokens first if change is visual-system-wide
2. Avoid inline style mutations in app JS; prefer class/`hidden` toggles
3. Keep page-specific rules out of shared component files
4. Run tests after each refactor phase:
   - `node tests/test-gc-scoring.js`
   - `node tests/test-gc-scoring-12.js`
   - `node tests/test-gc-diagnosis.js`
   - `node tests/test-navigation-links.js` (requires local server)
