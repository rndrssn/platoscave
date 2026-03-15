# CLAUDE.md
> This file is read automatically by Claude Code at the start of every session.
> It defines the project context, constraints, conventions, and behavioural rules.
> Do not delete or move this file — it must remain in the root of the repo.

---

## Project

**To the Bedrock** — a personal portfolio site that publishes ideas through interactive tools and visualizations, not blog posts. Readers engage with models and see their own organizational reality reflected back.

Owner: Robert Andersson
Repo: GitHub Pages — static site, no backend
Status: Early build — shell and first module in progress

---

## Tech Stack

- **Plain HTML, CSS, JavaScript only** — no frameworks, no build tools, no npm
- **d3.js** — primary visualization library
- **Three.js** — 3D conceptual pieces where appropriate
- Both libraries loaded via CDN — never install as packages
- Deployed via **GitHub Pages** — directory-style URLs, never reference `index.html` explicitly in links

---

## File & Folder Structure

```
/
├── CLAUDE.md               ← this file — do not move
├── index.html              ← served at /
├── css/
│   └── main.css
├── js/
│   └── main.js
├── modules/
│   ├── index.html          ← served at /modules/
│   ├── emergence/
│   │   └── index.html
│   ├── maturity/
│   │   └── index.html
│   ├── garbage-can/
│   │   └── index.html
│   └── mix-mapper/
│       └── index.html
└── docs/
    ├── DOC-CONVENTIONS.md
    ├── VISION-product.md
    ├── PRINCIPLE-design-system.md
    ├── PRINCIPLE-responsive.md
    └── EPIC-navigation.md
```

---

## Branching Rules

- **Never commit or push directly to `main`**
- All work happens on the `develop` branch
- Only merge to `main` when a feature is complete and working
- Always confirm the current branch before starting work

---

## Design System

The full design spec lives in `docs/PRINCIPLE-design-system.md`. Read it before touching any HTML or CSS.

Key rules to internalize:

**Aesthetic:** Editorial Scientific Notebook — warm, matte, paper-like. Typographically led.

**Colours — always use CSS variables:**
```css
--paper: #F4EFE4       /* base background */
--paper-dark: #EBE4D5
--paper-deep: #E0D7C4
--ink: #2A2018         /* primary text */
--ink-mid: #5C4F3A
--ink-faint: #9C8E78
--ink-ghost: #C8BDA8   /* borders, dividers */
--rust: #8B3A2A        /* primary accent */
--rust-light: #B85C40
--ochre: #9A7B3A       /* secondary accent */
--slate: #3D4F5C       /* data/science contexts */
```

**Typography:**
- Display/Headings: Cormorant Garamond, weight 300, usually italic
- Body: EB Garamond, weight 400
- Labels/Metadata/Code: DM Mono, uppercase, letter-spacing 0.1em
- Base size: 18px, line-height 1.7, max line length 62ch

**Non-negotiables:**
- No gradients
- No drop shadows
- No rounded app-like cards
- No decorative icons or emoji
- No pure white or pure black
- No generic sans-serif body text

---

## Navigation Rules

The full navigation spec lives in `docs/EPIC-navigation.md`. Read it before touching any nav-related code.

Key rules:
- Global nav: fixed top bar, site name left (italic Cormorant), two links right (DM Mono, uppercase, 0.7rem)
- Module links never move into the top nav — the Index page at `/modules/` is the navigation device
- No dropdowns, no breadcrumbs, no sidebar, no hamburger icons
- Mobile nav: site name + `MENU` text toggle only
- Links always use directory-style URLs — never reference `index.html` explicitly

---

## Responsive Rules

The full responsive spec lives in `docs/PRINCIPLE-responsive.md`. Read it before writing any layout CSS.

Key rules:
- Mobile-first — three breakpoints: base (mobile), 640px (tablet), 1024px (desktop)
- Base font size stays 18px on mobile — never reduce it
- Use `clamp()` for display headings
- All d3/Three.js visualizations must read container width at render time — no hardcoded pixel widths
- No horizontal scrolling at any breakpoint — ever
- Minimum touch target: 44px × 44px

---

## Documentation Rules

The full doc conventions live in `docs/DOC-CONVENTIONS.md`. Read it before creating or editing any file in `docs/`.

Key rules:
- Every doc uses the naming pattern: `[TYPE]-[slug].md`
- Every doc starts with a YAML frontmatter block (id, type, title, status, created, updated, owner, relates_to, tags)
- Never create a doc of unknown type — ask the user which type applies
- Update the `updated` field whenever a doc is meaningfully edited
- Valid types: VISION, STRATEGY, PRINCIPLE, ROADMAP, EPIC, STORY, TASK, FIX, TECH-DEBT, ADR

---

## Behavioural Rules

1. **Read before writing** — before touching code, read the relevant principle/epic doc for that area
2. **Ask before installing** — never add a library or dependency without confirming with the user
3. **Stay on develop** — always confirm the branch is `develop` before starting
4. **No frameworks** — if a task feels like it needs React, Vue, or similar, flag it and discuss first
5. **Directory URLs only** — never write `href="index.html"` or `href="page.html"` in links
6. **Small commits** — commit after each meaningful, working change — not in large batches
7. **Confirm before renaming docs** — never rename an existing doc without asking first

---

## Current MVP Scope

Build in this order — do not jump ahead:

1. Shell: `index.html` homepage with global nav, hero section, module index teaser
2. Module index page: `/modules/index.html` with the full list layout
3. First module stub: `/modules/emergence/index.html` — structure and header, no visualization yet
4. Emergence visualization: animated d3 piece showing simple rules → surprising patterns

Everything else (maturity diagnostic, garbage can model, mix mapper) comes after the shell and first module are solid.

## Note ##
- All work happens on the `develop` branch (not `development`)
---

## Out of Scope — Do Not Build

- No backend, no server-side code
- No database or persistent storage
- No authentication or user accounts
- No CMS
- No CSS frameworks (no Tailwind, Bootstrap etc.)
- No JavaScript frameworks (no React, Vue, Svelte etc.)
- No blog or timeline feed
- No social proof elements (follower counts, testimonials)
