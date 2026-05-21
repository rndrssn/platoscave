---
id: GUIDE-architecture
type: GUIDE
title: Front-End Architecture Guide
status: ACTIVE
created: 2026-03-19
updated: 2026-04-01
owner: Robert Andersson
relates_to: [CORE, REFERENCE-gc-model-semantics, REFERENCE-gc-viz-typography, REFERENCE-css-architecture]
tags: [architecture, frontend]
load_when: [feature_work, gc_logic_changes]
do_not_load_when: [copy_only_changes]
token_cost_estimate: medium
---

# Front-End Architecture Guide

## Layers

- HTML: structure and script wiring. Script load order is the dependency graph — there is no bundler.
- CSS: layered files via `css/main.css` (fonts → tokens → base → layout → components → utilities → themes → gc-viz → pages).
- JS logic: `modules/garbage-can/runtime/gc-simulation-config.js`, `modules/garbage-can/runtime/gc-simulation-core.js`, `modules/garbage-can/runtime/gc-simulation.js`, `modules/garbage-can/runtime/gc-scoring.js`, `modules/garbage-can/runtime/gc-diagnosis.js`, `modules/garbage-can/runtime/gc-viz-config.js`, `modules/garbage-can/runtime/gc-viz-timing.js`, `modules/garbage-can/runtime/gc-viz-helpers.js`, `modules/garbage-can/runtime/gc-viz.js`, `modules/garbage-can/runtime/gc-pressure-narrative.js`.
- JS page wiring: `modules/garbage-can/assess/assess.js` and `modules/garbage-can/explorer/explorer.js`.
- Module 05 graph data wiring: `modules/experience-skill-graph/graph-data-loader.js` + `modules/experience-skill-graph/data/*.md`.

## Nav Theme Contract

- Shared nav selectors live in `css/components.css`.
- Theme files should override nav appearance via `--nav-*` tokens in their root theme token block, not by overriding `.main-nav` directly.
- This avoids hidden cascade collisions where theme CSS silently masks component-level nav fixes.

## GC Simulation Pipeline (full)

### Shared by Assess and Explorer

```
User input
    │
    ├── [Assess] scoreResponses(responses[12])
    │     └── returns { energyLoad, decisionStructure, accessStructure }
    │           energyLoad → aliased to problemIntensity
    │           problemInflow → hardcoded 'moderate' (see design note below)
    │
    ├── [Explorer] direct dropdown selection
    │     └── { problemIntensity, problemInflow, decisionStructure, accessStructure }
    │
    ▼
getDiagnosis(decisionStructure, accessStructure, 0)
    └── preview only (unresolvedShare=0); trailing sentence stripped by getDiagnosisPreview()

buildGcPressureNarrative(intensity, inflow, decision, access)   ← modules/garbage-can/runtime/gc-pressure-narrative.js
    └── returns { problemSummary, coordinationSummary, synthesis }

    ▼
runGarbageCanSimulationAsync({ problemIntensity, problemInflow, decisionStructure, accessStructure })
    └── buildSimulationContext() → validates params, resolves matrices/vectors
    └── 100 Monte Carlo iterations (chunked via setTimeout for UI responsiveness)
    └── finalizeSimulationResult() → proportions + tick snapshots
    └── returns simResult { resolution, oversight, flight,
                            choiceResolution, choiceOversight, choiceFlight,
                            problemResolved, problemDisplaced, problemAdrift,
                            problemInForum, problemNeverEntered,
                            meta: { choices, problems, periods, textScale },
                            ticks: [...] }

    ▼
getDiagnosis(decisionStructure, accessStructure, unresolvedShare)
    └── unresolvedShare = 1 − (simResult.problemResolved / simResult.meta.problems)
    └── full body with interpolated percentage

drawViz(simResult)              ← gc-viz.js / D3
drawPositioning(raw)            ← Assess only
```

### Design note: hardcoded problemInflow in Assess

`assess.js` fixes `problemInflow = 'moderate'` regardless of survey responses. This is intentional:

- The 12-question survey is designed to capture energy load (Q0–Q4) and structural parameters (Q5–Q11).
- Inflow timing is a more technical parameter that requires explicit choice; it is not derivable from the survey questions without adding a dedicated question group.
- Explorer exposes all four parameters independently, including inflow.
- If a future version of the Assess survey adds an inflow question, this constant should be replaced with the scored value.

### Parameter aliasing (legacy compat)

`gc-simulation.js` accepts both `problemIntensity` and the legacy `energyLoad`:

```js
const intensityKey = problemIntensity || energyLoad;
const inflowKey    = problemInflow || problemIntensity || energyLoad;
```

New callers should use `problemIntensity` and `problemInflow` explicitly. Do not rely on the fallback chain for new code.

## Script load order (GC pages)

Both `assess/index.html` and `explorer/index.html` load scripts in this order:

```
d3.v7.min.js
gc-simulation-config.js
gc-simulation-core.js
gc-simulation.js
gc-scoring.js          ← assess only
gc-diagnosis.js
gc-viz-config.js
gc-viz-timing.js
gc-viz-helpers.js
gc-viz.js
gc-pressure-narrative.js      ← must precede page wiring
js/nav-controller.js
assess.js / explorer.js
```

`window.buildGcPressureNarrative` and `window.getDiagnosisPreview` are always available when page wiring runs. The wrapper functions in assess.js and explorer.js call these globals directly with no fallback.

## Key utility: getDiagnosisPreview()

`getDiagnosisPreview(body)` is exported from `gc-diagnosis.js`. It strips the simulation-dependent trailing sentence from a diagnosis body string, for use before a simulation result is available.

The regex is owned by `gc-diagnosis.js` because it is tightly coupled to the exact text format of `DIAGNOSES`. Do not duplicate it in page wiring files.

## Module 05 Graph Data Architecture

### Source of truth

- Graph content is authored in Markdown notes under `modules/experience-skill-graph/data/`.
- `data/index.md` is the loader entry point and must link all graph notes via `[[wikilinks]]`.

### Note schema contract

Each note must include frontmatter:
- `id`: stable slug
- `type`: `category` | `skill` | `experience`
- `label`: display text
- `order`: numeric sort key

### Link semantics contract

- `experience` notes link to `skill` notes.
- `skill` notes link to `category` notes.
- Loader deduplicates links and builds:
  - node sets (`categories`, `skills`, `experiences`)
  - `experienceOrder` map for chronology positioning
  - `skillCategory` map for lane positioning

### Runtime flow (Module 05.01)

1. `index.html` loads `graph-data-loader.js`.
2. Loader fetches `data/index.md` and resolves linked note files.
3. Loader parses note frontmatter + Obsidian links.
4. D3 rendering uses parsed nodes/links and existing interaction logic.

### Change impact

- Content-only graph edits should be made in `data/*.md`, not hardcoded in HTML/JS.
- If schema or loader behavior changes, update this guide and `README.md` in the same change.

## Module 04 Management Mix Mapper Architecture

`modules/mix-mapper/` uses split runtime files (loaded in order by `index.html`):

1. `mix-mapper-data.js`
   - Graph source-of-truth (nodes, links, comparison rows, complexity narratives).
2. `mix-mapper-semantics.js`
   - Lens semantics and role classifiers (`process`, `assumptions`, `learning`).
3. `mix-mapper-geometry.js`
   - Path routing and SVG marker builders.
4. `mix-mapper-layout-utils.js`
   - Responsive layout metrics, lane header text fitting, node label fit, and comparison label/highlight layout.
5. `mix-mapper-node-utils.js`
   - Node projection (lane/step to x-y), node shape path generation, and graph-connected node neighborhood helpers.
6. `mix-mapper-mode-policy.js`
   - Lens style policy and motion policy (line styling, pulse opacity/speed, highlight opacity).
7. `mix-mapper-tooltip.js`
   - Tooltip and ARIA label content builders.
8. `mix-mapper-interactions.js`
   - Link/node/mode-control interaction bindings (hover, focus, keyboard, tooltip trigger, aria updates).
9. `mix-mapper-renderer.js`
   - D3 layer assembly and SVG render orchestration (defs, lanes, edges, nodes, labels, and comparison overlay).
10. `mix-mapper.js`
   - Runtime coordination (state, mode transitions, pulse animation lifecycle, resize/motion hooks, and module wiring).

Contract:
- Canonical module root is `/modules/mix-mapper/` and represents `04.01`.
- Current section title for `04.01` is "Epistemic Bets" under module title "Management Mix Mapper".
- Business narrative lives in `mix-mapper-data.js` and must not be silently changed during visual refactors.
- Mode semantics must be centralized in `mix-mapper-semantics.js`; avoid duplicating role logic in runtime orchestration.
- Layout and SVG text fitting policy must be centralized in `mix-mapper-layout-utils.js`; avoid duplicating text-wrap/layout logic in runtime orchestration.
- Node projection and shape policy must be centralized in `mix-mapper-node-utils.js`; avoid duplicating node geometry/graph-neighborhood logic in runtime orchestration.
- Mode visual policy and pulse policy must be centralized in `mix-mapper-mode-policy.js`; avoid duplicating style logic in runtime orchestration.
- Interaction bindings must be centralized in `mix-mapper-interactions.js`; avoid duplicating hover/focus/keyboard/tooltip wiring in runtime orchestration.
- SVG layer assembly should be centralized in `mix-mapper-renderer.js`; avoid duplicating render-layer construction in runtime orchestration.
- Geometry changes must preserve lane-side routing policy (complexity left, traditional right) unless explicitly changed with tests.

## GC Viz architecture contract

1. Simulation returns renderer metadata (`meta.choices`, `meta.problems`, `meta.periods`). Page wiring uses `simResult.meta.problems` for proportions — not hardcoded constants.
2. `gc-viz.js` reads dimensions from simulation metadata/defaults instead of hardcoded simulation globals.
3. Visualization typography is controlled by CSS tokens and classes (see `docs/20-reference/REFERENCE-gc-viz-typography.md`), not inline D3 font attrs.
4. CO event semantics are computed from a shared delta function and reused by legend + motion rendering to avoid drift.
5. Node imports of `gc-simulation.js` must be side-effect free; validation runs only when executed directly.

## Alignment contract

Any change to model semantics must update:
1. code
2. tests
3. `docs/20-reference/REFERENCE-gc-model-semantics.md`

Any change to the diagnosis text format (DIAGNOSES in `gc-diagnosis.js`) must verify that `getDiagnosisPreview()` still strips the correct trailing sentence.
