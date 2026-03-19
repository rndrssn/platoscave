---
id: GUIDE-getting-started
type: GUIDE
title: Getting Started
status: ACTIVE
created: 2026-03-19
updated: 2026-03-19
owner: Robert Andersson
relates_to: [GUIDE-docs-index, PRINCIPLE-coding-standards, GUIDE-testing-and-release]
tags: [onboarding, setup, runbook]
---

# Getting Started

## Prerequisites

- Node.js (used for automated tests)
- A static file server (for manual browser checks)
- Modern desktop browser

## Project Model

- Plain HTML/CSS/JavaScript
- No framework
- No build step

## Local Workflow

1. Open project root.
2. Run automated checks:
   - `node tests/run-all.js`
3. For manual navigation checks requiring HTTP routing, start a local server, then run:
   - `node tests/test-navigation-links.js`

## Core Directories

- `modules/` — module pages
- `css/` — layered styles
- `js/` — shared bootstrap/runtime helpers
- repo root `gc-*.js` — simulation/scoring/diagnosis/viz logic
- `tests/` — automated checks and visual/manual harnesses
- `docs/` — standards, guides, domain references

## First Read for Contributors

1. `docs/README.md`
2. `docs/GUIDE-architecture.md`
3. `docs/PRINCIPLE-coding-standards.md`
4. `docs/GUIDE-testing-and-release.md`

## Common Pitfalls

- Running only some tests and missing full-suite regressions.
- Confusing choice-level vs problem-level metrics in labels/copy.
- Updating code without updating affected principle/reference docs.
