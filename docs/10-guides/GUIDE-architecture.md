---
id: GUIDE-architecture
type: GUIDE
title: Front-End Architecture Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-05-24
owner: Robert Andersson
tags: [architecture, frontend]
load_when: [feature_work, ui_css_navigation_ia, gc_logic_changes]
do_not_load_when: [copy_only_changes]
token_cost_estimate: medium
---

# Front-End Architecture Guide

This site is a static, no-bundler front end. HTML files wire page structure and script load order directly; CSS is layered through shared files and page-specific files; JavaScript is plain browser JavaScript with a few exact-pinned runtime libraries where a module needs them.

## Orientation Sources

- `README.md` is the human-facing project overview and catalogue.
- `AGENTS.md` / `CLAUDE.md` is the operational contract for coding agents.
- `REPO_MAP.md` is generated orientation only. Treat tracked source and tests as canonical.
- Contract tests in `tests/` encode many design and IA constraints. Read the relevant test before changing a module with an existing contract.

## Core Layers

- Theme bootstrap: `theme.config.js`, `js/theme-bootstrap.js`
- Global navigation: `js/nav-controller.js`
- Base styles: `css/tokens.css`, `css/themes.css`, `css/base.css`, `css/layout.css`, `css/components.css`, `css/utilities.css`
- Page/module styles: `css/pages/*.css`
- Shared graph chrome: `js/force-graph-utils.js`, `css/components/force-graph-states.css`, `css/components/force-graph-chrome.css`
- Writing build: Markdown under `content/notes/` and `content/articles/`, compiled by `scripts/build-notes.js`

There is no framework runtime and no bundler. When a page loads several scripts, the script order is the dependency graph.

## Navigation and Module IA

Live modules use local section numbering:
- Section `01` is the module root at `modules/<slug>/`.
- Root module pages keep a `module-back-link` to `../`.
- Root module pages keep a `module-sub-nav` with exactly one active root link.
- Legacy paths may redirect to canonical module paths, not the reverse.

When module titles, section labels, or IA change, update:
- the module pages
- `modules/index.html`
- `js/module-route-data.js`
- redirect copy if legacy paths are affected
- relevant contract tests

## Theme and CSS Contract

- Shared nav selectors live in `css/components.css`.
- Theme files override nav appearance with `--nav-*` tokens, not direct `.main-nav` overrides.
- Site-wide link language is centralized in `css/pages/link-language.css`, loaded after page styles.
- Inline prose links, UI links, nav links, and action links should use the shared link tokens instead of page-local color inventions.
- D3/SVG visual properties should use D3 `.style()` where browser CSS parsing matters; avoid SVG `.attr()` with `color-mix(..., transparent)`.

## Writing CMS

Notes and articles use Markdown frontmatter and static generated output:
- Notes source: `content/notes/published/`
- Articles source: `content/articles/published/`
- Output: `notes/`, `articles/`, `tags/`, and `data/*-index.json`

Use `scripts/build-notes.js` for the build and `scripts/publish-note.sh` for one-command writing releases. The script name is historical; it publishes notes and articles.

## Experience-Skill Graph

The Experience/Skills graph is a special profile/CV surface rather than a standard catalogue module.

Source of truth:
- Data file: `content/graph-data/experience-skill-graph.md`
- Loader: `modules/experience-skill-graph/graph-data-loader.js`
- Skills graph page: `modules/experience-skill-graph/index.html`
- CV page: `modules/experience-skill-graph/cv/index.html`

Data format:
- One Markdown file with `## Categories`, `## Skills`, and `## Experiences`.
- Rows use pipe-delimited fields.
- Skill rows link to categories with `[[cat-id]]`.
- Experience rows link to skills with `[[skill-id]]`.

The loader parses the single Markdown file, validates node types, deduplicates links, and builds the graph data consumed by the D3 renderer.

## Learning & Feedback Runtime

Canonical root:
- `modules/learning-feedback/` (`01 Epistemic Bets`)
- `modules/learning-feedback/feedback-debt/` (`02 Feedback Debt`)

The Epistemic Bets visualization uses split runtime files loaded by `modules/learning-feedback/index.html`:

1. `mix-mapper-data.js` — graph data, comparison rows, and narrative copy
2. `mix-mapper-semantics.js` — role classifiers and mode semantics
3. `mix-mapper-geometry.js` — path routing and SVG marker helpers
4. `mix-mapper-layout-utils.js` — responsive layout, lane headers, node labels, comparison labels
5. `mix-mapper-node-utils.js` — node projection, shapes, graph-neighborhood helpers
6. `mix-mapper-mode-policy.js` — visual policy and motion policy
7. `mix-mapper-tooltip.js` — tooltip and ARIA label builders
8. `mix-mapper-interactions.js` — hover, focus, keyboard, tooltip, and aria bindings
9. `mix-mapper-renderer.js` — D3 layer assembly and SVG render orchestration
10. `mix-mapper.js` — state, mode transitions, pulse lifecycle, resize/motion hooks, page wiring

Keep semantics centralized in the semantics/policy files. Avoid duplicating role logic, text fitting, or path routing in the orchestration layer.

## Boundary-free Monitoring Runtime

Canonical root:
- `modules/satellite-index/` (`01 Overview`)
- `modules/satellite-index/three/` (`02 Explorer`)
- `modules/satellite-index/demo/` archived Plotly demo; URL preserved but not part of the module sub-nav

Worker integration:
- Deployed Worker: `https://satellite-worker.platoscave.workers.dev`
- Frontend endpoint: `POST /analysis`
- Source placeholder: `const WORKER_API_KEY = '__WORKER_API_KEY__';`
- Deploy injection: `.github/workflows/deploy.yml`
- Local injection/restore: `scripts/dev-satellite.sh inject|restore`

Explorer context:
- Spectral surfaces come from Sentinel-derived indices when live data is available.
- Fixture surfaces preserve interaction when the live path fails; they are not real crop data.
- Basemap mode uses MapTiler satellite tiles.
- Terrain mode renders MapTiler `contours-v2` vector tiles through MapLibre into a clean contour texture.

Do not fan out browser requests to separate `/ndvi` or `/image` endpoints. The Worker call is viewport-area guarded at 200 hectares.

## Garbage Can Simulation Pipeline

Assess and Explorer share the same model pipeline with different input surfaces.

```
User input
    |
    |-- [Assess] scoreResponses(responses[12])
    |     returns { energyLoad, decisionStructure, accessStructure }
    |     energyLoad -> problemIntensity
    |     problemInflow -> fixed to 'moderate'
    |
    |-- [Explorer] direct controls
          returns { problemIntensity, problemInflow, decisionStructure, accessStructure }

getDiagnosis(decisionStructure, accessStructure, 0)
buildGcPressureNarrative(intensity, inflow, decision, access)
runGarbageCanSimulationAsync({ problemIntensity, problemInflow, decisionStructure, accessStructure })
getDiagnosis(decisionStructure, accessStructure, unresolvedShare)
drawViz(simResult)
```

Assess fixes `problemInflow = 'moderate'` because the survey does not capture inflow timing. Explorer exposes all four parameters.

`gc-simulation.js` accepts legacy `energyLoad` aliases, but new callers should use `problemIntensity` and `problemInflow` explicitly.

## Garbage Can Script Load Order

GC pages load scripts directly. Keep `gc-pressure-narrative.js` before page wiring:

```text
d3.v7.min.js
gc-simulation-config.js
gc-simulation-core.js
gc-simulation.js
gc-scoring.js              (assess only)
gc-diagnosis.js
gc-viz-config.js
gc-viz-timing.js
gc-viz-helpers.js
gc-viz.js
gc-pressure-narrative.js
js/nav-controller.js
assess.js / explorer.js
```

`window.buildGcPressureNarrative` and `window.getDiagnosisPreview` must be available before page wiring runs.

## Change Alignment

When behavior, IA, workflow, or module responsibility changes, update the affected collaborator docs in the same change. Do not perform broad documentation sweeps for unrelated code edits.

Common triggers:
- Module IA/title/section changes: update README, module pages, route data, and tests.
- Runtime API changes: update handover docs, agent contract, and contract tests.
- New JS file or changed file responsibility: update the first file comment with one factual ownership sentence.
- Release workflow changes: update README and `GUIDE-testing-and-release.md`.
- GC model semantics or diagnosis text changes: update implementation, tests, and this guide.
