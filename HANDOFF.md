# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — summary counts bug and problem-level outcomes
- Files: `gc-simulation.js`, `modules/garbage-can/index.html`, `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context — what is wrong

The end-state summary shows four numbers (Resolved, Oversight, Flight, Unresolved) described as **problem** outcomes ("problem genuinely closed at a decision forum") but calculated from **choice-level** decision types.

In the original Cohen, March & Olsen (1972) model, resolution / oversight / flight are properties of how **choice opportunities** close — not of individual problems. The simulation's `countDecisionTypes()` faithfully implements this: it iterates over M=10 choices and classifies each choice's resolution style. The proportions returned (`resolution`, `oversight`, `flight`) are fractions of choices.

But `drawViz()` multiplies these proportions by W=20 (the number of problems) and presents them as problem counts. This is a category error — choice proportions × problem count is meaningless.

### The fix

Two changes:

1. **Fix the primary summary** — show choice-level counts using `* M` (not `* W`), with language that describes how the 10 choice opportunities resolved. This is the canonical GCM output, faithful to the original paper.

2. **Add a supplementary problem-level section** — show what happened to the 20 problems by the end. This is an interpretive extension of the model (the original paper does not report problem-level outcomes as a primary metric), but it bridges the gap between what the animation shows (individual dots) and what the numbers report. It must be clearly framed as supplementary.

---

## Fix 1 — Add `countProblemOutcomes()` to `gc-simulation.js`

This is a new function that classifies the final fate of each of the 20 problems from one iteration. It is an **extension** of the original model — the canonical GCM tracks decision styles at the choice level, not problem fates. This function serves the visualization layer.

**Problem fate definitions:**

| Fate | End state | Meaning |
|---|---|---|
| Resolved | raw ≥ 90 | Problem was attached to a choice when it resolved |
| Displaced | raw = -1, last detachment was from a choice that resolved that tick | Problem was in a forum that closed without resolving it |
| Adrift | raw = -1, last detachment was NOT from a resolving choice | Problem left the forum or never attached |
| In forum | raw = 0–9 | Still attached to an open choice at tick 20 |
| Never entered | raw = -2 | Never appeared in the simulation |

For problems ending as floating (STATE_ACTIVE), scan backwards from tick 20 to find the **last** attached→floating transition. If the choice resolved that tick → displaced. Otherwise → adrift.

INSERT after `countDecisionTypes()` (after ~line 305):

```js
/**
 * Classify the final fate of each problem from one iteration.
 * NOTE: This is an interpretive extension — the original GCM (1972)
 * tracks decision styles at the choice level, not problem fates.
 * This function serves the visualization summary.
 *
 * @param {number[][]} Problems - Problems state array [W][PERIODS+1]
 * @param {number[][]} Choices  - Choices state array [M][PERIODS+1]
 * @returns {{ resolved: number, displaced: number, adrift: number, inForum: number, neverEntered: number }}
 */
function countProblemOutcomes(Problems, Choices) {
  let resolved     = 0;
  let displaced    = 0;
  let adrift       = 0;
  let inForum      = 0;
  let neverEntered = 0;

  for (let i = 0; i < W; i++) {
    const endState = Problems[i][PERIODS];

    if (endState >= 90) {
      resolved++;
    } else if (endState === STATE_INACTIVE) {
      neverEntered++;
    } else if (endState >= 0 && endState < M) {
      inForum++;
    } else if (endState === STATE_ACTIVE) {
      // Floating at end — scan backwards for the last attached→floating transition
      let wasDisplaced = false;
      for (let t = PERIODS; t >= 1; t--) {
        const prev = Problems[i][t - 1];
        const curr = Problems[i][t];
        if (prev >= 0 && prev < M && curr === STATE_ACTIVE) {
          if (Choices[prev][t] === STATE_RESOLVED) {
            wasDisplaced = true;
          }
          break;
        }
      }
      if (wasDisplaced) {
        displaced++;
      } else {
        adrift++;
      }
    }
  }

  return { resolved, displaced, adrift, inForum, neverEntered };
}
```

---

## Fix 2 — Expand `runGarbageCanSimulation()` return value

The Monte Carlo loop needs to accumulate problem-level counts alongside the existing choice-level counts.

### 2a — Add accumulators

Find (~line 393):
```js
  let totalResolutions = 0;
  let totalOversights  = 0;
  let totalFlights     = 0;
  let totalQuickies    = 0;
  let lastResult       = null;
```

Replace with:
```js
  let totalResolutions = 0;
  let totalOversights  = 0;
  let totalFlights     = 0;
  let totalQuickies    = 0;

  let totalProbResolved     = 0;
  let totalProbDisplaced    = 0;
  let totalProbAdrift       = 0;
  let totalProbInForum      = 0;
  let totalProbNeverEntered = 0;

  let lastResult = null;
```

### 2b — Accumulate inside the Monte Carlo loop

Find (~line 406):
```js
    totalResolutions += counts.resolutions;
    totalOversights  += counts.oversights;
    totalFlights     += counts.flights;
    totalQuickies    += counts.quickies;

    if (iter === ITERATIONS - 1) lastResult = result;
```

Replace with:
```js
    totalResolutions += counts.resolutions;
    totalOversights  += counts.oversights;
    totalFlights     += counts.flights;
    totalQuickies    += counts.quickies;

    const probCounts = countProblemOutcomes(result.Problems, result.Choices);
    totalProbResolved     += probCounts.resolved;
    totalProbDisplaced    += probCounts.displaced;
    totalProbAdrift       += probCounts.adrift;
    totalProbInForum      += probCounts.inForum;
    totalProbNeverEntered += probCounts.neverEntered;

    if (iter === ITERATIONS - 1) lastResult = result;
```

### 2c — Compute means

Find (~line 414):
```js
  const meanResolutions = totalResolutions / ITERATIONS;
  const meanOversights  = totalOversights  / ITERATIONS;
  const meanFlights     = totalFlights     / ITERATIONS;
  const meanQuickies    = totalQuickies    / ITERATIONS;

  // Quickies fold into oversight for proportion calculation.
  // resolution + oversight + flight = 1.0
  const total = meanResolutions + meanOversights + meanFlights + meanQuickies;
```

Replace with:
```js
  const meanResolutions = totalResolutions / ITERATIONS;
  const meanOversights  = totalOversights  / ITERATIONS;
  const meanFlights     = totalFlights     / ITERATIONS;
  const meanQuickies    = totalQuickies    / ITERATIONS;

  // Quickies fold into oversight for choice-level proportion calculation.
  // resolution + oversight + flight ≈ 1.0
  // NOTE: these categories are overlapping descriptors (faithful to the original
  // 1972 paper), not exclusive bins. The sum equals 1.0 because total is their sum.
  const total = meanResolutions + meanOversights + meanFlights + meanQuickies;

  // Problem-level means (out of W) — interpretive extension, not canonical GCM
  const meanProbResolved     = totalProbResolved     / ITERATIONS;
  const meanProbDisplaced    = totalProbDisplaced    / ITERATIONS;
  const meanProbAdrift       = totalProbAdrift       / ITERATIONS;
  const meanProbInForum      = totalProbInForum      / ITERATIONS;
  const meanProbNeverEntered = totalProbNeverEntered / ITERATIONS;
```

### 2d — Expand the return object

Find (~line 430):
```js
  return {
    resolution: total > 0 ? meanResolutions / total : 0,
    oversight:  total > 0 ? (meanOversights + meanQuickies) / total : 0,
    flight:     total > 0 ? meanFlights / total : 0,
    ticks,
  };
```

Replace with:
```js
  return {
    // Choice-level proportions (canonical GCM — used by diagnosis text)
    resolution: total > 0 ? meanResolutions / total : 0,
    oversight:  total > 0 ? (meanOversights + meanQuickies) / total : 0,
    flight:     total > 0 ? meanFlights / total : 0,

    // Choice-level mean counts (out of M=10, canonical GCM)
    choiceResolution: meanResolutions,
    choiceOversight:  meanOversights + meanQuickies,
    choiceFlight:     meanFlights,

    // Problem-level mean counts (out of W=20, interpretive extension)
    problemResolved:     meanProbResolved,
    problemDisplaced:    meanProbDisplaced,
    problemAdrift:       meanProbAdrift,
    problemInForum:      meanProbInForum,
    problemNeverEntered: meanProbNeverEntered,

    ticks,
  };
```

---

## Fix 3 — Update `drawViz()` in `modules/garbage-can/index.html`

Replace the broken `* W` conversion with correct `* M` for choices and new problem-level values.

### 3a — Replace the count computation

Find (~line 874):
```js
      // Compute counts from 100-iteration simulation proportions
      let simResolved   = Math.round(resolution * W);
      let simOversight  = Math.round(oversight  * W);
      let simFlight     = Math.round(flight     * W);
      const excess = simResolved + simOversight + simFlight - W;
      if (excess > 0) {
        if (simResolved >= simOversight && simResolved >= simFlight) simResolved -= excess;
        else if (simOversight >= simFlight)                          simOversight -= excess;
        else                                                         simFlight   -= excess;
      }
      const simUnresolved = Math.max(0, W - simResolved - simOversight - simFlight);
```

Replace with:
```js
      // Choice-level counts (out of M=10, canonical GCM decision styles)
      const choiceResolution = Math.round(simResult.choiceResolution);
      const choiceOversight  = Math.round(simResult.choiceOversight);
      const choiceFlight     = Math.round(simResult.choiceFlight);
      const choiceOpen       = Math.max(0, M - choiceResolution - choiceOversight - choiceFlight);

      // Problem-level counts (out of W=20, interpretive extension)
      const probResolved  = Math.round(simResult.problemResolved);
      const probDisplaced = Math.round(simResult.problemDisplaced);
      const probAdrift    = Math.round(simResult.problemAdrift);
      const probInForum   = Math.round(simResult.problemInForum);
```

### 3b — Update the `showEndState` call

Find (~line 1182):
```js
          showEndState(simResolved, simOversight, simFlight, simUnresolved);
```

Replace with:
```js
          showEndState(
            choiceResolution, choiceOversight, choiceFlight, choiceOpen,
            probResolved, probDisplaced, probAdrift, probInForum
          );
```

---

## Fix 4 — Rewrite `showEndState()` in `modules/garbage-can/index.html`

The function displays two sections: the canonical GCM choice-level summary (primary), and the problem-level reading (supplementary).

Find (~line 1195):
```js
    // ─── End state summary ────────────────────────────────────────────────────────
    function showEndState(endResolved, endOversight, endFlight, endUnresolved) {

      // Stop any pulsating on dots
      d3.select('#viz-svg').selectAll('circle.problem')
        .classed('problem-attached', false)
        .interrupt();

      document.getElementById('sim-summary').hidden = false;

      document.getElementById('sum-header').textContent =
        'Across 100 simulations of this organisation type, on average:';
      document.getElementById('sum-resolved').innerHTML =
        `<span class="outcome-resolved">Resolved</span> \u2014 ${endResolved} \u2014 problem genuinely closed at a decision forum`;
      document.getElementById('sum-oversight').innerHTML =
        `<span class="outcome-oversight">Oversight</span> \u2014 ${endOversight} \u2014 decision made while problem moved elsewhere`;
      document.getElementById('sum-flight').innerHTML =
        `<span class="outcome-flight">Flight</span> \u2014 ${endFlight} \u2014 problem abandoned the forum before resolution`;
      document.getElementById('sum-unresolved').innerHTML =
        `<span class="outcome-unresolved">Unresolved</span> \u2014 ${endUnresolved} \u2014 never reached a decision forum`;

      document.getElementById('replay-btn').hidden      = false;
      document.getElementById('stochastic-note').hidden = false;
    }
```

Replace with:
```js
    // ─── End state summary ────────────────────────────────────────────────────────
    function showEndState(
      choiceResolution, choiceOversight, choiceFlight, choiceOpen,
      probResolved, probDisplaced, probAdrift, probInForum
    ) {

      // Stop any pulsating on dots
      d3.select('#viz-svg').selectAll('circle.problem')
        .classed('problem-attached', false)
        .interrupt();

      document.getElementById('sim-summary').hidden = false;

      // Primary: canonical GCM decision styles (choice-level)
      document.getElementById('sum-header').textContent =
        'Across 100 simulations of this organisation type, on average:';

      document.getElementById('sum-choices-label').textContent =
        `How the ${M} decision forums resolved`;
      document.getElementById('sum-choice-resolution').innerHTML =
        `<span class="outcome-resolved">Resolution</span> \u2014 ${choiceResolution} of ${M} \u2014 forum closed after genuine problem-solving`;
      document.getElementById('sum-choice-oversight').innerHTML =
        `<span class="outcome-oversight">Oversight</span> \u2014 ${choiceOversight} of ${M} \u2014 forum closed with no problem attached`;
      document.getElementById('sum-choice-flight').innerHTML =
        `<span class="outcome-flight">Flight</span> \u2014 ${choiceFlight} of ${M} \u2014 forum closed after problems fled`;
      document.getElementById('sum-choice-open').innerHTML =
        `<span class="outcome-unresolved">Still open</span> \u2014 ${choiceOpen} of ${M} \u2014 forum never resolved`;

      // Supplementary: problem fates (interpretive extension)
      document.getElementById('sum-problems-label').textContent =
        `What happened to the ${W} problems`;
      document.getElementById('sum-prob-resolved').innerHTML =
        `<span class="outcome-resolved">Resolved</span> \u2014 ${probResolved} of ${W} \u2014 genuinely closed at a decision forum`;
      document.getElementById('sum-prob-displaced').innerHTML =
        `<span class="outcome-oversight">Displaced</span> \u2014 ${probDisplaced} of ${W} \u2014 forum closed without resolving this problem`;
      document.getElementById('sum-prob-adrift').innerHTML =
        `<span class="outcome-flight">Adrift</span> \u2014 ${probAdrift} of ${W} \u2014 detached from forum or never attached`;
      document.getElementById('sum-prob-inforum').innerHTML =
        `<span class="outcome-unresolved">In forum</span> \u2014 ${probInForum} of ${W} \u2014 still attached to an open forum at cycle ${PERIODS}`;

      document.getElementById('replay-btn').hidden      = false;
      document.getElementById('stochastic-note').hidden = false;
    }
```

---

## Fix 5 — Update the summary HTML in `modules/garbage-can/index.html`

Find (~line 616):
```html
        <!-- End state summary — shown after animation -->
        <div id="sim-summary" hidden>
          <p class="sim-summary-header" id="sum-header"></p>
          <p class="period-readout" id="sum-resolved"></p>
          <p class="period-readout" id="sum-oversight"></p>
          <p class="period-readout" id="sum-flight"></p>
          <p class="period-readout" id="sum-unresolved"></p>
        </div>
```

Replace with:
```html
        <!-- End state summary — shown after animation -->
        <div id="sim-summary" hidden>
          <p class="sim-summary-header" id="sum-header"></p>

          <p class="sim-summary-subheader" id="sum-choices-label"></p>
          <p class="period-readout" id="sum-choice-resolution"></p>
          <p class="period-readout" id="sum-choice-oversight"></p>
          <p class="period-readout" id="sum-choice-flight"></p>
          <p class="period-readout" id="sum-choice-open"></p>

          <p class="sim-summary-subheader" id="sum-problems-label"></p>
          <p class="period-readout" id="sum-prob-resolved"></p>
          <p class="period-readout" id="sum-prob-displaced"></p>
          <p class="period-readout" id="sum-prob-adrift"></p>
          <p class="period-readout" id="sum-prob-inforum"></p>
        </div>
```

---

## Fix 6 — Add `.sim-summary-subheader` style to `css/main.css`

Add after the existing `.sim-summary-header` block:

```css
.sim-summary-subheader {
  font-family: var(--mono);
  font-size: 0.62rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
```

---

## Fix 7 — Fixed dot size for attached problems

**Root cause:** `attachedPos()` dynamically shrinks dot radius as more problems attach to a choice. With 2 problems the dots are large (~6px), with 14 they shrink to ~2px. This makes lightly-loaded circles visually heavier than crowded ones — backwards from intent. Dots should be a consistent size regardless of how many are in a circle.

### 7a — Remove dynamic radius from `attachedPos()`

Find (~line 921):
```js
      function attachedPos(choiceId, slot, total) {
        // Dynamic radius: shrink dots as circle fills
        const dotR = Math.max(1.2, (CHOICE_R * 0.4) / Math.sqrt(total + 1));

        // Fibonacci spiral distribution
        const goldenAngle = 2.399; // radians — golden angle
        const maxR        = CHOICE_R - dotR - 1; // keep dots within boundary
        const r           = maxR * Math.sqrt((slot + 0.5) / total);
        const angle       = slot * goldenAngle;

        return {
          x:    choiceX[choiceId] + r * Math.cos(angle),
          y:    CHOICE_Y          + r * Math.sin(angle),
          dotR: dotR,
        };
      }
```

Replace with:
```js
      function attachedPos(choiceId, slot, total) {
        // Fibonacci spiral distribution — fixed dot size
        const goldenAngle = 2.399; // radians — golden angle
        const maxR        = CHOICE_R - PROB_R - 1; // keep dots within boundary
        const r           = maxR * Math.sqrt((slot + 0.5) / total);
        const angle       = slot * goldenAngle;

        return {
          x: choiceX[choiceId] + r * Math.cos(angle),
          y: CHOICE_Y          + r * Math.sin(angle),
        };
      }
```

### 7b — Use `PROB_R` instead of `pos.dotR` in `probAttrs()`

Find at the end of `probAttrs()` (~line 1032):
```js
        return { x: pos.x, y: pos.y, opacity: 1, fill: C.ochre, r: pos.dotR };
```

Replace with:
```js
        return { x: pos.x, y: pos.y, opacity: 1, fill: C.ochre, r: PROB_R };
```

Dots inside circles are now the same size as floating dots (PROB_R = 3.5). Some overlap when a circle gets crowded — that's fine, it visually communicates the pileup.

---

## Notes
- Do not change `countDecisionTypes()` — it faithfully implements the original GCM choice-level classification
- The choice-level categories (resolution, oversight, flight, quickies) are overlapping descriptors, not exclusive bins — this is faithful to the 1972 paper. Do not attempt to make them mutually exclusive.
- `gc-simulation.js` stays DOM-free — it returns data, the HTML wires it to the page
- The `resolution`, `oversight`, `flight` proportions remain in the return object — the diagnosis text interpolates `{flight}` from them
- Do not change the animation, tick rendering, diagnosis logic, or scoring
- Stay on `experiment/organised-anarchy-mapper`
