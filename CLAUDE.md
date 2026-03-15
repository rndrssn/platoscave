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
├── HANDOFF.md              ← current task queue for Claude Code
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
    ├── PRINCIPLE-coding-standards.md
    ├── PRINCIPLE-responsive.md
    └── EPIC-navigation.md
```

---

## Branching Rules

- **Never commit or push directly to `main`**
- Production-ready work lives on `develop` — merge to `main` only when complete and working
- **Spike and experiment work lives on `experiment/` branches** — never on `develop`
  - Branch naming: `experiment/[spike-slug]` e.g. `experiment/organised-anarchy-mapper`
  - Always confirm the current branch before starting work
  - Never merge an experiment branch to `develop` without explicit instruction
- Check `HANDOFF.md` — it specifies which branch the current task belongs on

---

## Coding Standards

The full coding standards live in `docs/PRINCIPLE-coding-standards.md`. Read it before writing any code.

Key rules to internalize:

**Separation of concerns — each file has one job:**
- `css/main.css` — all visual decisions
- `gc-simulation.js` — simulation logic only, no DOM
- `gc-scoring.js` — scoring logic only, no DOM
- `modules/*/index.html` — structure and wiring only, no logic, no inline styles

**CSS:**
- No inline styles — ever
- No `<style>` blocks in HTML files — ever
- No new CSS outside `css/main.css`
- Always use CSS custom properties — never hardcode color or font values
- Check existing classes before writing new ones

**JavaScript:**
- No logic in HTML files — logic belongs in dedicated `.js` files
- JS logic files must be DOM-free — they accept inputs and return outputs only
- No external dependencies without explicit approval

**HTML:**
- Directory-style URLs only — never reference `index.html` explicitly in links
- One CSS file loaded in `<head>`, scripts at end of `<body>`

---

## Design System

The full design spec lives in `docs/PRINCIPLE-design-system.md`. Read it before touching any HTML or CSS.

Key rules to internalize:

**Aesthetic:** Editorial Scientific Notebook — warm, matte, paper-like. Typographically led.

**Colours — always use CSS variables:**
```css
--paper:       #F4EFE4   /* base background */
--paper-dark:  #EBE4D5
--paper-deep:  #E0D7C4
--ink:         #2A2018   /* primary text */
--ink-mid:     #5C4F3A
--ink-faint:   #9C8E78
--ink-ghost:   #C8BDA8   /* borders, dividers */
--rust:        #8B3A2A   /* primary accent */
--rust-light:  #B85C40
--ochre:       #9A7B3A   /* secondary accent */
--slate:       #3D4F5C   /* data/science contexts */
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
- Valid types: VISION, STRATEGY, PRINCIPLE, ROADMAP, EPIC, STORY, TASK, FIX, TECH-DEBT, ADR, SPIKE

---

## Behavioural Rules

1. **Read before writing** — before touching code, read the relevant principle/epic doc for that area
2. **Read PRINCIPLE-coding-standards.md** before writing any code — always
3. **Read main.css** before adding any styles — use existing tokens and classes
4. **Ask before installing** — never add a library or dependency without confirming with the user
5. **Check the branch** — always confirm you are on the correct branch before starting (see HANDOFF.md)
6. **No frameworks** — if a task feels like it needs React, Vue, or similar, flag it and discuss first
7. **Directory URLs only** — never write `href="index.html"` or `href="page.html"` in links
8. **Small commits** — commit after each meaningful, working change — not in large batches
9. **Confirm before renaming docs** — never rename an existing doc without asking first
10. **Do only what HANDOFF.md specifies** — do not expand scope, do not anticipate next steps

---

## Current MVP Scope

Build in this order — do not jump ahead:

1. Shell: `index.html` homepage with global nav, hero section, module index teaser
2. Module index page: `/modules/index.html` with the full list layout
3. Garbage Can module: `/modules/garbage-can/index.html` — in progress on `experiment/organised-anarchy-mapper`
4. Emergence visualization — after Garbage Can is merged to develop
5. Remaining modules (maturity, mix-mapper) — after emergence

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
