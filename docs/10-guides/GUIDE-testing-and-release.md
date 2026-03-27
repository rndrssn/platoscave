---
id: GUIDE-testing-and-release
type: GUIDE
title: Testing and Release Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-03-24
owner: Robert Andersson
relates_to: [CORE-quality-gates, GUIDE-getting-started]
tags: [testing, release]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Testing and Release Guide

## Required checks

1. `node tests/run-all.js`
2. Optional browser smoke when Playwright is installed: `node tests/test-browser-smoke-optional.js`

## Notes-only release path

When the change is only note content/tag generation, run from `sandbox`:

```bash
scripts/publish-note.sh -m "Publish note: <slug>" --only <slug>
```

Optional quick mode (notes-focused checks):

```bash
scripts/publish-note.sh -m "Publish note: <slug>" --quick --only <slug>
```

Optional spelling/punctuation polish before publish:

```bash
OPENAI_API_KEY=... scripts/publish-note.sh -m "Publish note: <slug>" --quick --polish <slug> --only <slug>
```

Status-driven lifecycle in frontmatter:
- `published`: rendered to notes/tags output.
- `draft`: excluded from generated output.
- `unpublished`: excluded from generated output (intentional takedown).

Safety:
- Script requires a clean staged index before running.
- `--only` blocks unexpected changed source notes under `content/notes/published/`.

## Release gate

- Required checks pass.
- Behavior and documentation semantics are aligned.
- Accessibility baseline remains intact.
- Runtime dependency sourcing is consistent (no mixed local/CDN imports for the same library).

## Scope checks

- If scoring/diagnosis changed: verify semantics docs and tests were updated.
- If simulation/viz changed: verify summary consistency tests still pass.
