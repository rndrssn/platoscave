# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — rounding, fill level, canvas height, button weight
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

### Fix 1 — Unresolved count going negative
The rounding logic is producing a total that exceeds 20, resulting in
unresolved: -1. Fix the rounding so the four counts always sum to
exactly 20 and unresolved is never negative.

```js
const resolved   = Math.round(simOutput.resolution * 20);
const oversight  = Math.round(simOutput.oversight  * 20);
const flight     = Math.round(simOutput.flight     * 20);
const unresolved = Math.max(0, 20 - resolved - oversight - flight);
```

If the sum of the first three exceeds 20, reduce the largest of the
three by the excess amount.

### Fix 2 — Show resolved problems as a fill level inside the circle
Remove the resolved dots rendering below the circles entirely.

Instead, as problems resolve at a choice opportunity, fill the circle
from the bottom upward. The fill level represents the proportion of
problems resolved at that circle — a circle that resolved 5 out of 10
problems attached to it fills halfway.

Fill level calculation:
  fill proportion = problems resolved at this circle / 20

One resolved problem = 1/20 of the circle filled. Twenty resolved
problems at one circle = fully filled. This is a proportion of the
total problem space (always 20), not a proportion of problems
attached to that circle.

Fill color: var(--ochre) at low opacity (0.25) so the circle stroke
remains visible. The fill animates smoothly as each problem resolves —
it does not jump. Use a clipPath or similar SVG technique to keep the
fill within the circle bounds.

This fix also restores the C0 label which is currently hidden behind
misplaced dots.

### Fix 3 — SVG canvas has excessive empty space above circles
The SVG canvas is too tall — circles are sitting near the bottom with
a large blank area above. Reduce the SVG height so circles are
vertically centered with minimal padding above and below.

### Fix 4 — RUN AGAIN button has wrong font weight
The RUN AGAIN text is rendering too heavy. It should match the weight
of other mono labels in the page — DM Mono weight 300.
Use existing tokens and classes from css/main.css only. No inline styles.

## Notes
- Do not change the animation timing or logic
- Do not change the questions, scoring, or diagnosis text
- Do not change the counter values or end state summary logic
- No inline styles — css/main.css tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these four fixes are done
