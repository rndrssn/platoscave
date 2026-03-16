# HANDOFF.md

## Ready for Claude Code

### Tech debt batch 2: Extract inline JS into dedicated files (TD-001, TD-004)
- Files: multiple (see below)
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, and `docs/TECH-DEBT-tracker.md` before touching anything

---

## Prerequisites

Batch 1 must be complete. Specifically:
- `gc-diagnosis.js` exists and is loaded by both assess and explorer pages
- `gc-scoring.js` handles 12 questions and is loaded by the assess page
- Inline `DIAGNOSES`, `DIAGNOSIS_CLUSTERS`, `getDiagnosis`, `computeScoring`, `classifyEnergy`, `classifyStructure12` have been removed from the inline `<script>` blocks

If any of these are still inline, complete Batch 1 first.

---

## Overview

Three new JS files, one per concern:

| File | Purpose | Used by |
|------|---------|---------|
| `gc-viz.js` | Shared visualization: drawViz, renderTick, probAttrs, positioning diagram, showEndState, color tokens, tick helpers | Assess, Explorer |
| `modules/garbage-can/assess/assess.js` | Assess page wiring: questionnaire flow, form submission, collapse/expand, mini-nav | Assess only |
| `modules/garbage-can/explorer/explorer.js` | Explorer page wiring: dropdown handlers, panel run logic, diagnosis update on change | Explorer only |

After extraction, each HTML page's `<script>` block should contain only the list of `<script src="...">` tags. No inline logic.

**Rule: move code only, no logic changes. Behaviour must be identical before and after.**

---

## Step 1 — Create gc-viz.js

Create `gc-viz.js` at the repo root (same level as `gc-simulation.js`).

### What goes in gc-viz.js

Extract these sections from the assess page's inline `<script>`:

```
Color tokens (const C = { ... })
Per-tick outcome counters (computeTickCounters)
isDeadTick function
floatPos function
attachedPos function
probAttrs function
drawPositioning function
drawViz function (including renderTick, showEndState as inner functions)
```

### Public API

The file exposes these globals:

```js
'use strict';

/**
 * gc-viz.js
 * Organised Anarchy — Visualization
 *
 * Shared d3 rendering for the Garbage Can Model simulation.
 * Used by assess and explorer pages.
 *
 * Dependencies: d3.js, gc-simulation.js (for M, W, PERIODS constants)
 *
 * Exposes:
 *   C               - color tokens object
 *   drawPositioning(raw) - renders the three-axis positioning diagram
 *   drawViz(simResult, energyLoad, decisionStructure, accessStructure) - runs the simulation animation
 */
```

### Key considerations

1. **`drawViz` contains closures** — `renderTick`, `showEndState`, `isDeadTick`, `probAttrs`, `floatPos`, `attachedPos` are all defined inside or before `drawViz`. They must stay together. Move the entire `drawViz` function with all its inner functions as one block.

2. **DOM element IDs** — `drawViz` references fixed IDs like `viz-svg`, `sim-summary`, `sum-header`, etc. These must exist in the HTML of any page that calls `drawViz`. Both assess and explorer already have these.

3. **The explorer page has a parameterised version** — `drawVizPanel` with suffixed IDs. For now, keep the explorer's parameterised version in `explorer.js`. Later, `gc-viz.js` could accept a suffix parameter, but that's a logic change — out of scope for this refactor.

4. **`showEndState` references `pctRes`, `pctOver`, `pctFli`** — these are computed in `drawViz` before calling `showEndState`. They stay together inside `drawViz`.

5. **`M`, `W`, `PERIODS`** — these constants come from `gc-simulation.js` which is loaded before `gc-viz.js`. They are globals. No import needed.

### File structure

```js
'use strict';

/**
 * gc-viz.js
 * [JSDoc as above]
 */

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  // Copy exactly from assess inline JS
};

// ─── Per-tick outcome counters ───────────────────────────────────────────────
function computeTickCounters(ticks) {
  // Copy exactly from assess inline JS
}

// ─── Positioning diagram ─────────────────────────────────────────────────────
function drawPositioning(raw) {
  // Copy exactly from assess inline JS
}

// ─── Visualization ───────────────────────────────────────────────────────────
function drawViz(simResult, energyLoad, decisionStructure, accessStructure) {
  // Copy the entire function including all inner functions:
  //   isDeadTick, floatPos, attachedPos, probAttrs, renderTick, stepTick, showEndState
  // Copy exactly from assess inline JS
}
```

---

## Step 2 — Create assess.js

Create `modules/garbage-can/assess/assess.js`.

### What goes in assess.js

Everything that remains in the assess page's inline `<script>` after removing viz code, diagnosis, and scoring:

```
Scroll restoration
Nav toggle
Questionnaire collapse/expand
Results mini-nav click handling
Questionnaire step navigation (Q_GROUPS, validateGroup, advanceGroup)
Continue/Submit button enable handlers
Stage reveal (showStage)
Form submission handler
```

### File structure

```js
'use strict';

/**
 * assess.js
 * Self-Assessment page — questionnaire flow and wiring
 *
 * Dependencies: gc-simulation.js, gc-scoring.js, gc-diagnosis.js, gc-viz.js, d3.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── Nav toggle ──────────────────────────────────────────────────────────────
document.querySelector('.nav-mobile-toggle').addEventListener('click', function () {
  document.querySelector('.nav-links').classList.toggle('is-open');
});

// ─── Questionnaire collapse/expand ───────────────────────────────────────────
// [Copy from inline]

// ─── Results mini-nav ────────────────────────────────────────────────────────
// [Copy from inline]

// ─── Questionnaire step navigation ───────────────────────────────────────────
// [Copy Q_GROUPS, validateGroup, advanceGroup, button handlers from inline]

// ─── Stage reveal ────────────────────────────────────────────────────────────
// [Copy showStage from inline]

// ─── Form submission ─────────────────────────────────────────────────────────
// [Copy form submit handler from inline]
// This handler calls: scoreResponses (from gc-scoring.js),
//   runGarbageCanSimulation (from gc-simulation.js),
//   getDiagnosis (from gc-diagnosis.js),
//   drawPositioning, drawViz (from gc-viz.js)
```

---

## Step 3 — Create explorer.js

Create `modules/garbage-can/explorer/explorer.js`.

### What goes in explorer.js

All inline JS from the explorer page. This includes the parameterised viz functions (`drawVizPanel`, `showEndStatePanel`, `runPanel`) and the dropdown/button wiring.

```js
'use strict';

/**
 * explorer.js
 * Simulation Explorer page — parameter selection and simulation wiring
 *
 * Dependencies: gc-simulation.js, gc-diagnosis.js, d3.js
 * Note: uses its own drawVizPanel (parameterised) rather than gc-viz.js drawViz.
 *       Future refactor: make gc-viz.js accept a suffix parameter.
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
// [Copy from inline]

// ─── Nav toggle ──────────────────────────────────────────────────────────────
// [Copy from inline]

// ─── Color tokens ────────────────────────────────────────────────────────────
// NOTE: duplicated from gc-viz.js because drawVizPanel is self-contained.
// Future refactor: import C from gc-viz.js and make drawViz accept a suffix.

// ─── Parameterised visualization ─────────────────────────────────────────────
// [Copy drawVizPanel, showEndStatePanel, runPanel from inline]

// ─── Dropdown change handlers ────────────────────────────────────────────────
// [Copy from inline]

// ─── Run button handlers ─────────────────────────────────────────────────────
// [Copy from inline]
```

---

## Step 4 — Update HTML files to load the new scripts

### Assess page — `modules/garbage-can/assess/index.html`

Replace the entire `<script>...</script>` block (from `<script>` at line 374 to `</script>` at line 1370) with:

```html
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="../../../gc-simulation.js"></script>
  <script src="../../../gc-scoring.js"></script>
  <script src="../../../gc-diagnosis.js"></script>
  <script src="../../../gc-viz.js"></script>
  <script src="assess.js"></script>
```

No inline `<script>` block. Six script tags, each with one responsibility.

Note: `gc-diagnosis.js` may already be loaded from Batch 1. Check and don't duplicate.

### Explorer page — `modules/garbage-can/explorer/index.html`

Replace the entire inline `<script>` block with:

```html
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="../../../gc-simulation.js"></script>
  <script src="../../../gc-diagnosis.js"></script>
  <script src="explorer.js"></script>
```

The explorer does NOT load `gc-scoring.js` (no questionnaire) or `gc-viz.js` (uses its own parameterised version). It loads `gc-diagnosis.js` for the organisation type lookup.

---

## Step 5 — Add tests (TD-004)

Create `tests/test-gc-diagnosis.js`:

```js
'use strict';
const { DIAGNOSIS_CLUSTERS, getDiagnosis } = require('../gc-diagnosis.js');

// Test all 9 decision×access combinations produce a valid cluster
const structures = ['unsegmented', 'hierarchical', 'specialized'];
let pass = true;

for (const d of structures) {
  for (const a of structures) {
    const key = `${d}/${a}`;
    const cluster = DIAGNOSIS_CLUSTERS[key];
    if (!cluster) {
      console.log(`FAIL: no cluster for ${key}`);
      pass = false;
      continue;
    }
    const diag = getDiagnosis(d, a, 0.5);
    if (!diag.title || !diag.body) {
      console.log(`FAIL: empty diagnosis for ${key} -> ${cluster}`);
      pass = false;
    } else {
      console.log(`PASS: ${key} -> ${cluster} -> "${diag.title}"`);
    }
  }
}

console.log(pass ? '\nAll diagnosis tests passed.' : '\nSome tests failed.');
```

Create `tests/test-gc-scoring-12.js`:

```js
'use strict';
const { scoreResponses } = require('../gc-scoring.js');

// Archetype tests from PRINCIPLE-organised-anarchy-questions.md
const tests = [
  {
    name: 'University department (high anarchy)',
    responses: [5, 5, 5, 5, 5, 1, 5, 5, 5, 5, 5, 5],
    expect: { energyLoad: 'heavy' }
  },
  {
    name: 'Traditional manufacturer (low anarchy)',
    responses: [1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1],
    expect: { energyLoad: 'light' }
  },
  {
    name: 'Moderate startup',
    responses: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    expect: { energyLoad: 'moderate' }
  }
];

let pass = true;
for (const t of tests) {
  const result = scoreResponses(t.responses);
  const ok = result.energyLoad === t.expect.energyLoad;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${t.name} -> ${result.energyLoad} (expected ${t.expect.energyLoad})`);
  console.log(`  raw: energy=${result.raw.energyScore.toFixed(2)} decision=${result.raw.decisionScore.toFixed(2)} access=${result.raw.accessScore.toFixed(2)}`);
  console.log(`  ${result.energyLoad} / ${result.decisionStructure} / ${result.accessStructure}`);
  if (!ok) pass = false;
}

console.log(pass ? '\nAll scoring tests passed.' : '\nSome tests failed.');
```

Run with:
```bash
node tests/test-gc-diagnosis.js
node tests/test-gc-scoring-12.js
```

---

## Verification

After all files are extracted:

1. **Run tests:**
   ```bash
   node tests/test-gc-diagnosis.js
   node tests/test-gc-scoring-12.js
   ```
   Both should pass.

2. **Assess page:** Open `/modules/garbage-can/assess/`. Complete the questionnaire, get diagnosis, run simulation, check summary. Behaviour must be identical to before the extraction.

3. **Explorer page:** Open `/modules/garbage-can/explorer/`. Select parameters, run simulation. Change parameters, verify diagnosis updates and simulation resets. Behaviour must be identical to before the extraction.

4. **Console:** No errors on either page.

5. **Check HTML files:** The assess page's `<script>` block should contain only `<script src="...">` tags. No inline JS. Same for the explorer page.

---

## Notes
- **Move code only, no logic changes.** If something doesn't work after extraction, the cause is a missing variable, wrong scope, or wrong load order — not a logic bug.
- **Load order matters.** Scripts load synchronously in order. `gc-simulation.js` must load before `gc-viz.js` (provides M, W, PERIODS). `gc-viz.js` must load before `assess.js` (provides drawViz, drawPositioning, C).
- The explorer's `drawVizPanel` duplicates viz code with suffixed IDs. This duplication is accepted for now — tracked as future refactor to make `gc-viz.js` accept a suffix parameter.
- The color tokens `C` are duplicated between `gc-viz.js` and `explorer.js`. Accepted for now — same reason.
- After this batch, update `docs/TECH-DEBT-tracker.md`: move TD-001 and TD-004 to Resolved.
- Stay on `experiment/organised-anarchy-mapper`
