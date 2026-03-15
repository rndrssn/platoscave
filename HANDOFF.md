# HANDOFF.md

## Ready for Claude Code

### Bug report: Mapper — replay button CSS, SVG height, C9 clipping
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Bug 1 — replay-btn CSS class is missing — button renders with browser defaults

**Location:** `<style>` block. HTML line 626: `<button class="replay-btn" id="replay-btn" hidden>`

**Current behaviour:**
The `.replay-btn` class is referenced in the HTML but never defined in
the `<style>` block. The button inherits browser default styles — bold
weight, visible border.

**Fix:**
Add this CSS rule to the `<style>` block:

```css
.replay-btn {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-top: 1rem;
  display: block;
  transition: color 0.2s ease;
}

.replay-btn:hover {
  color: var(--rust);
}
```

---

## Bug 2 — SVG canvas too tall with too much empty space above circles

**Location:** `drawViz()` — constants at lines 899–905:
`SVG_H = 180`, `CHOICE_Y = 130`, `FLOAT_Y0 = 108`, `FLOAT_Y1 = 150`

**Current behaviour:**
Circles sit at y=130 in a 180px canvas — leaving 130px of empty space
above. Floating dots at y=108 sit above the circles which looks odd.

**Fix:**
Reduce SVG height and reposition everything to be vertically centered
with minimal padding. Suggested values:

```js
const SVG_H    = 120;
const CHOICE_Y = 70;
const FLOAT_Y0 = 45;
const FLOAT_Y1 = 95;
```

Ensure `CHOICE_Y + CHOICE_R + 13` (label position) stays within `SVG_H`.
With `CHOICE_Y = 70`, `CHOICE_R = 15`, label sits at y=98, within 120px. ✓

---

## Bug 3 — C9 label and dots still clipped at right edge

**Location:** `PAD_H = 72` (line 903), `attachedPos()` uses `r = CHOICE_R + 8 = 23`

**Current behaviour:**
`choiceX[9] = SVG_W - 72`. Attached dots orbit at radius 23, reaching
`SVG_W - 49` which still clips near the edge on smaller screens.

**Fix:**
Increase `PAD_H` from `72` to `88`. Also add `overflow: hidden` to
`#viz-svg` CSS rule and change `overflow: visible` to `overflow: hidden`
to prevent any clipping outside the viewBox.

Actually the better fix: keep `overflow: visible` but increase PAD_H
to `88` so the last circle has enough room for its orbit ring and label.

---

## Notes
- Do not change the visual exit logic — resolution/flight/oversight transitions are correct
- Do not change the questions, scoring, positioning diagram, or fill level logic
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these three bugs are fixed
