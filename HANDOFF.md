# HANDOFF.md

## Ready for Claude Code

### STORY 5: Simulation Explorer — direct parameter selection with comparison
- Files: `modules/garbage-can/explorer/index.html` (new), `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Epic: `docs/EPIC-garbage-can-restructure.md`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, `docs/PRINCIPLE-punctuation.md`, and `docs/PRINCIPLE-design-system.md` before touching anything
- Reference: `modules/garbage-can/assess/index.html` for the viz code to duplicate

---

## Context

The explorer page lets users run the Garbage Can Model with any parameter combination — no questionnaire. Two panels side by side allow comparison of different configurations. Each panel has its own parameter selectors, run button, simulation animation, and summary.

**URL:** `/modules/garbage-can/explorer/`

---

## Step 1 — Create directory

```bash
mkdir -p modules/garbage-can/explorer
```

---

## Step 2 — Page structure

Create `modules/garbage-can/explorer/index.html`. Same depth as taxonomy and assess (`../../../` for root paths).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Simulation Explorer · The Garbage Can Model · To the Bedrock</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:ital,wght@0,300;0,400;1,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../css/main.css" />
</head>
<body>

  <!-- Navigation -->
  <nav>
    <a class="nav-title" href="../../../">To the Bedrock</a>
    <div class="nav-links">
      <a class="nav-link" href="../../../">Home</a>
      <a class="nav-link nav-link--active" href="../../../modules/">Index</a>
    </div>
    <button class="nav-mobile-toggle" aria-label="Toggle menu">Menu</button>
  </nav>

  <main class="main--narrow">
    <div class="module-page">

      <!-- Module header -->
      <header class="module-header">
        <p class="module-header-number">03 &middot; The Garbage Can Model</p>
        <h1 class="module-header-title">Simulation Explorer</h1>
        <p class="module-header-body">
          Run the Garbage Can Model with any parameter combination.
          Compare two configurations side by side to see how different
          structures produce different decision-making patterns.
        </p>
      </header>

      <!-- Field notes card -->
      <div class="field-notes-card">
        <p class="field-notes-title">The Garbage Can Model</p>
        <p class="field-notes-body">
          <strong>Choice opportunities</strong> (circles) are forums where decisions could be made:
          meetings, reviews, committees. <strong>Problems</strong> (dots) seek resolution by attaching
          to a choice opportunity. <strong>Decision makers</strong> (invisible) allocate
          <strong>energy</strong> to the choices they can access each cycle. When cumulative energy
          meets the demand, a choice <strong>resolves</strong> and closes its attached problems.
        </p>
        <p class="field-notes-body">
          The model&#8217;s insight: when problems outnumber capacity, decisions happen by
          <strong>oversight</strong> (the forum closes while problems are elsewhere) or
          <strong>flight</strong> (problems leave before the forum closes).
          <strong>Resolution</strong> &#8212; genuinely closing the problem &#8212; becomes rare.
        </p>
      </div>

      <!-- Comparison panels -->
      <div class="explorer-panels">

        <!-- Panel A -->
        <div class="explorer-panel" id="panel-a">
          <p class="explorer-panel-label">Configuration A</p>

          <div class="explorer-selectors">
            <div class="explorer-select-group">
              <label class="explorer-select-label" for="panel-a-load">Load</label>
              <select class="explorer-select" id="panel-a-load">
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy" selected>Heavy</option>
              </select>
            </div>
            <div class="explorer-select-group">
              <label class="explorer-select-label" for="panel-a-decision">Decision</label>
              <select class="explorer-select" id="panel-a-decision">
                <option value="unsegmented">Unsegmented</option>
                <option value="hierarchical" selected>Hierarchical</option>
                <option value="specialized">Specialized</option>
              </select>
            </div>
            <div class="explorer-select-group">
              <label class="explorer-select-label" for="panel-a-access">Access</label>
              <select class="explorer-select" id="panel-a-access">
                <option value="unsegmented">Unsegmented</option>
                <option value="hierarchical" selected>Hierarchical</option>
                <option value="specialized">Specialized</option>
              </select>
            </div>
          </div>

          <div class="submit-row">
            <button class="submit-btn explorer-run-btn" id="run-a">Run simulation</button>
          </div>

          <div class="explorer-viz" id="viz-area-a" hidden>
            <svg id="viz-svg-a"></svg>
            <div class="sim-summary-card" id="sim-summary-a" hidden>
              <p class="sim-summary-subheader" id="sum-thisrun-label-a"></p>
              <p class="period-readout" id="sum-thisrun-resolved-a"></p>
              <p class="period-readout" id="sum-thisrun-inforum-a"></p>
              <p class="period-readout" id="sum-thisrun-adrift-a"></p>
              <p class="period-readout" id="sum-thisrun-choices-resolved-a"></p>
              <p class="period-readout" id="sum-thisrun-choices-open-a"></p>

              <p class="sim-summary-subheader" id="sum-choices-label-a"></p>
              <p class="period-readout" id="sum-choice-resolution-a"></p>
              <p class="period-readout" id="sum-choice-oversight-a"></p>
              <p class="period-readout" id="sum-choice-flight-a"></p>

              <p class="sim-summary-subheader" id="sum-problems-label-a"></p>
              <p class="period-readout" id="sum-prob-resolved-a"></p>
              <p class="period-readout" id="sum-prob-displaced-a"></p>
              <p class="period-readout" id="sum-prob-adrift-a"></p>
              <p class="period-readout" id="sum-prob-inforum-a"></p>

              <button class="replay-btn" id="replay-btn-a">Run again</button>
              <p class="positioning-caption">Each run varies slightly. The simulation is stochastic.</p>
            </div>
          </div>
        </div>

        <!-- Panel B -->
        <div class="explorer-panel" id="panel-b">
          <p class="explorer-panel-label">Configuration B</p>

          <div class="explorer-selectors">
            <div class="explorer-select-group">
              <label class="explorer-select-label" for="panel-b-load">Load</label>
              <select class="explorer-select" id="panel-b-load">
                <option value="light" selected>Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div class="explorer-select-group">
              <label class="explorer-select-label" for="panel-b-decision">Decision</label>
              <select class="explorer-select" id="panel-b-decision">
                <option value="unsegmented" selected>Unsegmented</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="specialized">Specialized</option>
              </select>
            </div>
            <div class="explorer-select-group">
              <label class="explorer-select-label" for="panel-b-access">Access</label>
              <select class="explorer-select" id="panel-b-access">
                <option value="unsegmented" selected>Unsegmented</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="specialized">Specialized</option>
              </select>
            </div>
          </div>

          <div class="submit-row">
            <button class="submit-btn explorer-run-btn" id="run-b">Run simulation</button>
          </div>

          <div class="explorer-viz" id="viz-area-b" hidden>
            <svg id="viz-svg-b"></svg>
            <div class="sim-summary-card" id="sim-summary-b" hidden>
              <p class="sim-summary-subheader" id="sum-thisrun-label-b"></p>
              <p class="period-readout" id="sum-thisrun-resolved-b"></p>
              <p class="period-readout" id="sum-thisrun-inforum-b"></p>
              <p class="period-readout" id="sum-thisrun-adrift-b"></p>
              <p class="period-readout" id="sum-thisrun-choices-resolved-b"></p>
              <p class="period-readout" id="sum-thisrun-choices-open-b"></p>

              <p class="sim-summary-subheader" id="sum-choices-label-b"></p>
              <p class="period-readout" id="sum-choice-resolution-b"></p>
              <p class="period-readout" id="sum-choice-oversight-b"></p>
              <p class="period-readout" id="sum-choice-flight-b"></p>

              <p class="sim-summary-subheader" id="sum-problems-label-b"></p>
              <p class="period-readout" id="sum-prob-resolved-b"></p>
              <p class="period-readout" id="sum-prob-displaced-b"></p>
              <p class="period-readout" id="sum-prob-adrift-b"></p>
              <p class="period-readout" id="sum-prob-inforum-b"></p>

              <button class="replay-btn" id="replay-btn-b">Run again</button>
              <p class="positioning-caption">Each run varies slightly. The simulation is stochastic.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer nav -->
      <nav class="module-footer-nav module-footer-nav--sub" aria-label="Module navigation">
        <a class="footer-nav-link" href="../">&larr; The Garbage Can Model</a>
        <a class="footer-nav-link" href="../assess/">Self-Assessment &rarr;</a>
      </nav>

    </div>
  </main>

  <footer>
    <p class="footer-text">To the Bedrock &middot; Platoscave</p>
  </footer>

  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="../../../gc-simulation.js"></script>
```

---

## Step 3 — JavaScript

The JS needs to do two things: wire the two panels, and run the simulation/visualization for each. The viz code is duplicated from `assess/index.html` but parameterized to work with either panel.

Add a `<script>` block after the simulation script tag. The approach:

1. Copy the `drawViz`, `renderTick`, `probAttrs`, `attachedPos`, `floatPos`, `isDeadTick`, and `showEndState` functions from `assess/index.html`
2. Modify them to accept a **panel suffix** parameter (either `'a'` or `'b'`) so they target the right SVG and summary elements
3. Wire each "Run simulation" button to read its panel's dropdowns and call the parameterized functions

### Key modifications from the assess version:

**All element IDs are suffixed.** Where assess has `viz-svg`, explorer has `viz-svg-a` and `viz-svg-b`. The `drawViz` function needs to accept a suffix and use it for all `getElementById` and `d3.select` calls.

**Wrap drawViz in a factory or pass the suffix:**

```js
    function runPanel(suffix) {
      var loadEl     = document.getElementById('panel-' + suffix + '-load');
      var decisionEl = document.getElementById('panel-' + suffix + '-decision');
      var accessEl   = document.getElementById('panel-' + suffix + '-access');

      var energyLoad        = loadEl.value;
      var decisionStructure = decisionEl.value;
      var accessStructure   = accessEl.value;

      var simResult = runGarbageCanSimulation({
        energyLoad: energyLoad,
        decisionStructure: decisionStructure,
        accessStructure: accessStructure
      });

      document.getElementById('viz-area-' + suffix).hidden = false;
      drawVizPanel(simResult, energyLoad, decisionStructure, accessStructure, suffix);
    }
```

**The `drawVizPanel` function** is a copy of `drawViz` from assess, with every hardcoded element ID replaced by suffixed lookups:
- `'viz-svg'` → `'viz-svg-' + suffix`
- `'sim-summary'` → `'sim-summary-' + suffix`
- `'sum-thisrun-label'` → `'sum-thisrun-label-' + suffix`
- etc.

**The `showEndStatePanel` function** is similarly parameterized.

**Copy the following functions from assess verbatim** (they don't reference DOM elements, so no suffix needed):
- `floatPos`
- `attachedPos`
- `probAttrs`
- `isDeadTick`

**Copy and parameterize:**
- `drawViz` → `drawVizPanel(simResult, energyLoad, decisionStructure, accessStructure, suffix)`
- `showEndState` → `showEndStatePanel(...args, suffix)`
- `renderTick` stays inside `drawVizPanel` as a closure (it already is in assess)

**Wire the buttons:**

```js
    document.getElementById('run-a').addEventListener('click', function() {
      runPanel('a');
    });

    document.getElementById('run-b').addEventListener('click', function() {
      runPanel('b');
    });

    document.getElementById('replay-btn-a').addEventListener('click', function() {
      runPanel('a');
    });

    document.getElementById('replay-btn-b').addEventListener('click', function() {
      runPanel('b');
    });
```

**Nav toggle and scroll restoration:**

```js
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.querySelector('.nav-mobile-toggle').addEventListener('click', function() {
      document.querySelector('.nav-links').classList.toggle('is-open');
    });
```

### Important: the viz code duplication

Copy all viz-related code from `assess/index.html` into the explorer. This includes:
- Color tokens (`const C = { ... }`)
- All d3 rendering code (layers, transitions, phase labels, dimming, etc.)
- The `isDeadTick`, `floatPos`, `attachedPos`, `probAttrs` helper functions
- The `showEndState` logic (single-run counts + 100-run averages)
- The `countProblemOutcomes` reference (this is in `gc-simulation.js`, not duplicated)

Parameterize every DOM reference with the suffix. This is tedious but mechanical.

---

## Step 4 — Add explorer styles to `css/main.css`

```css
/* ─── Explorer page ──────────────────────────────────── */
.explorer-panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

@media (min-width: 900px) {
  .explorer-panels {
    grid-template-columns: 1fr 1fr;
  }
}

.explorer-panel {
  background: var(--paper-dark);
  border: 2px solid var(--paper-deep);
  border-top: 2px solid var(--ink-ghost);
  padding: 1.5rem;
}

@media (min-width: 640px) {
  .explorer-panel {
    padding: 1.5rem 2rem;
  }
}

.explorer-panel-label {
  font-family: var(--mono);
  font-size: 0.62rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-bottom: 1.25rem;
}

.explorer-selectors {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.explorer-select-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.explorer-select-label {
  font-family: var(--mono);
  font-size: 0.58rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  min-width: 5rem;
}

.explorer-select {
  font-family: var(--mono);
  font-size: 0.65rem;
  font-weight: 300;
  color: var(--ink-mid);
  background: var(--paper);
  border: 1px solid var(--ink-ghost);
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  appearance: auto;
}

.explorer-select:focus {
  outline: 1px solid var(--ink-faint);
}

.explorer-viz {
  margin-top: 1.5rem;
}

.explorer-viz svg {
  display: block;
  width: 100%;
  overflow: visible;
}
```

---

## Step 5 — Override main--narrow for this page

The explorer needs more width than `720px` to fit two panels. Two options:

**Option A:** Don't use `main--narrow` on this page. Use `main` which has `max-width: 1140px`.

**Option B:** Add a wider variant class.

Recommendation: **Option A.** Change the `<main>` tag in the explorer to:

```html
  <main>
```

Without the `main--narrow` class. The panels grid will use the full 1140px container, giving each panel ~550px on desktop.

---

## Verification

1. Open `/modules/garbage-can/explorer/` — page loads with two panels
2. Panel A defaults: heavy/hierarchical/hierarchical. Click "Run simulation" — animation plays in panel A
3. Panel B defaults: light/unsegmented/unsegmented. Click "Run simulation" — animation plays in panel B
4. Both simulations run independently — running B doesn't affect A
5. Summary cards appear after each animation completes
6. "Run again" works on each panel independently
7. Change parameters via dropdowns and re-run — different results
8. On mobile: panels stack vertically
9. Footer nav: "← The Garbage Can Model" and "Self-Assessment →" link correctly

---

## Notes
- The viz code is deliberately duplicated from assess, not shared. The EPIC recommends extracting to `gc-viz.js` as a future TECH-DEBT task after all pages work.
- Each panel's element IDs are suffixed (`-a`, `-b`) to avoid conflicts
- The explorer does NOT load `gc-scoring.js` — no questionnaire, no scoring needed
- Panel A defaults to heavy/hierarchical/hierarchical (a common "Mix" configuration). Panel B defaults to light/unsegmented/unsegmented (the opposite extreme). This gives an immediately interesting comparison on first run.
- The `main--narrow` class is NOT used on this page — the wider container accommodates two panels
- Follow `docs/PRINCIPLE-punctuation.md` for all text
- No inline styles
- Stay on `experiment/organised-anarchy-mapper`
