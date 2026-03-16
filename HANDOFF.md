# HANDOFF.md

## Ready for Claude Code

### Tech debt batch 2: Extract gc-viz.js, assess.js, explorer.js, add tests (TD-001, TD-004)
- Files: multiple (see below)
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, and `docs/TECH-DEBT-tracker.md` before touching anything

---

## Critical rule

**The assess page (`modules/garbage-can/assess/index.html`) is the source of truth for all visualization logic.** The assess page renders correctly. The explorer page has drifted. This handoff eliminates the drift by extracting the assess page's viz code into a shared file that both pages use.

**Move code only. No logic changes. Behaviour must be identical after extraction.**

---

## Prerequisites

Batch 1 must be complete:
- `gc-diagnosis.js` exists at repo root, loaded by both pages
- `gc-scoring.js` handles 12 questions, loaded by assess page
- Inline diagnosis and scoring code removed from both pages

If any of these are still inline, complete Batch 1 first.

---

## Step 1 — Create gc-viz.js from the assess page

Create `gc-viz.js` at the repo root (same level as `gc-simulation.js`).

**Source: `modules/garbage-can/assess/index.html` inline `<script>` block ONLY. Do NOT use any code from the explorer page.**

Extract these sections in order from the assess page:

### 1a — Color tokens
```js
const C = { ... };
```
Copy the entire `C` object exactly as it appears in the assess page.

### 1b — Helper functions
Copy in this order:
- `isDeadTick(tickIdx, ticks)` — note: this function needs access to `ticks`. It may need to be refactored to accept `ticks` as a parameter if it currently accesses it from closure scope. Check the assess page.
- `floatPos(id, svgW)` — may need SVG_W passed as parameter. Check.
- `attachedPos(choiceIdx, slot, total, choiceX, CHOICE_Y, CHOICE_R)` — check what it accesses from closure.

**Important:** Some helper functions may reference variables from `drawViz` closure scope (like `ticks`, `choiceX`, `SVG_W`). If so, they must stay inside `drawViz` as inner functions — do NOT extract them to the top level. Only extract functions that are truly independent.

### 1c — drawPositioning
```js
function drawPositioning(raw) { ... }
```
Copy the entire function from the assess page.

### 1d — drawViz
```js
function drawViz(simResult, energyLoad, decisionStructure, accessStructure) { ... }
```
Copy the ENTIRE function from the assess page, including ALL inner functions:
- All constants: `SVG_W`, `SVG_H`, `CHOICE_R`, `PROB_R`, `PAD_H`, `CHOICE_Y`, `LEGEND_Y`
- `isDeadTick` (if it's inside drawViz)
- `floatPos` (if it's inside drawViz)
- `attachedPos`
- `probAttrs`
- `renderTick`
- `stepTick`
- `showEndState`

Keep every constant, every helper, every d3 selection exactly as the assess page has it. Do not rename, restructure, or parameterise anything.

### 1e — File structure

```js
'use strict';

/**
 * gc-viz.js
 * Organised Anarchy — Shared Visualization
 *
 * D3 rendering for the Garbage Can Model simulation.
 * Source of truth: modules/garbage-can/assess/index.html
 *
 * Dependencies: d3.js, gc-simulation.js (for M, W, PERIODS constants)
 *
 * Exposes:
 *   C                - color tokens
 *   drawPositioning  - three-axis positioning diagram
 *   drawViz          - simulation animation with summary
 */

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  // [exact copy from assess]
};

// ─── Positioning diagram ─────────────────────────────────────────────────────
function drawPositioning(raw) {
  // [exact copy from assess]
}

// ─── Visualization ───────────────────────────────────────────────────────────
function drawViz(simResult, energyLoad, decisionStructure, accessStructure) {
  // [exact copy from assess, including ALL inner functions and constants]
}
```

---

## Step 2 — Create assess.js

Create `modules/garbage-can/assess/assess.js`.

Extract everything that remains in the assess page's inline `<script>` after removing the viz code, diagnosis, and scoring. This is the page-specific wiring.

### What goes in assess.js

```js
'use strict';

/**
 * assess.js
 * Self-Assessment page — questionnaire flow and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-scoring.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── Nav toggle ──────────────────────────────────────────────────────────────
// [copy from assess inline]

// ─── Questionnaire collapse/expand ───────────────────────────────────────────
// [copy from assess inline]

// ─── Results mini-nav ────────────────────────────────────────────────────────
// [copy from assess inline]

// ─── Questionnaire step navigation ───────────────────────────────────────────
// [copy Q_GROUPS, validateGroup, advanceGroup, continue/submit enable handlers]

// ─── Stage reveal ────────────────────────────────────────────────────────────
// [copy showStage]

// ─── Form submission ─────────────────────────────────────────────────────────
// [copy form submit handler]
// This calls: scoreResponses (gc-scoring.js), runGarbageCanSimulation (gc-simulation.js),
//   getDiagnosis (gc-diagnosis.js), drawPositioning, drawViz (gc-viz.js)
```

---

## Step 3 — Create explorer.js

Create `modules/garbage-can/explorer/explorer.js`.

**The explorer now uses the shared `drawViz` from `gc-viz.js` — NOT its own `drawVizPanel`.** Delete `drawVizPanel` and all parameterised viz code entirely.

### What goes in explorer.js

```js
'use strict';

/**
 * explorer.js
 * Simulation Explorer page — parameter selection and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
// [copy from explorer inline]

// ─── Nav toggle ──────────────────────────────────────────────────────────────
// [copy from explorer inline]

// ─── Dropdown change handlers ────────────────────────────────────────────────
// allDropdownsSelected, updateDiagnosis, resetSimulation
// [copy from explorer inline]

// ─── Run simulation ──────────────────────────────────────────────────────────
// Reads dropdown values, calls runGarbageCanSimulation, then drawViz (from gc-viz.js)
// [copy from explorer inline — but use drawViz not drawVizPanel]

// ─── Replay ──────────────────────────────────────────────────────────────────
// [copy from explorer inline]
```

### Critical change for explorer

The explorer's HTML must use the **same element IDs** as the assess page for the viz and summary elements. `drawViz` from `gc-viz.js` references fixed IDs:
- `viz-svg`
- `sim-summary`
- `sum-header`
- `sum-thisrun-label`, `sum-thisrun-resolved`, etc.
- `sum-choices-label`, `sum-choice-resolution`, etc.
- `sum-problems-label`, `sum-prob-resolved`, etc.
- `replay-btn`
- `stochastic-note`

**If the explorer HTML currently uses suffixed IDs** (like `viz-svg-a`, `sim-summary-a`), rename them to match the assess page IDs. Remove all `-a` suffixes from the explorer HTML.

---

## Step 4 — Update HTML files

### Assess page — `modules/garbage-can/assess/index.html`

Replace the entire inline `<script>...</script>` block with script tags only:

```html
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="../../../gc-simulation.js"></script>
  <script src="../../../gc-scoring.js"></script>
  <script src="../../../gc-diagnosis.js"></script>
  <script src="../../../gc-viz.js"></script>
  <script src="assess.js"></script>
```

No inline JS remains. Zero lines between `<script>` and `</script>`.

### Explorer page — `modules/garbage-can/explorer/index.html`

Replace the entire inline `<script>...</script>` block with:

```html
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="../../../gc-simulation.js"></script>
  <script src="../../../gc-diagnosis.js"></script>
  <script src="../../../gc-viz.js"></script>
  <script src="explorer.js"></script>
```

No `gc-scoring.js` (no questionnaire). No inline JS.

Also update the explorer HTML: remove all `-a` suffixed IDs and replace with the standard IDs from the assess page. For example:
- `viz-svg-a` → `viz-svg`
- `sim-summary-a` → `sim-summary`
- `sum-thisrun-label-a` → `sum-thisrun-label`
- `replay-btn-a` → `replay-btn`
- etc.

Remove any Panel B HTML if it still exists.

---

## Step 5 — Add tests (TD-004)

### tests/test-gc-diagnosis.js

```js
'use strict';
var assert = require('assert');
var diag = require('../gc-diagnosis.js');

var structures = ['unsegmented', 'hierarchical', 'specialized'];
var passed = 0;
var failed = 0;

for (var d of structures) {
  for (var a of structures) {
    var key = d + '/' + a;
    var cluster = diag.DIAGNOSIS_CLUSTERS[key];
    try {
      assert(cluster, 'Missing cluster for ' + key);
      var result = diag.getDiagnosis(d, a, 0.5);
      assert(result.title, 'Empty title for ' + key);
      assert(result.body, 'Empty body for ' + key);
      console.log('PASS: ' + key + ' -> ' + cluster + ' -> "' + result.title + '"');
      passed++;
    } catch (e) {
      console.log('FAIL: ' + key + ' — ' + e.message);
      failed++;
    }
  }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

### tests/test-gc-scoring.js

```js
'use strict';
var assert = require('assert');
var scoring = require('../gc-scoring.js');

var tests = [
  {
    name: 'All 5s (high anarchy)',
    responses: [5, 5, 5, 5, 5, 1, 5, 5, 5, 5, 5, 5],
    expect: { energyLoad: 'heavy' }
  },
  {
    name: 'All 1s (low anarchy)',
    responses: [1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1],
    expect: { energyLoad: 'light' }
  },
  {
    name: 'All 3s (moderate)',
    responses: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    expect: { energyLoad: 'moderate' }
  }
];

var passed = 0;
var failed = 0;

for (var t of tests) {
  var result = scoring.scoreResponses
    ? scoring.scoreResponses(t.responses)
    : scoring.computeScoring(t.responses);
  try {
    assert.strictEqual(result.energyLoad, t.expect.energyLoad);
    console.log('PASS: ' + t.name + ' -> ' + result.energyLoad);
    console.log('  raw: energy=' + result.raw.energyScore.toFixed(2) +
      ' decision=' + result.raw.decisionScore.toFixed(2) +
      ' access=' + result.raw.accessScore.toFixed(2));
    passed++;
  } catch (e) {
    console.log('FAIL: ' + t.name + ' -> got ' + result.energyLoad + ', expected ' + t.expect.energyLoad);
    failed++;
  }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

Run with:
```bash
node tests/test-gc-diagnosis.js
node tests/test-gc-scoring.js
```

---

## Verification

### 1. Run tests
```bash
node tests/test-gc-diagnosis.js
node tests/test-gc-scoring.js
```
Both must pass.

### 2. Assess page
Open `/modules/garbage-can/assess/`. Complete questionnaire → diagnosis appears → positioning renders → click "See how decisions play out" → simulation plays → summary appears. **Must look and behave identically to before the extraction.**

### 3. Explorer page
Open `/modules/garbage-can/explorer/`. Select all three dropdowns → diagnosis appears → click "See how decisions play out" → simulation plays → summary appears. **The simulation must now look identical to the assess page** — same circle sizes, same legend, same layout. The previous drift is eliminated because both pages use the same `drawViz` from `gc-viz.js`.

### 4. Console
No errors on either page.

### 5. HTML files
Open both HTML files. Confirm: zero inline `<script>` blocks. Only `<script src="...">` tags.

---

## After verification

Update `docs/TECH-DEBT-tracker.md`:
- Move TD-001 to Resolved with today's date
- Move TD-004 to Resolved with today's date
- Note in TD-004 (duplicated viz code) that it is now resolved — both pages use gc-viz.js

---

## Notes
- **The assess page is the source of truth.** All viz code comes from there. Do not mix in any explorer-specific rendering.
- **Load order matters:** d3 → gc-simulation → gc-diagnosis → gc-viz → page.js
- The explorer no longer needs its own parameterised viz. One `drawViz`, one set of IDs, one set of constants.
- If `drawViz` inner functions reference closure variables like `ticks`, `choiceX`, etc., they must stay inside `drawViz`. Do not extract them to file scope.
- The `module.exports` pattern is not needed for gc-viz.js — it uses d3 which is browser-only. Tests for viz are deferred (requires DOM mocking).
- Stay on `experiment/organised-anarchy-mapper`
