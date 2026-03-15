# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — sage green, dot radius, remove stroke thickness, outcome colors
- Files: `modules/garbage-can/index.html`, `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Correct --sage color value in main.css

**File: `css/main.css`**

The current `--sage` value is wrong — it uses the old broken rust value.

Find:
```css
--sage:        #3E5E35;
--sage-light:  #5C7D52;
```

Replace with:
```css
--sage:        #4A6741;
--sage-light:  #6B8F62;
```

---

## Fix 2 — Apply sage green to resolved state throughout

**File: `css/main.css`**

Find:
```css
.outcome-resolved   { color: var(--ochre); font-weight: 400; }
```
Replace with:
```css
.outcome-resolved   { color: var(--sage); font-weight: 400; }
```

Find:
```css
.legend-sym-resolved  { color: var(--slate); }
```
Replace with:
```css
.legend-sym-resolved  { color: var(--sage); }
```

**File: `modules/garbage-can/index.html`**

Add `sage` to the JS color tokens object. Find:
```js
const C = {
  ink:      '#2A2018',
  inkMid:   '#5C4F3A',
  inkFaint: '#7A6E5F',
  inkGhost: '#B0A490',
  rust:     '#8B3A2A',
  ochre:    '#9A7B3A',
  slate:    '#3D4F5C',
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
  slate:    '#3D4F5C',
  sage:     '#4A6741',
};
```

Apply sage to resolution exit. Find:
```js
.attr('cx', cx).attr('cy', CHOICE_Y).attr('r', 1.5).attr('fill', C.slate)
```
Replace with:
```js
.attr('cx', cx).attr('cy', CHOICE_Y).attr('r', 1.5).attr('fill', C.sage)
```

Also update the RESOLVED legend bullet fill from `C.slate` to `C.sage`
wherever the legend is rendered in the drawViz function.

---

## Fix 3 — Smaller dot radius in fibonacci packing

**File: `modules/garbage-can/index.html`**

Find in `attachedPos()`:
```js
const dotR = Math.max(1.5, (CHOICE_R - 2) / Math.sqrt(total + 1));
```
Replace with:
```js
const dotR = Math.max(1.2, (CHOICE_R * 0.4) / Math.sqrt(total + 1));
```

With `CHOICE_R = 22`: max dotR = `22 * 0.4 = 8.8 / sqrt(2) = 6.2` for 1 dot,
shrinking to `8.8 / sqrt(21) = 1.9` for 20 dots. Dots are noticeably
smaller relative to the circle at all counts.

---

## Fix 4 — Remove stroke thickness variation — revert to uniform 1px

**File: `modules/garbage-can/index.html`**

The stroke-width logic was supposed to be removed. Find and replace
the entire stroke transition in `renderTick()`:

Find:
```js
.attr('stroke', d => {
  if (d.state === 'resolved') return C.inkMid;
  if (d.state === 'inactive') return C.inkGhost;
  const ratio = d.energyRequired > 0
    ? Math.min(d.energySpent / d.energyRequired, 1) : 0;
  if (ratio > 0.66) return C.inkMid;
  if (ratio > 0.33) return C.inkFaint;
  return C.inkGhost;
})
.attr('stroke-width', d => {
  if (d.state === 'resolved') return 2.5;
  if (d.state === 'inactive') return 0.5;
  const ratio = d.energyRequired > 0
    ? Math.min(d.energySpent / d.energyRequired, 1) : 0;
  if (ratio > 0.66) return 2.0;
  if (ratio > 0.33) return 1.5;
  return 1.0;
});
```

Replace with:
```js
.attr('stroke', d => {
  if (d.state === 'resolved') return C.inkMid;
  if (d.state === 'active')   return C.inkFaint;
  return C.inkGhost;
})
.attr('stroke-width', 1);
```

---

## Notes
- Do not change SVG size constants — CHOICE_R = 22, SVG_H = 240 are correct
- Do not change fibonacci packing logic other than the dotR formula
- Do not change scoring, positioning diagram, fill level, or diagnosis
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these four fixes are done
