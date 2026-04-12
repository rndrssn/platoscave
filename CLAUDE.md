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

5. `modules/garbage-can/runtime/gc-simulation.js`
6. `modules/garbage-can/runtime/gc-viz.js`
7. `modules/garbage-can/assess/assess.js`
8. `modules/garbage-can/explorer/explorer.js`

If task scope is unclear, ask the user and proceed with explicit assumptions.

## Conditional Loading Rules

Full conditional loading rules are in `docs/00-core/CORE-loading-rules.md`. Summary:

- If editing GC logic: load GC logic and page wiring files above.
- If editing docs: load `docs/10-guides/DOC-CONVENTIONS.md`.
- If editing UI, CSS, navigation, or IA: load all of:
  - `docs/10-guides/GUIDE-architecture.md`
  - `docs/40-principles/principle-coding-standards.md`
  - `docs/20-reference/REFERENCE-css-architecture.md`
  - `docs/20-reference/navigation-patterns.md`
- If editing Module 04 (Management Mix Mapper): load the split runtime files in `modules/mix-mapper/*` plus relevant Mix Mapper contract tests under `tests/`.
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

## Git Workflow

- **`sandbox`** is the working branch. All development, commits, and iteration happen here.
- **`main`** is the stable/production branch. It reflects what is live on GitHub Pages.
- Never commit directly to `main` during development.
- Only merge `sandbox` → `main` when the user explicitly says "release to main" or "commit and release to main".
- After releasing, switch back to `sandbox` immediately.
- Push `sandbox` to remote at the end of sessions or when releasing, so both branches stay in sync on the remote.

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
- Changed Module title/section naming or IA labels:
  - Update `modules/index.html`, `js/nav-controller.js`, module page labels, and any compatibility redirect copy.
- Changed contributor/release workflow:
  - Update `README.md` and any tracked workflow notes.

## Module IA Contract (Navigation + Numbering)

- Live module root must be canonical xx.01 at module root.
- Root module page requirements:
  - include class module-back-link pointing to ../
  - include class module-sub-nav
  - exactly one active root section link with:
    - class containing module-sub-nav-link--active
    - href set to ./
    - aria-current set to page
    - section number xx.01
- Do not use root hard redirect (meta refresh) for live module roots.
- Legacy nested first-section paths may redirect to root for compatibility, never the reverse.
- When creating new module roots, prefer:
  - `node scripts/new-module.js --number <xx> --slug <slug> --title "<Title>"`

Tests enforcing this contract:
- `tests/test-module-landing-pattern-contract.js`
- `tests/test-nav-modules-menu-contract.js`
- `tests/test-navigation-links.js`

## Critical Paths (minimal map)

- Theme bootstrap: `theme.config.js`, `js/theme-bootstrap.js`
- Styles: `css/main.css` + layered css files
- GC logic: `modules/garbage-can/runtime/gc-simulation-core.js`, `modules/garbage-can/runtime/gc-simulation.js`, `modules/garbage-can/runtime/gc-scoring.js`, `modules/garbage-can/runtime/gc-diagnosis.js`, `modules/garbage-can/runtime/gc-viz.js`
- GC narrative: `modules/garbage-can/runtime/gc-pressure-narrative.js` (must load before assess.js / explorer.js)
- GC page wiring: `modules/garbage-can/assess/assess.js`, `modules/garbage-can/explorer/explorer.js`
- Module 04 runtime: `modules/mix-mapper/mix-mapper-data.js`, `modules/mix-mapper/mix-mapper-semantics.js`, `modules/mix-mapper/mix-mapper-geometry.js`, `modules/mix-mapper/mix-mapper-layout-utils.js`, `modules/mix-mapper/mix-mapper-node-utils.js`, `modules/mix-mapper/mix-mapper-mode-policy.js`, `modules/mix-mapper/mix-mapper-tooltip.js`, `modules/mix-mapper/mix-mapper-interactions.js`, `modules/mix-mapper/mix-mapper-renderer.js`, `modules/mix-mapper/mix-mapper.js`
- Tests: `tests/run-all.js`

Key design constraints:
- The Assess path fixes problemInflow to 'moderate' — the survey does not capture inflow timing; Explorer exposes all four parameters. See `docs/10-guides/GUIDE-architecture.md`.
- Page wiring calls window.buildGcPressureNarrative and window.getDiagnosisPreview as globals — both are set by `modules/garbage-can/runtime/gc-pressure-narrative.js` and `modules/garbage-can/runtime/gc-diagnosis.js` before page wiring runs.
- Use simResult.meta.problems (not a hardcoded constant) when computing problem proportions from simulation output.
- Module 04 root is canonical 04.01 at `/modules/mix-mapper/` and currently titled "Epistemic Bets" under module title "Management Mix Mapper".
- Mix Mapper SVG color rendering (iOS WebKit): do not use color-mix with transparent in values set via D3 attr() — it is ignored on iOS, producing fully-opaque color. Use D3 style() for all visual properties (fill, stroke, fill-opacity, stroke-opacity) on SVG elements so the CSS engine handles them — SVG presentation attributes for visual properties are unreliable on iOS WebKit.
- Mix Mapper SVG text centering (iOS WebKit): dominant-baseline and text-anchor must be set as CSS properties on the label class in `css/pages/mix-mapper.css`, not only as SVG presentation attributes — CSS author styles take precedence and are reliably handled on iOS WebKit.
- Mix Mapper `buildColors()` reads the `--viz-*` token tier directly (`--viz-ink-faint`, `--viz-ink-ghost`, `--viz-sage`, `--viz-rust`, etc.) matching the gc-viz contract. Do not revert to `--ink-*` UI tokens for SVG color reads.

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
