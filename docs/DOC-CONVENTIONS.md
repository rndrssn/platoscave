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
| `SPIKE` | Time-boxed research or prototype exploration notes | Temporary |

### SPIKE — extended description

A `SPIKE` document captures exploratory work that is not yet ready to become a `STORY` or `TASK`. It is used when the goal is learning, prototyping, or validating an idea — not delivering a feature.

**When to create a SPIKE:**
- Prototyping a visualization before committing to an approach
- Exploring a library or technique with high uncertainty
- Capturing pen-and-paper sketches and conceptual work before coding begins
- Any time-boxed investigation with an open-ended outcome

**SPIKE lifecycle:**
- Created when exploration begins — status `IN-PROGRESS`
- Concluded with a finding: either `VALIDATED` (proceed to STORY) or `ABANDONED` (idea discarded)
- Never merged into a STORY directly — a SPIKE informs, it does not become
- Keep SPIKEs in `docs/` alongside other types — the naming convention makes them easy to identify and filter

**SPIKE status values** (in addition to standard statuses):
| Status | Meaning |
|--------|---------|
| `IN-PROGRESS` | Exploration actively underway |
| `VALIDATED` | Approach confirmed — ready to write a STORY |
| `ABANDONED` | Exploration concluded — idea discarded, reasoning captured |

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
FIX-001-broken-navigation-links.md
TECH-DEBT-refactor-css-variables.md
ADR-001-static-site-over-spa.md
SPIKE-emergence-viz-approaches.md
SPIKE-three-js-particle-system.md
```

### Notes
- `ADR` files use a zero-padded numeric prefix (ADR-001, ADR-002) to preserve decision order
- `FIX` files may optionally use a numeric prefix (FIX-001) for tracking purposes
- `SPIKE` files use descriptive slugs — no numeric prefix needed
- All other types use descriptive slugs only

---

## 3. Frontmatter Standard

Every `.md` file in `docs/` must begin with a YAML frontmatter block. Claude Code should always include this when creating or editing docs.

### Full frontmatter template
```yaml
---
id: [TYPE]-[slug]
type: [TYPE]
title: Human readable title
status: [DRAFT | ACTIVE | IN-PROGRESS | DONE | DEPRECATED | VALIDATED | ABANDONED]
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

| Status | Meaning | Applicable types |
|--------|---------|-----------------|
| `DRAFT` | Work in progress, not ready to act on | All |
| `ACTIVE` | Current and authoritative | VISION, STRATEGY, PRINCIPLE |
| `IN-PROGRESS` | Being actively worked on | EPIC, STORY, TASK, FIX, SPIKE |
| `DONE` | Completed | EPIC, STORY, TASK, FIX |
| `DEPRECATED` | No longer relevant, kept for reference | All |
| `VALIDATED` | Exploration confirmed — proceed to STORY | SPIKE only |
| `ABANDONED` | Exploration concluded — idea discarded | SPIKE only |

---

## 4. Relationships

Use the `relates_to` field to link documents together. This creates a navigable web of dependencies.

### Convention
- A `STORY` should relate to its parent `EPIC`
- A `TASK` or `FIX` should relate to its parent `STORY` or `EPIC`
- A `PRINCIPLE` should relate to `VISION` or `STRATEGY` where applicable
- An `ADR` should relate to the `EPIC` or `STORY` that prompted the decision
- A `SPIKE` should relate to the `EPIC` or `STORY` it is informing
- When a `SPIKE` is `VALIDATED`, the resulting `STORY` should relate back to the `SPIKE`

### Example
```yaml
relates_to: [VISION-product, EPIC-navigation]
```

---

## 5. Branch Convention for Experimental Work

SPIKE documents pair with dedicated Git branches. When starting a spike:

```bash
git checkout develop
git checkout -b experiment/[spike-slug]
```

Examples:
```
experiment/emergence-viz
experiment/three-js-particles
experiment/force-graph-layout
```

**Branch lifecycle mirrors the SPIKE status:**
- `IN-PROGRESS` → branch is active, work ongoing
- `VALIDATED` → merge branch into `develop`, update SPIKE status
- `ABANDONED` → delete branch, update SPIKE status with findings captured in the doc

This keeps experimental work isolated from `develop` while remaining tracked in GitHub.

---

## 6. Folder Structure

All docs live in the `docs/` folder at the repo root. No subfolders are needed at this stage — the filename prefix provides enough organisation.

```
docs/
├── DOC-CONVENTIONS.md              ← this file
├── VISION-product.md
├── PRINCIPLE-design-system.md
├── PRINCIPLE-coding-standards.md
├── PRINCIPLE-responsive.md
├── EPIC-navigation.md
├── STORY-mobile-responsive-nav.md
├── FIX-001-broken-navigation-links.md
├── ADR-001-static-site-over-spa.md
└── SPIKE-emergence-viz-approaches.md
```

---

## 7. Instructions for Claude Code

When working with docs in this project, Claude Code must:

1. **Always read this file first** before creating or editing any doc in `docs/`
2. **Apply the naming convention** from Section 2 to any new file
3. **Include complete frontmatter** from Section 3 on every doc
4. **Populate `relates_to`** based on logical relationships to existing docs
5. **Update the `updated` field** whenever a doc is meaningfully edited
6. **Never create a doc of unknown type** — if uncertain, ask the user which type applies
7. **Suggest a status** based on context but always confirm with the user before setting `ACTIVE`
8. **For SPIKE docs** — always create a matching `experiment/` branch suggestion and include it in the doc under a `## Branch` section
9. **When a SPIKE is VALIDATED** — prompt the user to create a corresponding STORY before closing the SPIKE
