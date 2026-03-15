# HANDOFF.md

## Ready for Claude Code

### UX: Mapper — simulation on demand, dead tick speedup
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

Three UX issues with the simulation:

1. The simulation auto-runs after form submit — the user has no time to read their diagnosis before the animation starts
2. After tick ~10, many runs have no state changes — the user watches nothing happen for 5–8 seconds
3. The overall pacing could be improved

### New flow after this fix

1. User submits form
2. Stage 2 fades in: positioning diagram
3. Stage 3 fades in: diagnosis title, diagnosis body, figure eyebrow, then a **"See how decisions play out"** button
4. User clicks the button → button hides, viz area appears, simulation runs
5. Ticks with state changes: 800ms. Dead ticks (no state change): 200ms
6. After simulation completes: summary + "Run again" appear as before

---

## Fix 1 — Add a "See how decisions play out" button to the HTML

The button sits between the diagnosis body and the viz area. The viz area (SVG, legend, caption, period readout, summary) starts hidden.

Find (~line 603):
```html
        <p class="diagnosis-body" id="diagnosis-body"></p>
        <p class="figure-eyebrow">Fig. &mdash; Garbage Can Model</p>
        <svg id="viz-svg"></svg>
```

Replace with:
```html
        <p class="diagnosis-body" id="diagnosis-body"></p>
        <p class="figure-eyebrow">Fig. &mdash; Garbage Can Model</p>
        <div class="submit-row">
          <button class="submit-btn" id="run-sim-btn" hidden>See how decisions play out</button>
        </div>
        <div id="viz-area" hidden>
          <svg id="viz-svg"></svg>
```

Then find the closing of the viz-related content. Find (~line 633):
```html
        <!-- Replay -->
        <button class="replay-btn" id="replay-btn" hidden>Run again</button>
        <p class="positioning-caption" id="stochastic-note" hidden>Each run varies slightly &mdash; the simulation is stochastic.</p>
```

Replace with:
```html
        <!-- Replay -->
        <button class="replay-btn" id="replay-btn" hidden>Run again</button>
        <p class="positioning-caption" id="stochastic-note" hidden>Each run varies slightly &mdash; the simulation is stochastic.</p>
        </div>
```

This wraps the SVG, legend, caption, period readout, summary, replay button, and stochastic note inside `<div id="viz-area" hidden>`.

---

## Fix 2 — Separate diagnosis reveal from simulation

The form submission handler currently calls `drawViz()` directly. Change it to show the button instead, and wire the button to trigger the simulation.

Find (~line 1296):
```js
      // Stage 3: diagnosis + simulation
      showStage('stage-3', 900);
      setTimeout(() => {
        document.getElementById('diagnosis-title').textContent = diagnosis.title;
        document.getElementById('diagnosis-body').textContent  = diagnosis.body;
        drawViz(simResult, energyLoad, decisionStructure, accessStructure);
      }, 1100);

      // Replay button — closure over scoring params
      document.getElementById('replay-btn').onclick = function () {
        const newSim = runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure });
        drawViz(newSim, energyLoad, decisionStructure, accessStructure);
      };
```

Replace with:
```js
      // Stage 3: diagnosis (simulation waits for user click)
      showStage('stage-3', 900);
      setTimeout(() => {
        document.getElementById('diagnosis-title').textContent = diagnosis.title;
        document.getElementById('diagnosis-body').textContent  = diagnosis.body;
        document.getElementById('run-sim-btn').hidden = false;
      }, 1100);

      // Simulation trigger — runs on button click
      document.getElementById('run-sim-btn').onclick = function () {
        document.getElementById('run-sim-btn').hidden = true;
        document.getElementById('viz-area').hidden = false;
        drawViz(simResult, energyLoad, decisionStructure, accessStructure);
      };

      // Replay button — closure over scoring params
      document.getElementById('replay-btn').onclick = function () {
        const newSim = runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure });
        drawViz(newSim, energyLoad, decisionStructure, accessStructure);
      };
```

---

## Fix 3 — Replace `setInterval` with `setTimeout` for variable tick speed

Dead ticks (where no choice or problem changed state) run at 200ms instead of 800ms.

Find in `drawViz()` (~line 1178):
```js
      renderTick(0, null);

      let current = 0;
      const timer = setInterval(() => {
        current++;
        if (current >= ticks.length) {
          clearInterval(timer);
          document.getElementById('period-readout').textContent =
            `Cycle 20 of 20 \u2014 complete`;
          showEndState(
            choiceResolution, choiceOversight, choiceFlight, choiceOpen,
            probResolved, probDisplaced, probAdrift, probInForum
          );
          return;
        }
        renderTick(current, ticks[current - 1]);
      }, 800);
```

Replace with:
```js
      renderTick(0, null);

      let current = 0;

      function isDeadTick(tickIdx) {
        if (tickIdx === 0) return false;
        const prev = ticks[tickIdx - 1];
        const curr = ticks[tickIdx];
        for (let i = 0; i < M; i++) {
          if (prev.choices[i].state !== curr.choices[i].state) return false;
        }
        for (let i = 0; i < W; i++) {
          if (prev.problems[i].state !== curr.problems[i].state) return false;
          if (prev.problems[i].attachedTo !== curr.problems[i].attachedTo) return false;
        }
        return true;
      }

      function stepTick() {
        current++;
        if (current >= ticks.length) {
          document.getElementById('period-readout').textContent =
            `Cycle 20 of 20 \u2014 complete`;
          showEndState(
            pctRes, pctOver, pctFli,
            probResolved, probDisplaced, probAdrift, probInForum
          );
          return;
        }
        renderTick(current, ticks[current - 1]);
        var delay = isDeadTick(current) ? 200 : 800;
        setTimeout(stepTick, delay);
      }

      setTimeout(stepTick, 800);
```

Note: the `showEndState` call uses `pctRes, pctOver, pctFli` — this assumes the scoping fix handoff has already been applied. If it hasn't, use the variable names that are currently in scope.

---

## Fix 4 — Slow down and stagger dot movement

Dots currently all move at exactly the same speed in straight lines — it feels mechanical. Add per-dot randomised delay and duration to the standard position transition. This only affects the "normal movement" animation, not the entrance, resolution, flight, or oversight animations which should stay crisp.

Find in `renderTick()` (~line 1161):
```js
        // All other problems: standard position transition
        allProbs.filter(id => !resolvedThisTick.has(id) && !flightSet.has(id) && !oversightSet.has(id) && !enteringThisTick.has(id))
          .interrupt()
          .transition().duration(600).ease(d3.easeCubicInOut)
            .attr('cx',      id => probAttrs(tick, id).x)
            .attr('cy',      id => probAttrs(tick, id).y)
            .attr('r',       id => probAttrs(tick, id).r)
            .attr('opacity', id => probAttrs(tick, id).opacity)
            .attr('fill',    id => probAttrs(tick, id).fill);
```

Replace with:
```js
        // All other problems: standard position transition (staggered for organic feel)
        allProbs.filter(id => !resolvedThisTick.has(id) && !flightSet.has(id) && !oversightSet.has(id) && !enteringThisTick.has(id))
          .interrupt()
          .transition()
            .delay(id => Math.random() * 150)
            .duration(id => 700 + Math.random() * 300)
            .ease(d3.easeCubicInOut)
            .attr('cx',      id => probAttrs(tick, id).x)
            .attr('cy',      id => probAttrs(tick, id).y)
            .attr('r',       id => probAttrs(tick, id).r)
            .attr('opacity', id => probAttrs(tick, id).opacity)
            .attr('fill',    id => probAttrs(tick, id).fill);
```

Each dot gets a random delay (0–150ms) and duration (700–1000ms). They still move in straight lines but arrive at slightly different times, breaking the mechanical "all at once" feel.

---

## Notes
- The `submit-btn` class already exists in the CSS — reuse it for the new button
- The `viz-area` div is a structural wrapper only — it needs no styling (default `display: block` is fine)
- The figure eyebrow ("Fig. — Garbage Can Model") stays visible before the button is clicked — it frames the button as "click to animate this figure"
- Do not change the animation transitions, `renderTick`, or `drawViz` internals beyond the timer
- Do not change `gc-simulation.js`, scoring, or diagnosis logic
- Stay on `experiment/organised-anarchy-mapper`
