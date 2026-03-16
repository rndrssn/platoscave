# HANDOFF.md

## Ready for Claude Code

### Feature: Mapper — deadlock visualization (phase labels, dimming, energy indicator)
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

In heavy-load scenarios, the simulation reaches a frozen state around tick 11–14 where remaining problems are trapped in an overloaded choice that can never resolve. The user watches nothing happen for 5–8 ticks and doesn't understand why. This is the model's central insight — but the visualization doesn't communicate it.

Four visual signals to add:

1. **Phase labels** — text in the SVG narrating what's happening
2. **Dim resolved circles** — fade resolved choices so active ones stand out
3. **Dashed stroke on deadlocked choices** — visual signal for "stuck"
4. **Energy deficit indicator** — problem count below + progress arc around stuck choices

---

## Fix 1 — Phase labels inside the SVG

A single line of text, top-right of the SVG (opposite the cycle counter top-left). Changes at phase transitions.

### Phase definitions

| Phase | Condition | Label text |
|-------|-----------|------------|
| Entering | tick ≤ 10 | `Problems entering` |
| Accumulating | tick > 10 AND state changed from previous tick | `Energy accumulating` |
| Locked | tick > 10 AND no state change from previous tick (dead tick) | `System locked` |

### 1a — Add phase label text element

Add after the cycle counter text element (Fix 6c from the combined restructure handoff), inside `drawViz()`:

```js
      // ── Phase label (top-right) ─────────────────────────────────────────────────
      var phaseText = svg.append('text')
        .attr('x', SVG_W)
        .attr('y', 16)
        .attr('text-anchor', 'end')
        .attr('font-family', "'DM Mono', monospace")
        .attr('font-size', '0.55rem')
        .attr('font-weight', '300')
        .attr('font-style', 'italic')
        .attr('letter-spacing', '0.08em')
        .attr('fill', C.inkFaint)
        .text('');
```

### 1b — Update phase label in `renderTick()`

Add at the end of `renderTick()`, after the pulse class assignments:

```js
        // Phase label
        if (tick.tick <= 10) {
          phaseText.text('Problems entering');
        } else if (prevTick && !isDeadTick(tickIdx)) {
          phaseText.text('Energy accumulating');
        } else if (prevTick && isDeadTick(tickIdx)) {
          phaseText.transition().duration(400)
            .attr('fill', C.rust)
            .text('System locked');
        }
```

Note: `isDeadTick` must be defined before `renderTick`. If it's currently defined after (in the timer section), move it before `renderTick`.

### 1c — Update phase label at end of animation

In the end-of-animation handler (inside `stepTick` or the timer completion), after updating the counter text:

```js
          phaseText.text('');
```

Clear the phase label when the summary appears — it's served its purpose.

---

## Fix 2 — Dim resolved circles

When a choice resolves, fade its stroke and opacity so the eye focuses on remaining active choices.

Find in `renderTick()` the choice circle stroke transition:

```js
        svg.selectAll('circle.choice')
          .data(tick.choices)
          .transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .attr('stroke', d => {
              if (d.state === 'resolved') return C.inkMid;
              if (d.state === 'active')   return C.inkFaint;
              return C.inkGhost;
            })
            .attr('stroke-width', 1);
```

Replace with:

```js
        svg.selectAll('circle.choice')
          .data(tick.choices)
          .transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .attr('stroke', d => {
              if (d.state === 'resolved') return C.inkGhost;
              if (d.state === 'active')   return C.inkFaint;
              return C.inkGhost;
            })
            .attr('stroke-width', d => {
              if (d.state === 'resolved') return 0.5;
              return 1;
            })
            .attr('opacity', d => {
              if (d.state === 'resolved') return 0.4;
              return 1;
            });
```

Resolved circles get ghost stroke, thinner width, and 40% opacity — they fade into the background.

---

## Fix 3 — Dashed stroke on deadlocked choices

A choice is "deadlocked" when it has been active with attached problems for 2+ consecutive ticks with no state change. Switch its stroke to dashed.

### 3a — Track consecutive unchanged ticks per choice

Add in `drawViz()` scope, near the other state trackers (after `resolvedAtChoice`):

```js
      // Track consecutive unchanged ticks per choice (for deadlock detection)
      var choiceUnchangedTicks = Array(M).fill(0);
```

### 3b — Update the tracker in `renderTick()`

Add after the phase label update (Fix 1b):

```js
        // Deadlock detection per choice
        for (var ci = 0; ci < M; ci++) {
          if (prevTick &&
              tick.choices[ci].state === 'active' &&
              prevTick.choices[ci].state === 'active' &&
              tick.choices[ci].energyRequired === prevTick.choices[ci].energyRequired) {
            choiceUnchangedTicks[ci]++;
          } else {
            choiceUnchangedTicks[ci] = 0;
          }
        }

        // Apply dashed stroke to deadlocked choices
        svg.selectAll('circle.choice')
          .attr('stroke-dasharray', function(d, i) {
            if (d.state === 'active' && choiceUnchangedTicks[i] >= 2) {
              return '3,3';
            }
            return 'none';
          });
```

---

## Fix 4 — Energy deficit indicator (problem count + progress arc)

Show a problem count below deadlocked choices and a thin progress arc showing energy progress.

### 4a — Add a layer for deficit indicators

Add in `drawViz()` after the problem dots layer setup:

```js
      // ── Layer 7: energy deficit indicators ──────────────────────────────────────
      var deficitLayer = svg.append('g');
```

### 4b — Render deficit indicators in `renderTick()`

Add after the deadlock detection block (Fix 3b):

```js
        // Energy deficit indicators on deadlocked choices
        deficitLayer.selectAll('*').remove();

        for (var di = 0; di < M; di++) {
          if (tick.choices[di].state !== 'active' || choiceUnchangedTicks[di] < 2) continue;

          var cx = choiceX[di];
          var problemCount = 0;
          tick.problems.forEach(function(p) {
            if (p.state === 'attached' && p.attachedTo === di) problemCount++;
          });

          if (problemCount === 0) continue;

          // Problem count below the circle
          deficitLayer.append('text')
            .attr('x', cx)
            .attr('y', CHOICE_Y + CHOICE_R + 28)
            .attr('text-anchor', 'middle')
            .attr('font-family', "'DM Mono', monospace")
            .attr('font-size', '0.5rem')
            .attr('font-weight', '300')
            .attr('fill', C.rust)
            .attr('letter-spacing', '0.05em')
            .text('\u00D7' + problemCount);

          // Progress arc — energy spent / energy required
          var required = tick.choices[di].energyRequired;
          var spent    = tick.choices[di].energySpent;
          var progress = required > 0 ? Math.min(spent / required, 1) : 0;
          var arcR     = CHOICE_R + 4;

          if (progress > 0 && progress < 1) {
            var startAngle = -Math.PI / 2;
            var endAngle   = startAngle + progress * 2 * Math.PI;

            var arcPath = d3.arc()
              .innerRadius(arcR - 1.5)
              .outerRadius(arcR)
              .startAngle(0)
              .endAngle(progress * 2 * Math.PI);

            deficitLayer.append('path')
              .attr('transform', 'translate(' + cx + ',' + CHOICE_Y + ')')
              .attr('d', arcPath)
              .attr('fill', C.rust)
              .attr('opacity', 0.6);

            // Background arc (full circle, very faint)
            var bgArc = d3.arc()
              .innerRadius(arcR - 1.5)
              .outerRadius(arcR)
              .startAngle(0)
              .endAngle(2 * Math.PI);

            deficitLayer.append('path')
              .attr('transform', 'translate(' + cx + ',' + CHOICE_Y + ')')
              .attr('d', bgArc)
              .attr('fill', C.inkGhost)
              .attr('opacity', 0.2);
          }
        }
```

The background arc shows the full energy requirement as a faint ring. The rust arc shows how much energy has been spent — for a jammed choice with 16 problems, this arc will be barely visible, making the deficit viscerally clear.

### 4c — Clear deficit indicators at end of animation

In the end-of-animation handler, alongside clearing the phase label:

```js
          deficitLayer.selectAll('*').remove();
```

---

## Notes
- `isDeadTick` must be defined before `renderTick` for Fix 1b to work — if it's currently inside the timer section, move its definition up into `drawViz` scope before `renderTick`
- The `d3.arc()` generator is part of d3 v7 — no additional dependencies needed
- The deficit indicators are redrawn every tick (remove + append) rather than transitioned — this is simpler and the visual doesn't need smooth transitions for static deadlock display
- Resolved circle dimming (Fix 2) applies to the fill rects too — add `.attr('opacity', ...)` to the fill rect transition if needed to match
- The energy data (`energyRequired`, `energySpent`) is already in the tick snapshots from `buildTickSnapshots` — no simulation changes needed
- Do not change `gc-simulation.js`, scoring, or diagnosis logic
- Follow `docs/PRINCIPLE-punctuation.md` for any new text — colons for label-value, middle dot for separators
- Stay on `experiment/organised-anarchy-mapper`
