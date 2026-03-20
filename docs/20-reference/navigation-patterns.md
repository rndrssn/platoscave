# Frontend Navigation Patterns

This document defines the canonical link and navigation patterns used across the frontend.

## 1. Global Navigation
- Scope: all pages.
- Pattern: `Home`, `Index`.
- Active item must include:
  - visual class (`nav-link--active`)
  - semantic state (`aria-current="page"`)
- Mobile requirements:
  - target size at least `44x44px`
  - hamburger button must meet the same target size

## 2. Breadcrumbs
- Scope: module pages.
- Pattern: `Home / Index / Module / Current page`.
- Markup:
  - `<nav aria-label="Breadcrumb">`
  - ordered list structure
  - current item rendered as text with `aria-current="page"`
- Mobile truncation strategy:
  - breadcrumb tokens are ellipsized (`text-overflow: ellipsis`)
  - horizontal scroll is allowed when path length exceeds viewport

## 3. Module Sub-navigation
- Scope: module sub-pages (for example Garbage Can narrative/taxonomy/explorer/assess).
- Pattern: sibling links with active state.
- Active item must include `aria-current="page"`.
- Do not disable pointer events on active links.
- Mobile behavior:
  - horizontal scroll with snap
  - explicit affordance (`Scroll →`) at the trailing edge

## 4. Results Navigation
- Scope: pages with in-page result sections.
- Pattern: in-page anchor links (for example Diagnosis, Positioning, GC Simulation).
- Active item uses:
  - `results-nav-link--active`
  - `aria-current="page"`
- Mobile behavior:
  - horizontal scroll with snap
  - explicit affordance (`Scroll →`)

## 5. Sequential Navigation
- Scope: module previous/next footer navigation.
- Use destination-explicit labels:
  - `Previous: <destination>`
  - `Next: <destination>`
- Avoid generic `Previous` / `Next` labels with no destination context.

## 6. Link States
- Action/content links should support:
  - default
  - hover
  - focus-visible
  - visited (where meaningful)
- Footer current-page labels should render as non-links when self-referential.

## 7. QA Checklist
- All active navigation elements expose `aria-current="page"`.
- No navigation target has a touch area below `44x44px`.
- Horizontal nav patterns remain operable at `320px` viewport width.
- Navigation link test suite passes before deployment.
