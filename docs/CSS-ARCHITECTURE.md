# CSS Architecture

This project uses plain CSS with a layered import structure.

## File order
`css/main.css` imports in this order:
1. `tokens.css`
2. `base.css`
3. `layout.css`
4. `components.css`
5. `utilities.css`
6. `themes.css`
7. `pages.css`

Keep this order stable unless there is a clear cascade reason.

## Responsibilities
- `tokens.css`: design tokens (`--paper`, `--ink-*`, font families, semantic font sizes `--fs-*`, and viz tokens `--viz-*`)
- `base.css`: reset and element defaults
- `layout.css`: global layout primitives (`main`, `section`, wrappers)
- `components.css`: reusable UI components (cards, nav blocks, buttons, shared module UI)
- `utilities.css`: small utility classes and shared keyframes
- `themes.css`: theme overrides using token reassignment
- `pages.css`: page/module-specific styles

## Theming
- Default values are in `:root` in `tokens.css`
- Optional theme overrides use `[data-theme='...']` in `themes.css`
- Active theme is applied globally by `theme.config.js` + `js/theme-bootstrap.js`
- Change only `window.PLATOSCAVE_THEME` in `theme.config.js` to switch the whole site
- Theme names are defined in `css/themes.css` (for example: `high-contrast`, `urban-grid*`, `decision-collision*`, `new-yorker`)

## JS/SVG styling contract
- `gc-viz.js` reads visual token values from CSS custom properties with fallback values
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
