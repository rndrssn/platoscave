# CLAUDE.md

<!--
agent_contract_version: 3
default_profile: fast
docs_token_budget: 8000
default_max_docs: 6
archive_default: false
-->

## Purpose

Operational contract for AI coding agents in this repository. Read this file at the start of every session. It is the authoritative source of truth for agent behaviour.

## Instruction Precedence

1. Explicit user task in the current chat
2. This `CLAUDE.md`
3. Tracked repository sources (`README.md`, code, tests)
4. Local/private docs only if explicitly provided by the user in-session

If conflict is unresolvable, stop and ask.

## Execution Gate

**Default mode: discuss before acting.**

On every new request, return:
1. Understanding of the request
2. Proposed plan (short)
3. `Proceed?`

Do not edit files, run build/test commands, or execute write operations until approved.

**Valid approval signals:** `implement` · `proceed` · `go ahead` · `apply option X` · `ok`

**Fast-lane override** (skip planning, implement directly):
- `implement directly` · `quick fix` · `no plan needed` · `skip discussion`

**Discussion-only mode** (do not implement until explicit approval):
- `confirm understanding` · `wdyt` · `let's discuss` · `plan first`

## Git Workflow

Three-branch flow: `sandbox` → `develop` → `main`

| Branch | Role | Rule |
|--------|------|------|
| `sandbox` | Development | All commits and iteration happen here |
| `develop` | Staging | Integration step before production |
| `main` | Production | Live on GitHub Pages |

**Trigger phrases:**
- `commit` → commit on `sandbox` only
- `release to develop` → merge `sandbox` → `develop`, push both
- `release to main` → merge `develop` → `main`, push both
- `commit and release to main` → commit on `sandbox` → merge to `develop` → merge to `main`, push all three

**Rules:**
- Never commit directly to `develop` or `main`
- Always switch back to `sandbox` after any release
- Push all affected branches to remote after each release
- Run `node tests/run-all.js` before every commit

## Context Loading

### Foundation pack (always load)

1. `README.md`
2. `docs/00-core/CORE.md`
3. `docs/00-core/CORE-loading-rules.md`
4. `docs/00-core/CORE-quality-gates.md`

### Conditional (load when relevant)

| Task involves | Load |
|---------------|------|
| GC simulation, scoring, diagnosis, viz | `modules/garbage-can/runtime/gc-simulation.js`, `modules/garbage-can/runtime/gc-viz.js`, `modules/garbage-can/assess/assess.js`, `modules/garbage-can/explorer/explorer.js` |
| UI, CSS, navigation, IA | `docs/10-guides/GUIDE-architecture.md`, `docs/40-principles/PRINCIPLE-coding-standards.md`, `docs/20-reference/REFERENCE-css-architecture.md`, `docs/20-reference/navigation-patterns.md` |
| Module 04 Mix Mapper | All files in `modules/mix-mapper/*` + relevant contract tests in `tests/` |
| Documentation edits | `docs/10-guides/DOC-CONVENTIONS.md` |
| Semantics and labels | Treat implementation and tests as canonical; align across UI, summaries, legends |

Full rules: `docs/00-core/CORE-loading-rules.md`.

Profiles:
- `fast`: foundation pack + one conditional doc max
- `deep`: foundation pack + all relevant conditional docs up to 8k token budget

## Hard Gates (pre-commit)

**Always run before committing:** `node tests/run-all.js`

Includes navigation link checks and notes build checks.

**Optional** (auto-skips without Playwright): `node tests/test-browser-smoke-optional.js`

**Semantics/labels changes:** update affected UI copy and tests in the same change. Keep terms consistent across legends, simulation runtime labels, and summary copy.

## Change Trigger Matrix

| Changed | Also update |
|---------|-------------|
| GC model math or outputs | Tests + user-facing summary logic/copy |
| UI labels/readouts | All affected surfaces (legend, runtime text, summary) |
| Module title, section name, or IA label | `modules/index.html`, `js/nav-controller.js`, module page labels, redirect copy |
| Contributor or release workflow | `README.md` + tracked workflow docs |
| `CLAUDE.md` | `AGENTS.md` must remain byte-for-byte identical (enforced by `scripts/check-claude-links.js`) |

## Module IA Contract

- Live module root is canonical xx.01 at /modules/slug/
- Root module page must have:
  - `class="module-back-link"` pointing to `../`
  - `class="module-sub-nav"`
  - Exactly one active link: class module-sub-nav-link--active, href="./", aria-current="page", section number xx.01
- Never use root hard redirect (meta refresh) for live module roots
- Legacy nested paths may redirect **to** root, never the reverse
- New module scaffold: `node scripts/new-module.js` with --number, --slug, --title flags

Tests enforcing this contract:
- `tests/test-module-landing-pattern-contract.js`
- `tests/test-nav-modules-menu-contract.js`
- `tests/test-navigation-links.js`

## Critical Paths

| System | Files |
|--------|-------|
| Theme bootstrap | `theme.config.js`, `js/theme-bootstrap.js` |
| Styles | `css/tokens.css`, `css/themes.css` + layered css files |
| GC logic | `modules/garbage-can/runtime/gc-simulation-core.js`, `modules/garbage-can/runtime/gc-simulation.js`, `modules/garbage-can/runtime/gc-scoring.js`, `modules/garbage-can/runtime/gc-diagnosis.js`, `modules/garbage-can/runtime/gc-viz.js` |
| GC narrative | `modules/garbage-can/runtime/gc-pressure-narrative.js` — must load before assess.js / explorer.js |
| GC page wiring | `modules/garbage-can/assess/assess.js`, `modules/garbage-can/explorer/explorer.js` |
| Module 04 runtime | `modules/mix-mapper/mix-mapper-data.js`, `modules/mix-mapper/mix-mapper-semantics.js`, `modules/mix-mapper/mix-mapper-geometry.js`, `modules/mix-mapper/mix-mapper-layout-utils.js`, `modules/mix-mapper/mix-mapper-node-utils.js`, `modules/mix-mapper/mix-mapper-mode-policy.js`, `modules/mix-mapper/mix-mapper-tooltip.js`, `modules/mix-mapper/mix-mapper-interactions.js`, `modules/mix-mapper/mix-mapper-renderer.js`, `modules/mix-mapper/mix-mapper.js` |
| Tests | `tests/run-all.js` |

**Non-negotiable constraints:**

- Assess path fixes problemInflow to 'moderate' — survey does not capture inflow timing. Explorer exposes all four parameters. See `docs/10-guides/GUIDE-architecture.md`.
- Page wiring calls window.buildGcPressureNarrative and window.getDiagnosisPreview as globals — both set by gc-pressure-narrative.js and gc-diagnosis.js before page wiring runs.
- Use simResult.meta.problems (not a hardcoded constant) when computing problem proportions.
- Module 04 root is canonical 04.01 at `modules/mix-mapper/`, titled "Epistemic Bets" under "Management Mix Mapper".
- Mix Mapper SVG colors: never use color-mix(…, transparent) via D3 .attr() — broken on iOS WebKit. Use D3 .style() for all visual properties (fill, stroke, fill-opacity, stroke-opacity) on SVG elements.
- Mix Mapper SVG text: dominant-baseline and text-anchor must be CSS properties on the label class in `css/pages/mix-mapper.css`, not SVG presentation attributes.
- buildColors() reads --viz-* token tier (--viz-ink-faint, --viz-ink-ghost, --viz-sage, --viz-rust, etc.). Do not revert to --ink-* UI tokens.

## Task Templates

### Feature change
1. Load foundation pack + relevant conditional docs
2. Implement
3. Add/update tests
4. Run `node tests/run-all.js`
5. Update `README.md` if behaviour or IA changed

### Bug fix
1. Reproduce
2. Patch minimal scope
3. Add regression test where feasible
4. Run `node tests/run-all.js`
5. Document if user-facing semantics changed

### Docs-only change
1. Edit tracked docs only
2. Keep aligned with code as source of truth
3. Validate links/references if conventions changed

## Final Response Contract

Report on completion:
1. What changed (files + intent)
2. Tests run and result
3. Residual risks or follow-ups
