---
id: REFERENCE-notes-module-linking
type: REFERENCE
title: Notes-Module Linking Contract
status: ACTIVE
created: 2026-03-22
updated: 2026-03-24
owner: Robert Andersson
relates_to: [REFERENCE-content-taxonomy, CORE]
tags: [linking, ia, notes, modules]
load_when: [ia_changes, content_design]
do_not_load_when: [pure_logic_changes]
token_cost_estimate: low
---

# Notes-Module Linking Contract

## Purpose

Define how notes and modules connect without creating brittle editorial overhead.

## Link Patterns

### A. Notes index cards (current)

- Notes cards show note tags.
- Notes cards do not render direct module CTA links.

### B. Note detail pages (current)

- Note detail pages do not render a `Related modules` line.
- Discovery of modules is handled via:
  - tags pages (`/tags/<tag>/`)
  - module navigation (`/modules/`)

### C. Tag pages (current)

- Tag pages are the primary bridge between notes and modules.
- A tag page may list:
  - notes with that tag
  - modules mapped to that tag via `content/meta/modules.json`

## Link Semantics

- Notes remain text-first and avoid repetitive CTA clutter.
- Modules remain interaction-first; notes supply context through taxonomy/tags rather than inline note-level module links.

## Governance

1. Add/update note tags in note frontmatter (`content/notes/published/*.md`).
2. Add/update module tags in `content/meta/modules.json`.
3. Rebuild generated pages: `node scripts/build-notes.js`.
4. Do not manually edit generated `notes/` or `tags/` pages.
