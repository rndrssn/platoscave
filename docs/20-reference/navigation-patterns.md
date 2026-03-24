---
id: REFERENCE-navigation-patterns
type: REFERENCE
title: Frontend Navigation Patterns
status: ACTIVE
created: 2026-03-22
updated: 2026-03-24
owner: Robert Andersson
relates_to: [CORE, CORE-quality-gates, REFERENCE-css-architecture]
tags: [navigation, ia, accessibility, responsive]
load_when: [navigation_changes, ia_changes]
do_not_load_when: [pure_logic_changes]
token_cost_estimate: low
---

# Frontend Navigation Patterns

This document defines the canonical link and navigation patterns used across the frontend.

## 1. Global Navigation
- Scope: all pages.
- Pattern: `Home`, `Modules`, `Notes`.
- Active item must include:
  - visual class (`nav-link--active`)
  - semantic state (`aria-current="page"`)
- Mobile requirements:
  - target size at least `44x44px`
  - menu toggle button must meet the same target size

## 2. Module Context + Local Section Navigation
- Scope: module pages and module sub-pages.
- Pattern:
  - parent context line (for example `03 · The Garbage Can Model`)
  - local section nav (for example `03.01`, `03.02`, `03.03`, `03.04`, `03.05`)
- Markup:
  - parent context link uses `.module-context-link`
  - section nav uses `.module-sub-nav`
  - current section link uses `aria-current="page"`
- Mobile behavior:
  - section links may wrap to additional rows
  - no horizontal-only dependency for discoverability

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
- `Modules` (`/modules/`): interactive artifacts (numbered `xx`, `xx.yy`).
- `Notes` (`/notes/`): text-first narrative context and reflections.
- `Site Notes` (`/colophon/`): utility/meta page (footer-level destination).

## 7. QA Checklist
- All active navigation elements expose `aria-current="page"`.
- No navigation target has a touch area below `44x44px`.
- Navigation remains usable at `320px` viewport width.
- Navigation link test suite passes before deployment.
