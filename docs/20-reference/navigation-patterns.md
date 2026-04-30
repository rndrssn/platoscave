# Frontend Navigation Patterns

This document defines the canonical link and navigation patterns used across the frontend.

## 1. Global Navigation
- Scope: all pages.
- Pattern at runtime: `Notes`, `Articles`, `My Experience`, plus a `Modules` launcher trigger.
- Home path is provided by the title link (`To the Bedrock`).
- Runtime normalization is handled by `js/nav-controller.js` from fallback HTML links.
- Active item must include:
  - visual class (`nav-link--active`)
  - semantic state (`aria-current="page"`)
- Modules launcher contract:
  - trigger is a button (`.nav-modules-toggle`) with `aria-expanded` + `aria-controls`
  - submenu uses `.nav-modules-submenu`
  - submenu includes `All modules` and live module links
  - `coming-soon` modules are intentionally excluded from the submenu
- Sticky contract:
  - only `.main-nav` pins after scrolling past title height (`.main-nav--pinned`)
  - title row (`.nav-title`) remains in document flow
- Mobile requirements:
  - target size at least `44x44px`
  - menu toggle buttons (`.nav-mobile-toggle`, `.nav-modules-toggle`) must meet the same target size

## 2. Module Context + Local Section Navigation
- Scope: module pages and module sub-pages.
- Pattern:
  - parent context line (module title and context)
  - local section nav (for example `01`, `02`, `03`)
- Canonical root rule:
  - local section `01` must live at module root: `/modules/<slug>/`
  - active root section link must be `href="./"` with `aria-current="page"`
  - do not make `/modules/<slug>/` a hard redirect to a nested section page
- Markup:
  - parent context link uses `.module-context-link`
  - section nav uses `.module-sub-nav`
  - current section link uses `aria-current="page"`
- Mobile behavior:
  - section links may wrap to additional rows
  - no horizontal-only dependency for discoverability

Exception:
- `modules/experience-skill-graph/` and `modules/experience-skill-graph/cv/` use a dedicated CV/Skills shell with an internal view switcher (`Skills Graph` ↔ `CV`) and are intentionally outside the standard module breadcrumb/sub-nav contract.

## 3. Section Footer Navigation
- Scope: module sub-pages.
- Pattern: destination-explicit sibling progression.
- Markup:
  - `<nav class="module-footer-nav module-footer-nav--section" aria-label="Section navigation">`
  - labels include destination context (`Previous: <destination>`, `Next: <destination>`)
- Mobile behavior:
  - compact labels are allowed (`Previous`, `Next`) with full context in `aria-label`

## 4. Results Navigation
- Scope: pages with in-page result sections.
- Pattern: in-page anchor links (for example Diagnosis, Positioning, GC Simulation).
- Active item uses:
  - `results-nav-link--active`
  - `aria-current="page"`
- Note: some pages may intentionally omit a results mini-nav to reduce cognitive load.

## 5. Link States
- Action/content links should support:
  - default
  - hover
  - focus-visible
  - visited (where meaningful)
- Footer current-page labels should render as non-links when self-referential.

## 6. Site Structure Semantics
- `Home` (`/`): identity and orientation.
- `Modules` (`/modules/`): interactive artifacts with local section numbering inside each module (`01`, `02`, ...).
- `Notes` (`/notes/`): text-first narrative context and reflections.
- `Articles` (`/articles/`): long-form essays and argument-driven writing.
- `My Experience` (`/skills/` -> `/modules/experience-skill-graph/`): top-level utility destination in primary navigation with internal view switcher (`Skills Graph` <-> `CV`).
- `Site Notes` (`/colophon/`): utility/meta page (footer-level destination).

## 7. QA Checklist
- All active navigation elements expose `aria-current="page"`.
- No navigation target has a touch area below `44x44px`.
- Navigation remains usable at `320px` viewport width.
- Live module root pages keep local section `01` active at `href="./"` (no root meta refresh).
- Primary nav sticks correctly as link row only (title must not pin with it).
- Navigation link test suite passes before deployment.
