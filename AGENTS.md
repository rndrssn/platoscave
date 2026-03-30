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

This file is intentionally short. It reflects the public, tracked source of truth.
Internal/private docs may exist locally, but must not be assumed present in this repo.

## Instruction Precedence

When instructions conflict, use this order:
1. Explicit user task in the current chat
2. This `CLAUDE.md`
3. Tracked repository sources (`README.md`, code, tests)
4. Local/private docs only if explicitly provided by the user in-session

If unresolved conflict remains, stop and ask.

## Execution Gate (Global)

Discussion intent overrides implementation autonomy.

For every new user request, first return:
1. Understanding of the request
2. Proposed plan (short)
3. Explicit checkpoint question: `Proceed?`

Until explicit approval is given, do not:
- edit files
- run build/test commands
- execute write operations

Valid approval signals include:
- `implement`
- `proceed`
- `go ahead`
- `apply option X`

Fast-lane override (skip planning and implement directly) is allowed only when the user explicitly says:
- `implement directly`
- `quick fix`
- `no plan needed`
- `skip discussion`

If the user says phrases like `confirm understanding`, `wdyt`, `let's discuss`, or `plan first`, remain in discussion mode and do not implement until explicit approval.

## Default Context Pack

### Foundation (always load first)

1. `README.md`
2. `docs/00-core/CORE.md`
3. `docs/00-core/CORE-loading-rules.md`
4. `docs/00-core/CORE-quality-gates.md`

### GC logic and page wiring (load when task involves simulation, scoring, diagnosis, or viz)

5. `gc-simulation.js`
6. `gc-viz.js`
7. `modules/garbage-can/assess/assess.js`
8. `modules/garbage-can/explorer/explorer.js`

If task scope is unclear, ask the user and proceed with explicit assumptions.

## Conditional Loading Rules

Full conditional loading rules are in `docs/00-core/CORE-loading-rules.md`. Summary:

- If editing GC logic: load GC logic and page wiring files above.
- If editing docs: load `docs/10-guides/DOC-CONVENTIONS.md`.
- If working on semantics and labels: treat implementation and tests as canonical; align terminology across UI, summaries, and legends.
- If local/private docs are referenced by user: load only those explicitly requested paths.
- Prefer tracked `docs/` content when present. If `docs/` is missing locally, ask before assuming private copies.

## Context and Token Constraints

- Default max docs per run: 8
- Docs token budget per run: 8k
- Never assume private/local docs by default.
- If a doc is long, read relevant sections first; summarize before expanding more.

Profiles:
- `fast`: foundation pack + one conditional doc max.
- `deep`: foundation pack + all relevant conditional docs up to budget.

## Hard Execution Gates

For code changes:
1. Run `node tests/run-all.js`.
2. `run-all` includes navigation link checks and notes build checks.
3. Optional browser smoke: `node tests/test-browser-smoke-optional.js` (auto-skips unless Playwright is installed).

For semantics/labels/rules changes:
1. Update affected UI copy and tests in same change.
2. Ensure terms remain consistent across:
   - legends
   - simulation runtime labels
   - summary table copy

## Change-Trigger Matrix

- Changed GC model math or outputs:
  - Update tests and any user-facing summary logic/copy.
- Changed UI labels/readouts:
  - Update all affected UI surfaces (legend, runtime text, summary).
- Changed contributor/release workflow:
  - Update `README.md` and any tracked workflow notes.

## Critical Paths (minimal map)

- Theme bootstrap: `theme.config.js`, `js/theme-bootstrap.js`
- Styles: `css/main.css` + layered css files
- GC logic: `gc-simulation-core.js`, `gc-simulation.js`, `gc-scoring.js`, `gc-diagnosis.js`, `gc-viz.js`
- GC narrative: `js/gc-pressure-narrative.js` (must load before assess.js / explorer.js)
- GC page wiring: `modules/garbage-can/assess/assess.js`, `modules/garbage-can/explorer/explorer.js`
- Tests: `tests/run-all.js`

Key design constraints:
- The Assess path fixes problemInflow to 'moderate' — the survey does not capture inflow timing; Explorer exposes all four parameters. See `docs/10-guides/GUIDE-architecture.md`.
- Page wiring calls window.buildGcPressureNarrative and window.getDiagnosisPreview as globals — both are set by `js/gc-pressure-narrative.js` and `gc-diagnosis.js` before page wiring runs.
- Use simResult.meta.problems (not a hardcoded constant) when computing problem proportions from simulation output.

## Task Templates (quick start)

### Feature change
1. Load default pack + directly relevant source files.
2. Implement.
3. Add/update tests.
4. Run required test commands.
5. Update tracked documentation (`README.md`) if behavior/IA changed.

### Bug fix
1. Reproduce.
2. Patch minimal scope.
3. Add regression test where feasible.
4. Run required test commands.
5. Document behavior change if user-facing semantics changed.

### Docs-only change
1. Edit tracked docs only (primarily `README.md`).
2. Keep docs aligned with code source-of-truth.
3. Validate links/references if conventions changed.

## Final Response Contract

When finishing, report:
1. What changed (files + intent)
2. Tests/checks run and result
3. Any residual risks or follow-ups
