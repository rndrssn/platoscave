# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — simResult scoping bug crashes end-state summary
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

The end-state summary does not appear after the animation completes. The summary section stays hidden.

**Root cause:** `showEndState()` references `simResult` on line ~1219, but `simResult` is a local variable in `drawViz()` — it does not exist in `showEndState()`'s scope. This throws a ReferenceError and prevents the summary from rendering.

The fix: compute the percentage values in `drawViz()` where `simResult` is in scope, pass them as parameters to `showEndState()`, and remove the broken lines from `showEndState()`.

---

## Fix 1 — Move percentage computation into `drawViz()`

The old choice-level count variables (`choiceResolution`, `choiceOversight`, `choiceFlight`, `choiceOpen`) are dead code — the summary now uses percentages. Replace them.

Find in `drawViz()` (~line 883):
```js
      // Choice-level counts (out of M=10, canonical GCM decision styles)
      const choiceResolution = Math.round(simResult.choiceResolution);
      const choiceOversight  = Math.round(simResult.choiceOversight);
      const choiceFlight     = Math.round(simResult.choiceFlight);
      const choiceOpen       = Math.max(0, M - choiceResolution - choiceOversight - choiceFlight);
```

Replace with:
```js
      // Choice-level percentages (canonical GCM decision styles)
      // Rounded to nearest 5% — at 100 Monte Carlo iterations, finer precision is noise
      const pctRes  = Math.round(simResult.resolution * 20) * 5;
      const pctOver = Math.round(simResult.oversight  * 20) * 5;
      const pctFli  = 100 - pctRes - pctOver;
```

---

## Fix 2 — Update the `showEndState` call

Find (~line 1187):
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

---

## Fix 3 — Rewrite `showEndState()` — new signature, remove broken `simResult` lines

Find (~line 1202):
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

      // Primary: canonical GCM decision styles (choice-level)
      document.getElementById('sum-header').textContent =
        'Across 100 simulations of this organisation type, on average:';

      document.getElementById('sum-choices-label').textContent =
```

Everything after this line stays unchanged.

---

## Notes
- This is a scoping bug only — no logic changes, no new features
- Do not change `gc-simulation.js`, the animation, diagnosis, or scoring
- Stay on `experiment/organised-anarchy-mapper`
