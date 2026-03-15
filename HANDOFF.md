# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — float zone above circles, dot radius, spacing
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Move floating dots ABOVE circles, not below

**Root cause:** `floatPos()` uses `Math.max(safeY, FLOAT_Y0)` which
returns the larger y value — placing dots at the bottom. With
`FLOAT_Y0 = 148` and label at y=145, dots overlap labels.

Floating dots must drift ABOVE the circles where there is open space.

Find and replace the entire constants block and floatPos function:

Find:
```js
const FLOAT_Y0 = 148;
const FLOAT_Y1 = 178;
```
Replace with:
```js
const FLOAT_Y0 = 50;
const FLOAT_Y1 = 75;
```

Find:
```js
function floatPos(id) {
  const safeY = CHOICE_Y - CHOICE_R - 10;
  if (id < M) {
    return { x: choiceX[id], y: Math.max(safeY, FLOAT_Y0) };
  }
  const col = id - M;
  return { x: choiceX[col] + (col % 2 === 0 ? 14 : -14), y: Math.max(safeY, FLOAT_Y1) };
}
```
Replace with:
```js
function floatPos(id) {
  if (id < M) {
    return { x: choiceX[id], y: FLOAT_Y0 };
  }
  const col = id - M;
  return { x: choiceX[col] + (col % 2 === 0 ? 18 : -18), y: FLOAT_Y1 };
}
```

With `CHOICE_Y = 110` and `CHOICE_R = 22`, circles span y=88 to y=132.
Float zone at y=50–75 is clearly above all circles — open space,
no label overlap.

Also increase `SVG_H` to accommodate the float zone above:
Find:
```js
const SVG_H    = 240;
const CHOICE_Y = 110;
```
Replace with:
```js
const SVG_H    = 260;
const CHOICE_Y = 140;
```

With `CHOICE_Y = 140`: circles at y=118–162, labels at y=175,
float zone at y=50–75 — plenty of space above circles for floating dots.

---

## Fix 2 — Smaller dot radius in fibonacci packing

**This has not been applied in previous sessions.**

Find in `attachedPos()`:
```js
const dotR = Math.max(1.5, (CHOICE_R - 2) / Math.sqrt(total + 1));
```
Replace with:
```js
const dotR = Math.max(1.2, (CHOICE_R * 0.4) / Math.sqrt(total + 1));
```

---

## Fix 3 — Circle spacing — increase SVG width fallback and reduce PAD_H

**This has not been applied in previous sessions.**

Find:
```js
const SVG_W    = container.clientWidth || 680;
```
Replace with:
```js
const SVG_W    = container.clientWidth || 900;
```

Find:
```js
const PAD_H    = 80;
```
Replace with:
```js
const PAD_H    = 55;
```

---

## Notes
- Do not change CHOICE_R = 22
- Do not change scoring, diagnosis, fill level, or color tokens
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these three fixes are done
