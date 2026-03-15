# HANDOFF.md

## Ready for Claude Code

### UX: Mapper — layout restructure (caption, legend, counter, summary)
- Files: `modules/garbage-can/index.html`, `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

The area below the simulation animation is too busy — legend, caption, cycle counter, parameters, summary stats, replay button, and stochastic note all compete for attention. This restructure moves elements to where they belong:

1. **Caption text** moves to before the animation (instructional intro)
2. **Cycle counter** moves inside the SVG (top-left)
3. **Legend** moves inside the SVG (bottom)
4. **100-run summary** gets its own visual container (card treatment)

### New layout flow

**Before animation:**
```
Fig. — Garbage Can Model

Problems (dots) search for choice opportunities (circles)
each cycle — attaching, drifting, and resolving as energy
accumulates.

Parameters: heavy load — hierarchical decision — specialized access

[See how decisions play out]
```

**The SVG (self-contained):**
```
Cycle 14 of 20

   ●  ●      ●        ●    ●  ●
      ●                ●

 ○  ○  ○  ○  ○  ○  ○  ○  ○  ○
 C0 C1 C2 C3 C4 C5 C6 C7 C8 C9

● Entering  ● Searching  ● In forum  ◐ Resolved
```

**After animation (summary card):**
```
┌────────────────────────────────────────────┐
│ Across 100 simulations...                  │
│                                            │
│ HOW THE 10 DECISION FORUMS RESOLVED        │
│ Resolution — 40%  Oversight — 55% ...      │
│                                            │
│ WHAT HAPPENED TO THE 20 PROBLEMS           │
│ Resolved — 8  Displaced — 3  Adrift — 2 ..│
│                                            │
│ Run again                                  │
│ Each run varies slightly...                │
└────────────────────────────────────────────┘
```

---

## Fix 1 — Restructure the Stage 3 HTML

The caption and parameters move above the viz. The legend HTML is removed (it will be rendered inside the SVG by d3). The summary gets a card container.

Find (~line 598):
```html
      <!-- Stage 3 — Diagnosis + simulation -->
      <section id="stage-3" class="stage">
        <hr class="stage-rule" />
        <p class="stage-label">Diagnosis</p>
        <h2 class="diagnosis-title" id="diagnosis-title"></h2>
        <p class="diagnosis-body" id="diagnosis-body"></p>
        <p class="figure-eyebrow">Fig. &mdash; Garbage Can Model</p>
        <svg id="viz-svg"></svg>
        <div class="viz-legend" id="viz-legend" hidden>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#8B3A2A"/></svg> Entering</span>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#B85C40"/></svg> Searching</span>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#B8943A"/></svg> In forum</span>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#4A6741"/></svg> Resolved</span>
        </div>
        <p class="figure-caption" id="viz-caption"></p>
        <p class="period-readout" id="period-readout"></p>

        <!-- End state summary — shown after animation -->
        <div id="sim-summary" hidden>
          <p class="sim-summary-header" id="sum-header"></p>

          <p class="sim-summary-subheader" id="sum-choices-label"></p>
          <p class="period-readout" id="sum-choice-resolution"></p>
          <p class="period-readout" id="sum-choice-oversight"></p>
          <p class="period-readout" id="sum-choice-flight"></p>


          <p class="sim-summary-subheader" id="sum-problems-label"></p>
          <p class="period-readout" id="sum-prob-resolved"></p>
          <p class="period-readout" id="sum-prob-displaced"></p>
          <p class="period-readout" id="sum-prob-adrift"></p>
          <p class="period-readout" id="sum-prob-inforum"></p>
        </div>

        <!-- Replay -->
        <button class="replay-btn" id="replay-btn" hidden>Run again</button>
        <p class="positioning-caption" id="stochastic-note" hidden>Each run varies slightly &mdash; the simulation is stochastic.</p>
      </section>
```

Replace with:
```html
      <!-- Stage 3 — Diagnosis + simulation -->
      <section id="stage-3" class="stage">
        <hr class="stage-rule" />
        <p class="stage-label">Diagnosis</p>
        <h2 class="diagnosis-title" id="diagnosis-title"></h2>
        <p class="diagnosis-body" id="diagnosis-body"></p>

        <!-- Figure intro — visible before animation runs -->
        <p class="figure-eyebrow">Fig. &mdash; Garbage Can Model</p>
        <p class="figure-caption" id="viz-caption"></p>

        <!-- Simulation — SVG contains legend and cycle counter -->
        <svg id="viz-svg"></svg>

        <!-- End state summary — card container, shown after animation -->
        <div class="sim-summary-card" id="sim-summary" hidden>
          <p class="sim-summary-header" id="sum-header"></p>

          <p class="sim-summary-subheader" id="sum-choices-label"></p>
          <p class="period-readout" id="sum-choice-resolution"></p>
          <p class="period-readout" id="sum-choice-oversight"></p>
          <p class="period-readout" id="sum-choice-flight"></p>

          <p class="sim-summary-subheader" id="sum-problems-label"></p>
          <p class="period-readout" id="sum-prob-resolved"></p>
          <p class="period-readout" id="sum-prob-displaced"></p>
          <p class="period-readout" id="sum-prob-adrift"></p>
          <p class="period-readout" id="sum-prob-inforum"></p>

          <button class="replay-btn" id="replay-btn">Run again</button>
          <p class="positioning-caption" id="stochastic-note">Each run varies slightly &mdash; the simulation is stochastic.</p>
        </div>
      </section>
```

Key changes:
- Caption moves above the SVG (instructional intro)
- Legend HTML removed — d3 will render it inside the SVG
- Period readout HTML removed — d3 will render it inside the SVG
- Summary gets `sim-summary-card` class for card styling
- Replay button and stochastic note move inside the summary card (they appear together)
- Replay button and stochastic note no longer need `hidden` attribute — they're inside the hidden summary card

---

## Fix 2 — Set the caption text before the animation, not after

The caption currently gets set at the end of `drawViz()`. Move it to where the diagnosis text is set, before the simulation runs.

Find in the form submission handler (~line 1298, after the scoping fix handoff):
```js
        document.getElementById('diagnosis-title').textContent = diagnosis.title;
        document.getElementById('diagnosis-body').textContent  = diagnosis.body;
```

Add after those lines:
```js
        document.getElementById('viz-caption').textContent =
          `Problems (dots) search for choice opportunities (circles) each cycle \u2014 ` +
          `attaching, drifting, and resolving as energy accumulates. ` +
          `Parameters: ${energyLoad} load \u2014 ${decisionStructure} decision \u2014 ${accessStructure} access.`;
```

Then find and DELETE the same `viz-caption` assignment at the end of `drawViz()` (~line 1196):
```js
      document.getElementById('viz-caption').textContent =
        `Problems (dots) search for choice opportunities (circles) each cycle \u2014 ` +
        `attaching, drifting, and resolving as energy accumulates. ` +
        `Parameters: ${energyLoad} load \u2014 ${decisionStructure} decision \u2014 ${accessStructure} access.`;
```

Delete those three lines entirely.

---

## Fix 3 — Render the cycle counter inside the SVG

Increase SVG height to accommodate the counter at top and legend at bottom. Add the counter as an SVG text element.

### 3a — Increase SVG height

Find in `drawViz()` (~line 903):
```js
      const SVG_H    = 260;
```

Replace with:
```js
      const SVG_H    = 300;
```

### 3b — Add the cycle counter text element

Add after the label layer setup (after the `labelLayer` block, ~line 993). Insert before the problem dots layer:

```js
      // ── Layer 5: cycle counter (top-left) ───────────────────────────────────────
      const counterText = svg.append('text')
        .attr('class', 'viz-counter')
        .attr('x', 0)
        .attr('y', 16)
        .attr('font-family', "'DM Mono', monospace")
        .attr('font-size', '0.6rem')
        .attr('font-weight', '300')
        .attr('letter-spacing', '0.1em')
        .attr('fill', C.inkFaint)
        .text('Cycle 0 of 20');
```

### 3c — Update the counter from SVG text instead of DOM element

Find in `renderTick()` (~line 1174):
```js
        document.getElementById('period-readout').textContent =
          `Cycle ${tick.tick} of 20`;
```

Replace with:
```js
        counterText.text(`Cycle ${tick.tick} of 20`);
```

### 3d — Update the end-of-animation counter

Find (~line 1185):
```js
          document.getElementById('period-readout').textContent =
            `Cycle 20 of 20 \u2014 complete`;
```

Replace with:
```js
          counterText.text('Cycle 20 of 20 \u2014 showing final run');
```

---

## Fix 4 — Render the legend inside the SVG

Add the legend as SVG elements at the bottom of the viz area. This replaces the HTML legend that was removed in Fix 1.

### 4a — Remove the `viz-legend` hidden/show logic

Find in `drawViz()` (~line 895):
```js
      document.getElementById('viz-legend').hidden    = false;
```

Delete this line.

### 4b — Add legend rendering after the counter text

Insert after the counter text block from Fix 3b:

```js
      // ── Layer 6: legend (bottom) ────────────────────────────────────────────────
      const LEGEND_Y = SVG_H - 12;
      const legendItems = [
        { label: 'Entering',  color: C.rust },
        { label: 'Searching', color: C.rustLight },
        { label: 'In forum',  color: C.gold },
      ];

      const legendG = svg.append('g').attr('transform', `translate(0, ${LEGEND_Y})`);
      let legendX = 0;

      legendItems.forEach(item => {
        legendG.append('circle')
          .attr('cx', legendX + 4)
          .attr('cy', 0)
          .attr('r', 4)
          .attr('fill', item.color);

        legendG.append('text')
          .attr('x', legendX + 12)
          .attr('y', 4)
          .attr('font-family', "'DM Mono', monospace")
          .attr('font-size', '0.5rem')
          .attr('font-weight', '300')
          .attr('letter-spacing', '0.08em')
          .attr('fill', C.inkFaint)
          .text(item.label.toUpperCase());

        legendX += item.label.length * 7 + 30;
      });

      // Resolved legend item — circle with sage fill at bottom
      const resolvedClipId = 'legend-clip-resolved-viz';
      svg.select('defs').append('clipPath')
        .attr('id', resolvedClipId)
        .append('circle')
          .attr('cx', legendX + 5)
          .attr('cy', LEGEND_Y)
          .attr('r', 5);

      legendG.append('circle')
        .attr('cx', legendX + 5)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', 'none')
        .attr('stroke', C.inkMid)
        .attr('stroke-width', 0.75);

      legendG.append('rect')
        .attr('x', legendX)
        .attr('y', 2)
        .attr('width', 10)
        .attr('height', 5)
        .attr('fill', C.sage)
        .attr('fill-opacity', 0.35)
        .attr('clip-path', `url(#${resolvedClipId})`);

      legendG.append('text')
        .attr('x', legendX + 14)
        .attr('y', 4)
        .attr('font-family', "'DM Mono', monospace")
        .attr('font-size', '0.5rem')
        .attr('font-weight', '300')
        .attr('letter-spacing', '0.08em')
        .attr('fill', C.inkFaint)
        .text('RESOLVED');
```

---

## Fix 5 — Add `.sim-summary-card` style to `css/main.css`

The summary card uses a similar treatment to the contact card — paper-dark background, sage top border.

Add to `css/main.css`:

```css
/* ─── Simulation summary card ────────────────────────── */
.sim-summary-card {
  background: var(--paper-dark);
  border: 2px solid var(--paper-deep);
  border-top: 2px solid var(--sage);
  padding: 2.25rem 1.5rem;
  margin-top: 2.5rem;
  max-width: 560px;
}

@media (min-width: 640px) {
  .sim-summary-card {
    padding: 2.25rem 2.5rem;
  }
}
```

---

## Fix 6 — Remove dead HTML legend CSS from `css/main.css`

The following styles are no longer needed since the legend is now rendered inside the SVG. Remove them:

```css
/* ─── Visualization legend ───────────────────────────── */
.viz-legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.viz-legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--mono);
  font-size: 0.55rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}
```

---

## Notes
- The SVG height increases from 260 to 300 to accommodate legend at bottom — verify that CHOICE_Y, FLOAT_Y0, FLOAT_Y1 still have enough space. Current values: FLOAT_Y0=50, FLOAT_Y1=75, CHOICE_Y=140, circles span to y=162, labels at y=175. Legend at y=288. Plenty of room.
- The `counterText` variable is used in the `renderTick` closure — it must be declared in `drawViz` scope before `renderTick` is defined, which it is (it's declared in the layer setup, before `renderTick`).
- Do not change `gc-simulation.js`, scoring, or diagnosis logic
- Stay on `experiment/organised-anarchy-mapper`
