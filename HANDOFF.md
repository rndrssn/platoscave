# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — circle size constants, float zone, fibonacci dot scaling
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Circle size constants were not applied in previous session

**Location:** `drawViz()` constants, lines 893–899

**Current values (still old — not updated):**
```js
const SVG_H    = 180;
const CHOICE_Y = 90;
const CHOICE_R = 15;
const PAD_H    = 96;
const FLOAT_Y0 = 130;
const FLOAT_Y1 = 155;
```

**Required values:**
```js
const SVG_H    = 240;
const CHOICE_Y = 110;
const CHOICE_R = 22;
const PAD_H    = 80;
const FLOAT_Y0 = 148;
const FLOAT_Y1 = 178;
```

With `CHOICE_R = 22`: circle diameter is 44px. Label sits at
`CHOICE_Y + CHOICE_R + 13 = 145`. Float zone starts just below
at 148 — tight against the circles, no dead space.
`SVG_H = 240` gives room for everything including float dots at 178.

Also update `attachedPos()` — the old arc-based function is still
present from a previous version and must be replaced with the
fibonacci implementation. The fibonacci `attachedPos()` uses
`CHOICE_R` in its calculation so it will scale correctly:

```js
function attachedPos(choiceId, slot, total) {
  const dotR = Math.max(1.5, (CHOICE_R - 2) / Math.sqrt(total + 1));
  const goldenAngle = 2.399;
  const maxR = CHOICE_R - dotR - 1;
  const r = maxR * Math.sqrt((slot + 0.5) / total);
  const angle = slot * goldenAngle;
  return {
    x:    choiceX[choiceId] + r * Math.cos(angle),
    y:    CHOICE_Y          + r * Math.sin(angle),
    dotR: dotR,
  };
}
```

---

## Fix 2 — Float zone too far below circles — dead space

**Current behaviour:**
`FLOAT_Y0 = 130` with `CHOICE_Y = 90` and `CHOICE_R = 15` places
floating dots 25px below the circle edge. After Fix 1 increases
`CHOICE_R` to 22, the new constants above place float dots
just below the circle boundary — no dead space.

This fix is resolved by applying the constants in Fix 1.
No separate change needed.

---

## Fix 3 — Fibonacci dot scaling for crowded circles

**Current behaviour:**
C0 shows a solid ochre blob — too many dots packed into a small
circle because `CHOICE_R` is still 15. After Fix 1 increases
`CHOICE_R` to 22, the fibonacci packing will have more room.

However, the dynamic radius formula also needs to be verified.
The current `attachedPos()` may still be the old arc-based version.
The fibonacci implementation in Fix 1 includes:

```js
const dotR = Math.max(1.5, (CHOICE_R - 2) / Math.sqrt(total + 1));
```

With `CHOICE_R = 22` and `total = 20`: `dotR = Math.max(1.5, 20/√21) = Math.max(1.5, 4.36) = 4.36`
With `total = 5`: `dotR = Math.max(1.5, 20/√6) = 8.16`

This means dots shrink gracefully as the circle fills — a circle
with 2 dots shows them large and clear, a full circle shows many
small dots. This is correct behaviour.

Also ensure `probAttrs()` uses `pos.dotR` for the attached state radius:
```js
// attached branch:
const pos = attachedPos(p.attachedTo, slot, siblings.length);
return { x: pos.x, y: pos.y, opacity: 1, fill: C.ochre, r: pos.dotR };
```

---

## Notes
- Do not change dot colors — rust for floating, ochre for attached are correct
- Do not change scoring, positioning diagram, fill level, or diagnosis
- Do not change animation timing
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these fixes are done
