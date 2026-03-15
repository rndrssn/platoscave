# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — circle size, dot colors, stop pulse on end, contrast
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Increase circle size by ~47%

**Location:** Constants at lines 893–899

**Current values:**
```js
const SVG_H    = 180;
const CHOICE_Y = 90;
const CHOICE_R = 15;
const PAD_H    = 96;
const FLOAT_Y0 = 130;
const FLOAT_Y1 = 155;
```

**New values:**
```js
const SVG_H    = 240;
const CHOICE_Y = 120;
const CHOICE_R = 22;
const PAD_H    = 80;
const FLOAT_Y0 = 165;
const FLOAT_Y1 = 200;
```

`CHOICE_R = 22` is ~47% larger than 15. `SVG_H = 240` gives room
for larger circles, labels below at `CHOICE_Y + CHOICE_R + 13 = 155`,
and floating dots at 165–200. `PAD_H = 80` slightly reduced to give
more horizontal space for the larger circles across the row.

`PROB_R` stays at `3.5` — dots stay the same size, circles grow around them.
The fibonacci packing already scales with `CHOICE_R` so no changes needed there.

Also update the clipPath radius in the defs section to use `CHOICE_R`:
```js
.attr('r', CHOICE_R)  // already uses the constant — no change needed
```

---

## Fix 2 — Dot colors: use accent colors for clear state distinction

**Location:** `probAttrs()` function and `C` color tokens

**Current behaviour:**
Floating and attached dots use muted ink tones that are hard to
distinguish from each other and from the background.

**New color assignment:**

| State | Color | Token |
|-------|-------|-------|
| Floating (searching) | `C.rust` | `#8B3A2A` — problem needs a home, tension |
| Attached (in forum) | `C.ochre` | `#9A7B3A` — in process, amber |
| Entering (fade in) | `C.rust` | Same as floating — just entered, searching |
| Resolved exit flash | `C.slate` | `#3D4F5C` — cool, settled |
| Flight exit flash | `C.rust` | Already correct |
| Oversight exit flash | `C.ochre` | — forum closed around it |

**Update `probAttrs()`:**
```js
if (p.state === 'floating') {
  return { x: fp.x, y: fp.y, opacity: 0.9, fill: C.rust, r: PROB_R };
}
// attached:
return { x: pos.x, y: pos.y, opacity: 1, fill: C.ochre, r: pos.dotR };
```

**Update resolution exit in `renderTick()`:**
Change resolved exit flash from `C.ochre` to `C.slate`:
```js
.attr('r', 1.5).attr('fill', C.slate)
```

**Update legend colors to match:**
- ENTERING bullet: `C.rust`
- SEARCHING circle: `C.rust` (hollow)
- IN FORUM bullet: `C.ochre`
- RESOLVED dot: `C.slate`

---

## Fix 3 — Stop pulse animation when simulation ends

**Location:** `showEndState()` function, line 1186

**Current behaviour:**
If pulse animation exists on attached dots, it continues after the
simulation ends. Dots keep pulsating at the end state.

**Fix:**
At the start of `showEndState()`, remove the pulse class from all
problem dots and interrupt any ongoing d3 opacity transitions:

```js
function showEndState(...) {
  // Stop any pulsating on dots
  svg.selectAll('circle.problem')
    .classed('problem-attached', false)
    .interrupt();
  // ... rest of function
}
```

If pulse is implemented via d3 transitions rather than CSS, interrupt
all ongoing transitions on problem dots at the start of `showEndState()`.

---

## Fix 4 — General contrast improvements

**CSS `<style>` block changes:**

| Class | Property | Change |
|-------|----------|--------|
| `.figure-eyebrow` | `color` | `var(--ink-ghost)` → `var(--ink-faint)` |
| `.period-readout` | `color` | `var(--ink-ghost)` → `var(--ink-mid)` |
| `.q-section-label` | `color` | `var(--ink-ghost)` → `var(--ink-faint)` |
| `.scale-pole` | `color` | `var(--ink-ghost)` → `var(--ink-faint)` |
| `.scale-option label` | `color` | `var(--ink-ghost)` → `var(--ink-faint)` |

**Outcome label weights** — make colored labels heavier:
```css
.outcome-resolved, .outcome-oversight, .outcome-flight, .outcome-unresolved {
  font-weight: 400;
}
```

---

## Notes
- Do not change scoring, positioning diagram, fill level, diagnosis, or fibonacci packing logic
- Do not change animation timing
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these four fixes are done
