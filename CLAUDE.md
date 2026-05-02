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

**Rollback recommendation gate:**
- If solving effort grows beyond expected user benefit, or surprising regressions appear, recommend rollback to the last stable branch/commit (prior breakpoint) before continuing.

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

### Conditional (load when relevant)

| Task involves | Load |
|---------------|------|
| GC simulation, scoring, diagnosis, viz | `modules/garbage-can/runtime/gc-simulation.js`, `modules/garbage-can/runtime/gc-viz.js`, `modules/garbage-can/assess/assess.js`, `modules/garbage-can/explorer/explorer.js` |
| Module 06 Ambiguity to Clarity | `modules/ambiguity-clarity/index.html`, `modules/ambiguity-clarity/section-map/index.html`, `modules/ambiguity-clarity/section-map/section-map.js`, `css/pages/the-descent.css` |
| UI, CSS, navigation, IA | `docs/10-guides/GUIDE-architecture.md`, `docs/40-principles/PRINCIPLE-coding-standards.md`, `docs/20-reference/REFERENCE-css-architecture.md`, `docs/20-reference/navigation-patterns.md` |
| Module 04 Learning & Feedback | All files in `modules/learning-feedback/*` + relevant contract tests in `tests/` |
| Products Over Projects module | `modules/products-over-projects/index.html`, `modules/products-over-projects/taxonomy/index.html`, `modules/products-over-projects/assessment/index.html`, `modules/products-over-projects/assessment/products-over-projects-assessment.js`, `css/pages/products-over-projects.css`, `tests/test-products-over-projects-assessment.js` |
| Flow & Queuing module | `modules/flow-queuing/index.html`, `modules/flow-queuing/taxonomy/index.html`, `modules/flow-queuing/explore/index.html`, `modules/flow-queuing/concept-graph/index.html`, `modules/flow-queuing/derivation/index.html`, `modules/flow-queuing/flow-queuing-model.js`, `modules/flow-queuing/flow-queuing.js`, `modules/flow-queuing/concept-graph/concept-graph.js`, `css/pages/flow-queuing.css`, `docs/20-reference/REFERENCE-flow-queuing-semantics.md`, `tests/test-flow-queuing-explore-contract.js` |
| Force graph (Skills, Concept Map) | `modules/experience-skill-graph/index.html`, `modules/flow-queuing/concept-graph/concept-graph.js`, `js/force-graph-utils.js`, `css/components/force-graph-states.css` |
| Cases / Satellite Index | `cases/satellite-index/index.html`, `cases/satellite-index/demo/index.html`, `cases/satellite-index/demo/satellite-index.js`, `css/pages/satellite-index.css`, `tests/test-satellite-index-contract.js` |
| Semantics and labels | Treat implementation and tests as canonical; align across UI, summaries, legends |

Full rules: `docs/00-core/CORE-loading-rules.md`.

Profiles:
- `fast`: foundation pack + one conditional doc max
- `deep`: foundation pack + all relevant conditional docs up to 8k token budget

## Hard Gates (pre-commit)

**Always run before committing:** `node tests/run-all.js`

Includes navigation link checks and notes build checks.

**Optional** (auto-skips without Playwright): `node tests/test-browser-smoke-optional.js`

**Semantics/copy changes:** keep terms aligned with `docs/20-reference/REFERENCE-gc-model-semantics.md` (GC) and `docs/20-reference/REFERENCE-flow-queuing-semantics.md` (Flow & Queuing); update relevant docs in the same change.

**Merge readiness:** tests pass, no docs integrity errors, no known mismatch between code behavior and documented semantics.

## Change Trigger Matrix

| Changed | Also update |
|---------|-------------|
| GC model math or outputs | Tests + user-facing summary logic/copy |
| Flow & Queuing model math, symbols, or labels | Tests + `docs/20-reference/REFERENCE-flow-queuing-semantics.md` |
| UI labels/readouts | All affected surfaces (legend, runtime text, summary) |
| Module title, section name, or IA label | `modules/index.html`, `js/nav-controller.js`, module page labels, redirect copy |
| Contributor or release workflow | `README.md` + tracked workflow docs |
| `CLAUDE.md` | `AGENTS.md` must remain byte-for-byte identical (enforced by `scripts/check-claude-links.js`) |
| Vendored library version bumped (D3, KaTeX) | `colophon/index.html`, `docs/10-guides/GUIDE-vendor-dependency-review.md` |
| Cases landing or satellite-index framing changed | `cases/index.html`, `cases/satellite-index/index.html` — keep IA and back-links consistent |

## Module IA Contract

- Live module root is canonical local section `01` at /modules/<slug>/
- Root module page must have:
  - `class="module-back-link"` pointing to `../`
  - `class="module-sub-nav"`
  - Exactly one active link: class module-sub-nav-link--active, href="./", aria-current="page", section number `01`
- Never use root hard redirect (meta refresh) for live module roots
- Legacy nested paths may redirect **to** root, never the reverse
- New module scaffold: `node scripts/new-module.js` with --slug and --title flags

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
| Module 06 runtime | `modules/ambiguity-clarity/index.html`, `modules/ambiguity-clarity/section-map/index.html`, `modules/ambiguity-clarity/section-map/section-map.js`, `css/pages/the-descent.css` |
| Module 04 runtime | `modules/learning-feedback/mix-mapper-data.js`, `modules/learning-feedback/mix-mapper-semantics.js`, `modules/learning-feedback/mix-mapper-geometry.js`, `modules/learning-feedback/mix-mapper-layout-utils.js`, `modules/learning-feedback/mix-mapper-node-utils.js`, `modules/learning-feedback/mix-mapper-mode-policy.js`, `modules/learning-feedback/mix-mapper-tooltip.js`, `modules/learning-feedback/mix-mapper-interactions.js`, `modules/learning-feedback/mix-mapper-renderer.js`, `modules/learning-feedback/mix-mapper.js` |
| Products Over Projects runtime | `modules/products-over-projects/index.html`, `modules/products-over-projects/taxonomy/index.html`, `modules/products-over-projects/assessment/index.html`, `modules/products-over-projects/assessment/products-over-projects-assessment.js`, `css/pages/products-over-projects.css` |
| Flow & Queuing runtime | `modules/flow-queuing/index.html`, `modules/flow-queuing/taxonomy/index.html`, `modules/flow-queuing/explore/index.html`, `modules/flow-queuing/derivation/index.html`, `modules/flow-queuing/flow-queuing-model.js`, `modules/flow-queuing/flow-queuing.js`, `modules/flow-queuing/concept-graph/concept-graph.js` |
| Flow & Queuing math rendering | `assets/vendor/katex/katex.min.css`, `assets/vendor/katex/katex.min.js`, `js/katex-render.js` |
| Force-graph shared layer | `js/force-graph-utils.js`, `css/components/force-graph-states.css` |
| Cases / Satellite Index | `cases/index.html`, `cases/satellite-index/index.html`, `cases/satellite-index/demo/index.html`, `cases/satellite-index/demo/satellite-index.js`, `css/pages/satellite-index.css` |
| Tests | `tests/run-all.js` |

**Non-negotiable constraints:**

- Assess path fixes problemInflow to 'moderate' — survey does not capture inflow timing. Explorer exposes all four parameters. See `docs/10-guides/GUIDE-architecture.md`.
- Page wiring calls window.buildGcPressureNarrative and window.getDiagnosisPreview as globals — both set by gc-pressure-narrative.js and gc-diagnosis.js before page wiring runs.
- Use simResult.meta.problems (not a hardcoded constant) when computing problem proportions.
- Module 06 root is canonical local section `01` at `modules/ambiguity-clarity/`; Clarity Map is local section `02` at `modules/ambiguity-clarity/section-map/`.
- Clarity Map anchor switch behavior is part of the feature contract: activating the shadow anchor row toggles mode and must stay keyboard-accessible (Enter/Space).
- Module 04 root is canonical local section `01` at `modules/learning-feedback/`, titled "Epistemic Bets" under "Learning & Feedback".
- Products Over Projects root is canonical local section `01` at `modules/products-over-projects/`. Sections: `01` Risk Lens, `02` Taxonomy (`modules/products-over-projects/taxonomy/`), `03` Assessment (`modules/products-over-projects/assessment/`).
- Products Over Projects is written in an academic, risk-management tone. Avoid Substack/Medium-style hooks and ideology framing. The core claim is product-mode versus project-mode as a dominant residual-risk distinction, not "products good, projects bad."
- Products Over Projects assessment classifies residual risk families: product uncertainty, execution uncertainty, and hazard/control exposure. Keep classifier behavior covered by `tests/test-products-over-projects-assessment.js`.
- Products Over Projects assessment result scorecard denominators must be derived from each family's slider count multiplied by 3 (the scale maximum). Never replace with hardcoded fraction suffixes such as "15" for product or "9" for control.
- Products Over Projects should refer to familiar risk-management frameworks where relevant, including ISO 31000, IEC 31010, COSO ERM, PMI risk management, FMEA/FMECA, bowtie analysis, NIST RMF, ISO/IEC 27005, HACCP, ISO 14971, and ICH Q9(R1).
- Mix Mapper SVG colors: never use color-mix(…, transparent) via D3 .attr() — broken on iOS WebKit. Use D3 .style() for all visual properties (fill, stroke, fill-opacity, stroke-opacity) on SVG elements.
- Mix Mapper SVG text: dominant-baseline and text-anchor must be CSS properties on the label class in `css/pages/mix-mapper.css`, not SVG presentation attributes.
- Mix Mapper complexity feedback/learning pulses travel backward on their arc, dwell at the absorbing node, then re-enter the next downstream primary flow segment. Do not add node pulse/glow unless explicitly requested.
- Mix Mapper legend order is Learning, Process, Assumptions. Active Learning emphasizes moving dots only; active Assumptions owns active blue/slate arc emphasis.
- buildColors() reads --viz-* token tier (--viz-ink-faint, --viz-ink-ghost, --viz-sage, --viz-rust, etc.). Do not revert to --ink-* UI tokens.
- Flow & Queuing module root is canonical local section `01` at `modules/flow-queuing/`. Sections: `01` Flow and Waiting, `02` Taxonomy (`modules/flow-queuing/taxonomy/`), `03` Explore (`modules/flow-queuing/explore/`), `04` Concept Map (`modules/flow-queuing/concept-graph/`), `05` M/M/1 Derivation (`modules/flow-queuing/derivation/`).
- Flow & Queuing Explore preset behavior: there is no standalone reshuffle button. Re-clicking the currently active preset reseeds local variability while preserving preset averages.
- Flow & Queuing Explore chart token contract: bar fills use the `--ink-ghost` UI neutral tier; the capacity reference line uses `--rust` accent. Do not use `--viz-*` data-viz tokens for Explore bar fills.
- Flow & Queuing Explore must include a `[data-queue-fallback]` element that is visible by default and hidden by JS on successful D3 init. Do not remove this element.
- Flow & Queuing symbol labels use non-division notation for readability: `WIP (L)`, `Lead time (W)`, `Arrival rate (λ)`, `Service capacity (μ)`, `Utilization (ρ)`, `Cₐ`, `Cₛ`.
- Flow & Queuing Concept Map semantics: dashed links (`kind: contradicts`) represent explicit contradiction edges from assumptions.
- Flow & Queuing section 01 (Flow and Waiting) loads KaTeX for math rendering: `assets/vendor/katex/katex.min.css` in the head, then `assets/vendor/katex/katex.min.js` + `js/katex-render.js` at end of body. No CDN fallback by design. Equations use `data-formula` attribute on figure elements with class `queue-machine-equation`.
- Flow & Queuing section 05 (M/M/1 Derivation) must use scientific-article equation treatment: equations are in-flow display math with `data-formula` and right-aligned equation numbers; do not use equation `figcaption` content, hidden or visible, as the source of explanatory prose. Put definitions and explanatory text in visible essay-body prose.
- M/M/1 derivation assumptions must stay explicit: homogeneous Poisson arrivals, independent exponential service times, one work-conserving server, infinite waiting room/no lost arrivals, independent arrival and service processes, and stability `λ < μ`.
- M/M/1 memoryless-property graphics must show the conditional residual time correctly: after conditioning on survival past `s₀`, the residual variable is shifted back to zero and has the same exponential density. Do not represent the result only as an unnormalised tail of the original density.
- Force-directed graphs (Skills graph, Concept Map) share interaction-state classes (`is-dim`, `is-related`, `is-group-focus`, `is-active`) defined in `css/components/force-graph-states.css`, and shared focus/legend-filter helpers in `js/force-graph-utils.js`. New force graphs must use these classes and helpers; page-local visual overrides are allowed when these shared classes remain the source of interaction state.
- Force graphs use the light/pastel palette tier (`--rust-light`, `--gold`, `--sage-light`) for node fills. Do not use saturated `--viz-*` data-viz tokens for force-graph nodes.
- Force graph viz chrome (legend, helper, detail panel, node labels) uses mono uppercase microtype: var(--mono) at ~0.6rem with letter-spacing 0.05 to 0.06em and text-transform uppercase.
- Cases hierarchy (`cases/`) is intentionally hidden from the main nav and from `js/module-route-data.js`. Do not add cases entries to the nav controller or module route data.
- Cases pages follow the same HTML shell pattern as modules (back-link, sub-nav, footer nav) but are not subject to the module IA contract tests. The `cases/` tree is not scanned by `tests/test-module-landing-pattern-contract.js` or `tests/test-nav-modules-menu-contract.js`.
- Satellite Index live pipeline is connected: the WORKER_URL constant in `cases/satellite-index/demo/satellite-index.js` points to the deployed Cloudflare Worker at https://satellite-worker.platoscave.workers.dev (not a secret, safe to commit). The Worker is a separate project outside this repo. `runAnalysis()` fetches the /ndvi and /image endpoints in parallel; `generateNdviGrid()` is the fallback on Worker, imagery, or decode failure.
- `MAPTILER_API_KEY` in `cases/satellite-index/demo/satellite-index.js` is a client-side tile access key, domain-restricted to rndrssn.github.io and localhost. It is not a backend secret and is safe to commit. Do not treat it as a sensitive credential.
- MapLibre GL JS and Plotly.js load from exact-pinned jsdelivr CDN URLs in the Satellite Index demo. No vendored copies. This is an intentional PoC decision — do not vendor these unless the project graduates beyond PoC.
- Satellite Index demo must guard missing MapLibre/Plotly globals and show unavailable states instead of throwing. `runAnalysis()` must reset busy/button state through a final UI-reset path after data or render failures.
- Satellite Index live Worker calls are viewport-guarded: `MAX_LIVE_VIEWPORT_KM` is 2 km per viewport dimension. Larger viewports must skip the /ndvi and /image endpoints, render fixture data, and label metadata/status as live-skipped.
- Satellite Index grid sizing is adaptive: `MIN_GRID_SIZE` 64, `SMALL_VIEWPORT_GRID_SIZE` 128 at or below 10 hectares, `MAX_GRID_SIZE` 192. This is a request/render sampling policy, not a claim of source resolution beyond Sentinel's native data.
- Satellite Index overview/demo copy must describe the current data path as live-first with fixture fallback. Do not reintroduce fixture-only or "not yet connected" wording while `WORKER_URL` remains active.
- Satellite Index NDVI colorscale uses the platoscave palette: rust (`#8B3A2A`) → ochre (`#9A7B3A`) → gold (`#B8943A`) → sage-light (`#6B8F62`) → sage (`#4A6741`). Do not replace with a generic green colorscale.
- Satellite Index Plotly scene may include two surface traces: (1) an optional flat luminance base at z = -0.5 from the Worker's RGB PNG, percentile-stretched (2nd–98th percentile), opacity 0.7, warm neutral colorscale; (2) the NDVI surface above it. When enabled, trace order is base first, NDVI second. The Satellite base toggle is a button with `aria-pressed`; it re-renders cached data only and must not refetch Worker data. Do not revert it to a hidden checkbox pattern.
- Satellite Index Plotly scene uses local metric axes from `buildLocalAxes()`: x is easting meters from the west edge, y is northing meters from the south edge, with axis titles `E` and `N`. Do not reintroduce the 3D north arrow unless explicitly requested.
- Satellite Index demo chrome stays intentionally quiet: no `Index NDVI` control label, no map/surface panel labels, and no normal "Surface rendered" status copy above the canvases. Date/cloud coverage for live scenes belongs in the Plotly annotation. Status text is for loading, errors, and live-skipped guard states only.
- Satellite Index NDVI contours: project z=true, usecolormap false, color `#8B3A2A` (rust), width 3, interval 0.1 NDVI units. Projected contours land at z_min of the axis range (-0.5), directly on the satellite base plane.
- Sentinel Hub PNG orientation: row 0 = northernmost latitude. Both `decodeNdviPng` and `decodeRgbToLuminance` call grid.reverse() before returning so row 0 = southernmost, matching Plotly's y=0=south convention and `generateNdviGrid`'s own ordering.
- Satellite Index demo layout: map and NDVI surface side-by-side at ≥900px (1fr 1fr grid); both panels use aspect-ratio 1 (square). On mobile they stack full-width.

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

## Handoff Trigger

Stop feature work and produce a `HANDOFF.md` update when any of these fire:

- The system warns that context is approaching the limit or autocompaction is imminent.
- The user reports context usage at or above 80% (checked via the /context slash command).
- The user explicitly asks for a handoff.

Handoff structure (keep consistent with prior `HANDOFF.md`):

1. Session summary — what this session was about
2. Repository + branch state
3. Commits from this session
4. Files changed (grouped by commit or WIP)
5. Validation run result (`node tests/run-all.js`)
6. Open decisions / WIP
7. Suggested next actions
8. Session start checklist

## Final Response Contract

Report on completion:
1. What changed (files + intent)
2. Tests run and result
3. Residual risks or follow-ups
