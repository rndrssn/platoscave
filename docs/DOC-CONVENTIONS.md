# DOC-CONVENTIONS.md
> This file defines the naming conventions and frontmatter standards for all documentation in this project.
> Claude Code should read and apply these conventions whenever creating, editing, or referencing any `.md` file in the `docs/` folder.

---

## 1. Document Types

Every markdown file in `docs/` must belong to exactly one of the following types:

| Type | Description | Stability |
|------|-------------|-----------|
| `VISION` | Why the product exists. North star. | Rarely changes |
| `STRATEGY` | How we pursue the vision. | Changes occasionally |
| `PRINCIPLE` | Rules that govern decisions (design, tech, UX) | Changes occasionally |
| `ROADMAP` | What we're building and when | Changes regularly |
| `EPIC` | A large, self-contained chunk of work | Changes regularly |
| `STORY` | A single user-facing feature or capability | Changes regularly |
| `TASK` | A concrete, actionable to-do | Changes frequently |
| `FIX` | A bug or broken behaviour to resolve | Changes frequently |
| `TECH-DEBT` | Internal improvements with no user-facing change | Changes frequently |
| `ADR` | Architecture Decision Record — a technical decision log | Permanent once set |

---

## 2. File Naming Convention

### Pattern
```
[TYPE]-[slug].md
```

- `TYPE` is uppercase, from the list above
- `slug` is lowercase, hyphen-separated, descriptive
- No spaces, no special characters

### Examples
```
VISION-product.md
STRATEGY-go-to-market.md
PRINCIPLE-design-system.md
PRINCIPLE-coding-standards.md
ROADMAP-2026-q2.md
EPIC-navigation.md
STORY-mobile-responsive-nav.md
STORY-dark-mode.md
TASK-update-footer-links.md
FIX-broken-button-homepage.md
TECH-DEBT-refactor-css-variables.md
ADR-001-static-site-over-spa.md
```

### Notes
- `ADR` files use a zero-padded numeric prefix (ADR-001, ADR-002) to preserve decision order
- All other types use descriptive slugs only — no numeric IDs needed at this stage

---

## 3. Frontmatter Standard

Every `.md` file in `docs/` must begin with a YAML frontmatter block. Claude Code should always include this when creating or editing docs.

### Full frontmatter template
```yaml
---
id: [TYPE]-[slug]
type: [TYPE]
title: Human readable title
status: [DRAFT | ACTIVE | IN-PROGRESS | DONE | DEPRECATED]
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: [your name or "team"]
relates_to: []
tags: []
---
```

### Field definitions

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Mirrors the filename without `.md` extension |
| `type` | Yes | Must match one of the types in Section 1 |
| `title` | Yes | Human-readable name for the document |
| `status` | Yes | Current state of this document (see below) |
| `created` | Yes | Date first created |
| `updated` | Yes | Date last meaningfully edited |
| `owner` | No | Person responsible for this doc |
| `relates_to` | No | List of related doc IDs e.g. `[VISION-product, EPIC-navigation]` |
| `tags` | No | Free-form tags for filtering e.g. `[ux, design, backend]` |

### Status values

| Status | Meaning |
|--------|---------|
| `DRAFT` | Work in progress, not ready to act on |
| `ACTIVE` | Current and authoritative |
| `IN-PROGRESS` | Being actively worked on (for EPICs, STORYs, TASKs) |
| `DONE` | Completed (for EPICs, STORYs, TASKs, FIXes) |
| `DEPRECATED` | No longer relevant, kept for reference only |

---

## 4. Relationships

Use the `relates_to` field to link documents together. This creates a navigable web of dependencies.

### Convention
- A `STORY` should relate to its parent `EPIC`
- A `TASK` or `FIX` should relate to its parent `STORY` or `EPIC`
- A `PRINCIPLE` should relate to `VISION` or `STRATEGY` where applicable
- An `ADR` should relate to the `EPIC` or `STORY` that prompted the decision

### Example
```yaml
relates_to: [VISION-product, EPIC-navigation]
```

---

## 5. Folder Structure

All docs live in the `docs/` folder at the repo root. No subfolders are needed at this stage — the filename prefix provides enough organisation.

```
docs/
├── DOC-CONVENTIONS.md        ← this file
├── VISION-product.md
├── PRINCIPLE-design-system.md
├── PRINCIPLE-coding-standards.md
├── EPIC-navigation.md
├── STORY-mobile-responsive-nav.md
└── ADR-001-static-site-over-spa.md
```

---

## 6. Instructions for Claude Code

When working with docs in this project, Claude Code must:

1. **Always read this file first** before creating or editing any doc in `docs/`
2. **Apply the naming convention** from Section 2 to any new file
3. **Include complete frontmatter** from Section 3 on every doc
4. **Populate `relates_to`** based on logical relationships to existing docs
5. **Update the `updated` field** whenever a doc is meaningfully edited
6. **Never create a doc of unknown type** — if uncertain, ask the user which type applies
7. **Suggest a status** based on context but always confirm with the user before setting `ACTIVE`

---

## 7. Migrating Existing Docs

The following files currently exist in `docs/` and should be migrated to this convention:

| Current filename | Suggested new name | Suggested type |
|------------------|--------------------|----------------|
| `VISION.md` | `VISION-product.md` | `VISION` |
| `DESIGN-SYSTEM.md` | `PRINCIPLE-design-system.md` | `PRINCIPLE` |
| `NAVIGATION.md` | `EPIC-navigation.md` or `STORY-navigation.md` | `EPIC` or `STORY` — confirm with user |
| `RESPONSIVE.md` | `PRINCIPLE-responsive.md` or `STORY-responsive-layout.md` | `PRINCIPLE` or `STORY` — confirm with user |

> Claude Code should ask the user to confirm the type for ambiguous files before renaming.
