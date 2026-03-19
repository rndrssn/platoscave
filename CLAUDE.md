# CLAUDE.md

<!--
agent_contract_version: 2
default_profile: fast
docs_token_budget: 8000
default_max_docs: 6
archive_default: false
-->

## Purpose

Operational contract for Claude Code in this repository.

This file is intentionally short. Canonical policy lives in `/docs`.

## Instruction Precedence

When instructions conflict, use this order:
1. Explicit user task in the current chat
2. This `CLAUDE.md`
3. Core docs in `/docs` (see default context pack)
4. Historical/archive docs (only if explicitly loaded)

If unresolved conflict remains, stop and ask.

## Default Context Pack (always load first)

1. `docs/00-core/CORE.md`
2. `docs/00-core/CORE-loading-rules.md`
3. `docs/00-core/CORE-quality-gates.md`
4. `docs/30-tasks/TASK-current-work.md`
5. `HANDOFF.md` (if present)

If `HANDOFF.md` is missing, ask the user for task scope and proceed with explicit assumptions.

## Conditional Loading Rules

- If editing docs: load `docs/10-guides/DOC-CONVENTIONS.md`.
- If working on simulation/scoring/diagnosis/viz semantics:
  - `docs/20-reference/REFERENCE-gc-model-semantics.md`
  - `docs/10-guides/GUIDE-architecture.md`
- If working on onboarding/workflow/test process docs:
  - `docs/10-guides/GUIDE-getting-started.md`
  - `docs/10-guides/GUIDE-contributing.md`
- If debugging historical behavior/decisions:
  - load from `docs/90-archive/*` only when needed.

## Context and Token Constraints

- Default max docs per run: 6
- Docs token budget per run: 8k
- Never load archive/history docs by default.
- If a doc is long, read relevant sections first; summarize before expanding more.

Profiles:
- `fast`: default pack + one conditional doc max.
- `deep`: default pack + all relevant conditional docs up to budget.

## Hard Execution Gates

For code changes:
1. Run `node tests/run-all.js`.
2. If navigation links changed, also run `node tests/test-navigation-links.js` with local server.

For semantics/labels/rules changes:
1. Update affected docs in same change.
2. Ensure terms remain consistent with `docs/20-reference/REFERENCE-gc-model-semantics.md`.

## Change-Trigger Matrix

- Changed GC model math or outputs:
  - Update tests + `docs/20-reference/REFERENCE-gc-model-semantics.md` + relevant principle docs.
- Changed UI labels/readouts:
  - Update docs reflecting term and unit semantics.
- Changed contributor/release workflow:
  - Update `docs/10-guides/GUIDE-testing-and-release.md` and/or `docs/10-guides/GUIDE-contributing.md`.

## Critical Paths (minimal map)

- Theme bootstrap: `theme.config.js`, `js/theme-bootstrap.js`
- Styles: `css/main.css` + layered css files
- GC logic: `gc-simulation.js`, `gc-scoring.js`, `gc-diagnosis.js`, `gc-viz.js`
- GC page wiring: `modules/garbage-can/assess/assess.js`, `modules/garbage-can/explorer/explorer.js`
- Tests: `tests/run-all.js`

## Task Templates (quick start)

### Feature change
1. Load default pack + relevant guide/reference docs.
2. Implement.
3. Add/update tests.
4. Run required test commands.
5. Update docs affected by behavior/semantics change.

### Bug fix
1. Reproduce.
2. Patch minimal scope.
3. Add regression test where feasible.
4. Run required test commands.
5. Document behavior change if user-facing semantics changed.

### Docs-only change
1. Load `docs/10-guides/DOC-CONVENTIONS.md` + target docs.
2. Keep docs aligned with code source-of-truth.
3. Validate links/references if conventions changed.

## Final Response Contract

When finishing, report:
1. What changed (files + intent)
2. Tests/checks run and result
3. Any residual risks or follow-ups
