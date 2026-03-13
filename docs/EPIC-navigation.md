---
id: EPIC-navigation
type: EPIC
title: To the Bedrock — Navigation Specification
status: IN-PROGRESS
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [VISION-product, PRINCIPLE-design-system]
tags: [navigation, ux, structure, urls]
---

# To the Bedrock — Navigation Specification

## Pattern: The Journal Index

Navigation follows the metaphor of a **field notebook table of contents** — numbered, spare, typographically led. The structure is flat and lateral, not hierarchical. There is no deep nesting, no dropdowns, no mega-menus.

---

## Global Navigation Bar

Present on every page. Fixed to the top.

**Left:** Site name — *To the Bedrock* — in italic Cormorant Garamond. Links back to `/`.

**Right:** Two links only:
- `Home` — back to landing page
- `Index` — the module index page

Font: DM Mono, uppercase, `0.7rem`, `letter-spacing: 0.1em`.
Border-bottom: `1px solid var(--ink-ghost)`.
Background: `var(--paper)` — no blur, no transparency.

As the number of modules grows, module links do **not** move into the top nav. The Index page is the navigation device for modules — the top bar stays minimal permanently.

---

## The Index Page (`/modules/`)

A dedicated page that serves as the master table of contents for all modules.

### Layout

A single centered column, max-width `720px`. Generous vertical spacing. No cards, no grid — a **list**, typographically composed.

### Entry Format

Each module is a single row:

```
01 — Emergence Primer                          [Coming]
     Simple rules. Surprising patterns.

02 — Complexity Maturity Diagnostic            [Live]
     Where does your organisation sit?

03 — The Garbage Can Model                     [Coming]
     Organisational choice under ambiguity.
```

- Number and title on one line, status badge right-aligned
- One-line descriptor below in a smaller, lighter weight
- A thin `1px` rule between entries in `var(--ink-ghost)`
- Clicking the row navigates to the module
- Hover state: title shifts to `var(--rust)`, cursor pointer

### Typography

| Element | Font | Size | Style |
|---|---|---|---|
| Number `01 —` | DM Mono | `0.7rem` | uppercase, `--ink-faint` |
| Module title | Cormorant Garamond | `1.5rem` | italic, `--ink` |
| Descriptor | EB Garamond | `0.95rem` | upright, `--ink-mid` |
| Status badge | DM Mono | `0.6rem` | uppercase, `--ochre` or `--ink-faint` |

### Page Header

Above the list, a minimal header:

```
MODULES                          [count] entries
─────────────────────────────────────────────
```

Mono, faint, with a full-width `1px` rule below. No decorative elements.

---

## Individual Module Pages

Each module lives at its own URL:
```
/modules/emergence/
/modules/maturity/
/modules/garbage-can/
/modules/mix-mapper/
```

Each module page has:
- The global nav bar at top
- A **module header** section: number, title, one-paragraph framing, topic tags
- The interactive content
- A **footer nav**: `— Previous` / `Next —` in DM Mono, linking to adjacent entries in the index order. Uses the em-dash already present throughout the system — no directional arrow symbols, consistent with the no-icons rule in the design system.

The footer nav keeps the journal/sequential metaphor alive without forcing a strict reading order.

---

## Page Structure Summary

```
/
├── index.html                  ← Served at /
├── modules/
│   └── index.html              ← Served at /modules/
└── modules/
    ├── emergence/
    │   └── index.html          ← Served at /modules/emergence/
    ├── maturity/
    │   └── index.html          ← Served at /modules/maturity/
    ├── garbage-can/
    │   └── index.html          ← Served at /modules/garbage-can/
    └── mix-mapper/
        └── index.html          ← Served at /modules/mix-mapper/
```

---

## Behaviour & States

- **Active page** indicator in top nav: the current section link gets `color: var(--rust)` — no other treatment
- **Coming soon** modules on the Index page are listed but not linked — cursor default, title in `--ink-faint` rather than `--ink`
- **No 404 handling needed** for now — stubs are handled by the Coming status on the index
- **Mobile:** top nav collapses to site name only + a `MENU` text toggle in DM Mono; index page remains single column and works naturally. No hamburger icon — consistent with the no-icons rule in the design system.

---

## URL & Linking Conventions

Web servers automatically serve `index.html` when a directory is requested. Always exploit this — **never reference `index.html` explicitly in any link**.

```html
<!-- Never do this -->
<a href="index.html">Home</a>
<a href="/modules/garbage-can/index.html">Garbage Can</a>

<!-- Always do this -->
<a href="/">Home</a>
<a href="/modules/garbage-can/">Garbage Can</a>
```

This applies everywhere: nav bar links, module index entries, footer prev/next links, and any in-page references. Clean directory-style URLs are more readable, less brittle, and consistent with how professional sites are structured.

GitHub Pages handles directory-style URLs correctly — no special configuration needed.

---

## What This Pattern Deliberately Avoids

- Dropdown menus
- Breadcrumbs
- Sidebar navigation
- Tab bars
- Any navigation that implies hierarchy — all modules are peers
