# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — legend dots and color consistency
- File: `modules/garbage-can/index.html`
- Also affects: `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context — color mapping through the simulation

The simulation has four visual states for problem dots. The legend must match. Here is the intended mapping:

| Legend label | Sim state | Color | Token | Hex |
|---|---|---|---|---|
| Entering | `floating` (first tick) | rust | `C.rust` | `#8B3A2A` |
| Searching | `floating` (subsequent) | rust-light | legend-only | `#B85C40` |
| In forum | `attached` | warm gold | `C.gold` | `#B8943A` |
| Resolved | `resolved` | sage | `C.sage` | `#4A6741` |

The color progression tells a story: red (unattached) → gold (docked in a forum) → green (resolved). Entering and Searching are both the `floating` state in the simulation — dots render as `C.rust` while floating. The legend uses two rust shades to convey the conceptual difference. No simulation code change needed for those two.

---

## Fix 1 — Replace legend HTML with consistent inline SVGs

**Root cause:** The four legend dots use three different rendering methods — Unicode filled circle `●`, Unicode outline circle `○`, and a tiny inline SVG. Sizes are inconsistent and SEARCHING renders as a hollow ring. RESOLVED uses `fill="currentColor"` with `opacity="0.4"` which inherits `--ink-faint` (greyish brown) instead of green.

**Fix:** Replace all four with uniform inline SVGs at `width="10" height="10"` with `r="4"` (33% larger than current effective size). Hardcode fill colors to match the token mapping above.

Find:
```html
        <div class="viz-legend" id="viz-legend" hidden>
          <span class="viz-legend-item"><span class="legend-sym-entering">&#9679;</span> Entering</span>
          <span class="viz-legend-item"><span class="legend-sym-searching">&#9675;</span> Searching</span>
          <span class="viz-legend-item"><span class="legend-sym-forum">&#9679;</span> In forum</span>
          <span class="viz-legend-item"><svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.4"/></svg> Resolved</span>
        </div>
```

Replace with:
```html
        <div class="viz-legend" id="viz-legend" hidden>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#8B3A2A"/></svg> Entering</span>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#B85C40"/></svg> Searching</span>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#B8943A"/></svg> In forum</span>
          <span class="viz-legend-item"><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#4A6741"/></svg> Resolved</span>
        </div>
```

---

## Fix 2 — Add `gold` to the JS color tokens and CSS custom properties

**Root cause:** Neither `C` object nor `:root` has a gold token. Fixes 4 and 5 reference it.

### 2a — JS color tokens in `modules/garbage-can/index.html`

Find:
```js
    const C = {
      ink:      '#2A2018',
      inkMid:   '#5C4F3A',
      inkFaint: '#7A6E5F',
      inkGhost: '#B0A490',
      rust:     '#8B3A2A',
      ochre:    '#9A7B3A',
      slate:    '#3D4F5C',
      sage:     '#4A6741',
    };
```

Replace with:
```js
    const C = {
      ink:      '#2A2018',
      inkMid:   '#5C4F3A',
      inkFaint: '#7A6E5F',
      inkGhost: '#B0A490',
      rust:     '#8B3A2A',
      ochre:    '#9A7B3A',
      gold:     '#B8943A',
      slate:    '#3D4F5C',
      sage:     '#4A6741',
    };
```

### 2b — CSS custom properties in `css/main.css`

Find in `:root`:
```css
  --ochre:       #9A7B3A;
  --slate:       #3D4F5C;
```

Replace with:
```css
  --ochre:       #9A7B3A;
  --gold:        #B8943A;
  --slate:       #3D4F5C;
```

---

## Fix 3 — Resolved dots in simulation render grey instead of green

**Root cause:** In `probAttrs()`, the `resolved` state returns `fill: C.inkGhost` (`#B0A490`). This makes resolved dots grey. The resolution exit animation (line ~1127) correctly uses `C.sage` for the flash, but the base state fill is wrong.

Find in `probAttrs()`:
```js
        if (p.state === 'resolved') {
          const cx = typeof p.attachedTo === 'number' ? choiceX[p.attachedTo] : choiceX[0];
          return { x: cx, y: CHOICE_Y, opacity: 0, fill: C.inkGhost, r: PROB_R };
        }
```

Replace with:
```js
        if (p.state === 'resolved') {
          const cx = typeof p.attachedTo === 'number' ? choiceX[p.attachedTo] : choiceX[0];
          return { x: cx, y: CHOICE_Y, opacity: 0, fill: C.sage, r: PROB_R };
        }
```

---

## Fix 4 — In-forum (attached) dots use ochre instead of gold

**Root cause:** In `probAttrs()`, the `attached` state returns `fill: C.ochre`. Should be `C.gold` to match the intended warm gold.

Find at the end of `probAttrs()`:
```js
        return { x: pos.x, y: pos.y, opacity: 1, fill: C.ochre, r: pos.dotR };
```

Replace with:
```js
        return { x: pos.x, y: pos.y, opacity: 1, fill: C.gold, r: pos.dotR };
```

---

## Fix 5 — Fill level tracks "ever attached" instead of "resolved"

**Root cause:** The fill-level rects inside choice circles represent the cumulative count of problems that ever *attached* to each choice — not problems *resolved* there. This means circles fill up with traffic regardless of outcome. In a scenario with `resolution: 0`, the circles still show fill, which is misleading.

The fill should represent actual resolution — how many problems were genuinely closed at each choice opportunity. Empty circles = no problems resolved. Full circles = many resolved. This makes the fill a meaningful outcome indicator.

### 5a — Rename the counter variable and change the comment

Find (~line 1035):
```js
      // Cumulative ever-attached counts — one entry per choice, never decreases
      const everAttached    = Array(M).fill(0);
      const attachedCounted = new Set(); // problem IDs already counted
```

Replace with:
```js
      // Cumulative resolved-at-choice counts — one entry per choice, never decreases
      const resolvedAtChoice = Array(M).fill(0);
```

### 5b — Replace the fill-level block (counter + rect rendering)

The current block at ~line 1057 counts attached problems and renders the fill rects. Both the counter logic and the rect rendering need to move to AFTER the resolution detection block (~line 1098) so that `resolvedThisTick` data is available.

Delete the entire fill-level block at ~line 1057:

Find:
```js
        // Fill level — cumulative count of problems ever attached to each choice
        tick.problems.forEach((p, pid) => {
          if (p.state === 'attached' && typeof p.attachedTo === 'number' && !attachedCounted.has(pid)) {
            attachedCounted.add(pid);
            everAttached[p.attachedTo]++;
          }
        });
        svg.selectAll('rect.choice-fill')
          .data(d3.range(M))
          .transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .attr('y',      i => CHOICE_Y + CHOICE_R - (everAttached[i] / W) * (CHOICE_R * 2))
            .attr('height', i => (everAttached[i] / W) * (CHOICE_R * 2));
```

Replace with nothing — delete the block entirely.

Then INSERT the following AFTER the resolution detection block. Place it immediately after the closing brace of the `if (prevTick)` block (~line 1098), before the "Detect problems entering" comment:

```js
        // Fill level — cumulative count of problems resolved at each choice
        if (prevTick) {
          for (let id = 0; id < W; id++) {
            if (prevTick.problems[id].state === 'attached' && tick.problems[id].state === 'resolved') {
              resolvedAtChoice[prevTick.problems[id].attachedTo]++;
            }
          }
        }
        svg.selectAll('rect.choice-fill')
          .data(d3.range(M))
          .transition()
            .duration(600)
            .ease(d3.easeCubicInOut)
            .attr('y',      i => CHOICE_Y + CHOICE_R - (resolvedAtChoice[i] / W) * (CHOICE_R * 2))
            .attr('height', i => (resolvedAtChoice[i] / W) * (CHOICE_R * 2));

```

**Ordering in renderTick after this fix:**
1. Choice circle stroke transitions
2. Resolution detection (resolvedThisTick, flightSet, oversightSet)
3. Fill level counter + rect rendering ← moved here
4. Entrance animation
5. Problem dot transitions

### 5d — Change the fill rect color from ochre to sage

The fill now represents resolution (a green outcome), so it should use sage instead of ochre.

Find in the fill rects setup (~line 974):
```js
          .attr('fill', C.ochre)
          .attr('fill-opacity', 0.25)
```

Replace with:
```js
          .attr('fill', C.sage)
          .attr('fill-opacity', 0.25)
```

---

## Fix 6 — Dead CSS cleanup in `css/main.css`

The following CSS classes are no longer referenced after Fix 1 removes the Unicode-based legend. Remove them:

```css
.legend-sym-entering  { color: var(--rust); }
.legend-sym-searching { color: var(--rust); }
.legend-sym-forum     { color: var(--ochre); }
.legend-sym-resolved  { color: var(--sage); }
```

Low priority — cosmetic only. No functional impact.

---

## Fix 7 — Stale comment

The comment on line ~1121 says "fill ochre" but the code uses `C.sage`. Update to match:

Find:
```js
        // Resolution exit: move to circle centre, shrink to r:1.5, fill ochre, then fade
```

Replace with:
```js
        // Resolution exit: move to circle centre, shrink to r:1.5, fill sage, then fade
```

---

## Notes
- Do not change the resolution exit animation (line ~1127) — it already uses `C.sage` correctly
- Do not change CHOICE_R, scoring, diagnosis, or floatPos
- The `--ochre` CSS token and `C.ochre` JS token stay in place — they may be used elsewhere or in future modules
- Stay on `experiment/organised-anarchy-mapper`
