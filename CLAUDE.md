# CLAUDE.md

## Project

**To the Bedrock** — a personal portfolio site that publishes ideas through interactive tools and visualizations. Plain HTML, CSS, and JavaScript. No framework, no build step. Hosted on GitHub Pages.

See `docs/VISION-product.md` for the full vision.

---

## Before you do anything

1. Read this file
2. Read `docs/PRINCIPLE-coding-standards.md` — the rules for all code in this project
3. Read `docs/DOC-CONVENTIONS.md` — the rules for all docs in `docs/`
4. Read the `HANDOFF.md` in the repo root — your current task lives there

---

## Repo structure

```
/
├── CLAUDE.md                          ← you are here
├── HANDOFF.md                         ← current task for Claude Code
├── theme.config.js                    ← single source of truth for active theme
├── css/
│   ├── main.css                       ← CSS import entrypoint
│   ├── tokens.css                     ← design tokens (default values)
│   ├── base.css                       ← reset and element defaults
│   ├── layout.css                     ← global layout primitives
│   ├── components.css                 ← reusable shared components
│   ├── utilities.css                  ← utility classes and keyframes
│   ├── themes.css                     ← theme overrides
│   └── pages.css                      ← page/module-specific styles
├── js/
│   └── theme-bootstrap.js             ← applies configured global theme
├── gc-simulation.js                   ← garbage can simulation logic (no DOM)
├── gc-scoring.js                      ← scoring logic (no DOM)
├── index.html                         ← site root / home page
├── modules/
│   └── garbage-can/
│       └── index.html                 ← module 03 — organised anarchy mapper
├── docs/
│   ├── DOC-CONVENTIONS.md             ← naming, frontmatter, doc types
│   ├── VISION-product.md
│   ├── PRINCIPLE-coding-standards.md
│   ├── PRINCIPLE-design-system.md
│   ├── PRINCIPLE-responsive.md
│   ├── PRINCIPLE-organised-anarchy-*.md
│   ├── EPIC-*.md
│   ├── STORY-*.md
│   ├── SPIKE-*.md
│   ├── FIX-*.md
│   ├── TECH-DEBT-*.md
│   └── ADR-*.md
```

---

## How this project works

This is a learning project as much as a product. The workflow is:

1. **Claude.ai** — ideation, requirements, troubleshooting, design decisions
2. **Claude Code + VSCode** — implementation, guided by HANDOFF.md
3. **Git + GitHub** — version control, branches, GitHub Pages deployment

Claude Code does not freelance. It reads HANDOFF.md and executes what is there. If the handoff is ambiguous, Claude Code asks — it does not guess.

---

## Rules — always apply, every task

These come from `docs/PRINCIPLE-coding-standards.md`. Repeating the non-negotiables here:

- **No inline styles** — CSS classes only, defined in layered CSS files under `css/`
- **No `<style>` blocks in HTML** — all CSS lives in `css/*.css`
- **No logic in HTML files** — HTML wires components, logic lives in `.js` files
- **No hardcoded colors or fonts** — use CSS custom properties from `css/tokens.css` / `css/themes.css`
- **Global theme is config-driven** — set `window.PLATOSCAVE_THEME` in `theme.config.js`; do not hardcode `data-theme` per page
- **No external dependencies** without an ADR
- **Clean directory URLs** — never reference `index.html` in links
- **JS logic files are DOM-free** — `gc-simulation.js` and `gc-scoring.js` accept inputs, return outputs

---

## Branch convention

- `main` — production, deployed to GitHub Pages
- `develop` — integration branch
- `experiment/[slug]` — spike branches for exploratory work

Current active branch: check with `git branch --show-current`

---

## Docs convention

All docs follow `docs/DOC-CONVENTIONS.md`. Key points:

- Every doc has a `TYPE-slug.md` filename
- Every doc has YAML frontmatter with id, type, title, status, created, updated
- Use `relates_to` to link docs together
- SPIKEs pair with `experiment/` branches
- When creating or editing any doc, read DOC-CONVENTIONS.md first

---

## Current focus

Module 03 — The Garbage Can Model (organised anarchy mapper). An interactive simulation where users answer 12 questions about their organisation and receive a diagnosis with a d3.js visualization of the garbage can model in action.

The task is always in HANDOFF.md. Do that and nothing else.
