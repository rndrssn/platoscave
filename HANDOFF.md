# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — choice percentage scoping bug, rounding fix, dead code cleanup
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

Three issues in the end-state summary, all in `modules/garbage-can/index.html`:

1. `showEndState()` references `simResult` which is not in scope — it belongs to `drawViz()`. This causes a runtime error.
2. Problem-level counts round independently and can sum to more than W (e.g. 21 instead of 20).
3. The old `choiceResolution/choiceOversight/choiceFlight/choiceOpen` variables are dead code — the choice-level summary now uses percentages, not counts.

---

## Fix 1 — Move percentage computation from `showEndState()` to `drawViz()`

The percentage calculation references `simResult` which is only in scope inside `drawViz()`, not inside `showEndState()`.

### 1a — Add percentage computation to `drawViz()`

Find in `drawViz()` (~line 882):
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
      const probInForum   = Math.max(0, W - probResolved - probDisplaced - probAdrift);
```

Replace with:
```js
      // Choice-level percentages (canonical GCM decision styles)
      // Rounded to nearest 5% — at 100 Monte Carlo iterations, finer precision is noise
      const pctRes  = Math.round(simResult.resolution * 20) * 5;
      const pctOver = Math.round(simResult.oversight  * 20) * 5;
      const pctFli  = 100 - pctRes - pctOver;

      // Problem-level counts (out of W=20, interpretive extension)
      // Round three, derive fourth as remainder to guarantee sum = W
      const probResolved  = Math.round(simResult.problemResolved);
      const probDisplaced = Math.round(simResult.problemDisplaced);
      const probAdrift    = Math.round(simResult.problemAdrift);
      const probInForum   = Math.max(0, W - probResolved - probDisplaced - probAdrift);
```

### 1b — Update the `showEndState` call

Find (~line 1186):
```js
          showEndState(
            choiceResolution, choiceOversight, choiceFlight, choiceOpen,
            probResolved, probDisplaced, probAdrift, probInForum
          );
```

Replace with:
```js
          showEndState(
            pctRes, pctOver, pctFli,
            probResolved, probDisplaced, probAdrift, probInForum
          );
```

### 1c — Rewrite `showEndState()` signature and remove the broken `simResult` lines

Find (~line 1201):
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

     const pctRes  = Math.round(simResult.resolution * 20) * 5;
      const pctOver = Math.round(simResult.oversight  * 20) * 5;
      const pctFli  = 100 - pctRes - pctOver;

      document.getElementById('sum-choices-label').textContent =
        `How the ${M} decision forums resolved`;
      document.getElementById('sum-choice-resolution').innerHTML =
        `<span class="outcome-resolved">Resolution</span> \u2014 ${pctRes}% \u2014 forum closed after genuine problem-solving`;
      document.getElementById('sum-choice-oversight').innerHTML =
        `<span class="outcome-oversight">Oversight</span> \u2014 ${pctOver}% \u2014 forum closed with no problem attached`;
      document.getElementById('sum-choice-flight').innerHTML =
        `<span class="outcome-flight">Flight</span> \u2014 ${pctFli}% \u2014 forum closed after problems fled`;
      
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

Replace with:
```js
    // ─── End state summary ────────────────────────────────────────────────────────
    function showEndState(
      pctRes, pctOver, pctFli,
      probResolved, probDisplaced, probAdrift, probInForum
    ) {

      // Stop any pulsating on dots
      d3.select('#viz-svg').selectAll('circle.problem')
        .classed('problem-attached', false)
        .interrupt();

      document.getElementById('sim-summary').hidden = false;

      // Primary: canonical GCM decision styles (choice-level, percentages)
      document.getElementById('sum-header').textContent =
        'Across 100 simulations of this organisation type, on average:';

      document.getElementById('sum-choices-label').textContent =
        `How the ${M} decision forums resolved`;
      document.getElementById('sum-choice-resolution').innerHTML =
        `<span class="outcome-resolved">Resolution</span> \u2014 ${pctRes}% \u2014 forum closed after genuine problem-solving`;
      document.getElementById('sum-choice-oversight').innerHTML =
        `<span class="outcome-oversight">Oversight</span> \u2014 ${pctOver}% \u2014 forum closed with no problem attached`;
      document.getElementById('sum-choice-flight').innerHTML =
        `<span class="outcome-flight">Flight</span> \u2014 ${pctFli}% \u2014 forum closed after problems fled`;

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

## Notes
- The `sum-choice-open` HTML element has already been removed — no action needed there
- Do not change `countDecisionTypes()`, the animation, diagnosis logic, or scoring
- `gc-simulation.js` is not touched in this handoff
- Stay on `experiment/organised-anarchy-mapper`
