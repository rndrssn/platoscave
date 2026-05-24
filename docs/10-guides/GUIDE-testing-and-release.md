---
id: GUIDE-testing-and-release
type: GUIDE
title: Testing and Release Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-05-24
owner: Robert Andersson
tags: [testing, release]
load_when: [always]
do_not_load_when: []
token_cost_estimate: low
---

# Testing and Release Guide

## Required checks

1. `node tests/run-all.js`
2. Optional browser smoke when Playwright is installed: `node tests/test-browser-smoke-optional.js`

Nav theming guardrails included in `run-all`:
- `tests/test-nav-theme-contract.js` ensures nav surfaces stay token-driven and prevents direct `.main-nav` theme overrides for the active theme.

## Writing release path

When the change is only note/article content and generated writing output, run from `sandbox`.

```bash
scripts/publish-note.sh -m "Publish writing: notes:<slug>" --only notes:<slug>
```

For articles:

```bash
scripts/publish-note.sh -m "Publish writing: articles:<slug>" --only articles:<slug>
```

Optional full-suite mode:

```bash
scripts/publish-note.sh -m "Publish writing: <target>" --only <target> --full-suite
```

Optional spelling/punctuation polish before publish:

```bash
OPENAI_API_KEY=... scripts/publish-note.sh -m "Publish writing: <target>" --polish <target> --only <target>
```

Status-driven lifecycle in frontmatter:
- `published`: rendered to notes/tags output.
- `draft`: excluded from generated output.
- `unpublished`: excluded from generated output (intentional takedown).

Safety:
- Script requires a clean staged index before running.
- `--only` accepts `notes:<slug>`, `articles:<slug>`, or a bare slug only when unique across both collections.
- `--only` blocks unexpected changed published source files under `content/notes/published/` and `content/articles/published/`.
- The script name is historical; `scripts/publish-note.sh` publishes both notes and articles.

## Release gate

- Required checks pass.
- Behavior and documentation semantics are aligned.
- Accessibility baseline remains intact.
- Runtime dependency sourcing is consistent (no mixed local/CDN imports for the same library).

## Scope checks

- If scoring/diagnosis changed: verify semantics docs and tests were updated.
- If simulation/viz changed: verify summary consistency tests still pass.
