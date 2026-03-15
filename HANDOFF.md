# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — counter redesign, color coding, floating dot position, C9 clipping
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Remove running counters, replace with statistical end state summary

**Current behaviour:**
Running counters show during animation (from Monte Carlo proportions).
End state summary replaces them after animation. The two sources
are different — animation is one run, counters are 100-run mean —
which confuses the visitor.

**Expected behaviour:**
- Remove the running counters `#sim-counters` entirely during animation
- After the animation completes, show one clear statistical summary
  with an explanatory header:

```
Across 100 simulations of this organisation type, on average:

RESOLVED    — 2   — problem genuinely closed at a decision forum
OVERSIGHT   — 10  — decision made while problem moved elsewhere
FLIGHT      — 8   — problem abandoned the forum before resolution
UNRESOLVED  — 0   — never reached a decision forum
```

The header line should be EB Garamond, italic, `--ink-mid`, `0.95rem`.
The four outcome lines use `period-readout` class styling but with
colored labels as defined in Fix 2.

**HTML changes required:**
- Remove `id="sim-counters"` div (lines 609–615) entirely
- Remove the `hidden` attribute logic for sim-counters in `drawViz()`
- Update `showEndState()` to render the header and four colored lines
- The `#sim-summary` div should gain a header paragraph above the four lines

---

## Fix 2 — Color coding: consistent colors across animation and summary

**Add `slate` to the color tokens object** (currently missing):
```js
const C = {
  ink:      '#2A2018',
  inkMid:   '#5C4F3A',
  inkFaint: '#9C8E78',
  inkGhost: '#C8BDA8',
  rust:     '#8B3A2A',
  ochre:    '#9A7B3A',
  slate:    '#3D4F5C',  // ADD THIS
};
```

**Animation exit colors** (update `renderTick()` visual exits):
- Resolution exit: dot moves to center, shrinks, fill → `C.ochre` ✓ (already correct)
- Flight exit: dot flashes → `C.rust` ✓ (already correct)
- Oversight exit: dot flashes → `C.slate` (currently wrong — uses `C.ochre`, change to `C.slate`)

**Summary label colors:**
Each outcome label in the end state summary must use its matching color.
Add CSS classes to the `<style>` block:

```css
.outcome-resolved  { color: var(--ochre); }
.outcome-flight    { color: var(--rust); }
.outcome-oversight { color: var(--slate); }
.outcome-unresolved { color: var(--ink-faint); }
```

Apply these classes to the label portion of each summary line.

---

## Fix 3 — Floating dots positioning

**Location:** Constants at lines 899–905.
Current: `SVG_H = 180`, `CHOICE_Y = 130`, `FLOAT_Y0 = 108`, `FLOAT_Y1 = 150`

**Current behaviour:**
`FLOAT_Y0 = 108` places floating dots at y=108, which is above
`CHOICE_Y - CHOICE_R = 115`. Some dots render above the circles.

**Fix:**
Floating dots must stay in the band between the circles and the
bottom of the SVG. Update constants:

```js
const SVG_H    = 180;
const CHOICE_Y = 90;
const FLOAT_Y0 = 130;
const FLOAT_Y1 = 155;
```

With `CHOICE_Y = 90`: circles centered at 90, label at y=118,
floating dots at 130–155 — all below the circles, within the 180px canvas.

---

## Fix 4 — C9 label and dots still clipped at right edge

**Location:** `PAD_H = 72` (line 903)

**Fix:**
Increase `PAD_H` from `72` to `90`. This gives the rightmost circle
enough margin for its orbit ring and label without clipping.

---

## Notes
- Do not change the questions, scoring, positioning diagram, or fill level logic
- Do not change animation timing
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these four fixes are done
