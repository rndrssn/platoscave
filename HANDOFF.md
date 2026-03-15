# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — fibonacci packing, contrast, resolved legend marker
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Fibonacci spiral packing for attached dots inside circles

**Current behaviour:**
`attachedPos()` places dots on a fixed arc at `r = CHOICE_R - 6`.
With more than ~4 dots they overlap badly.

**Expected behaviour:**
Dots distributed inside the circle using a Fibonacci spiral pattern —
organic, non-overlapping, scales naturally as count increases.
Dot radius shrinks dynamically as more dots occupy the circle.

**Replace `attachedPos()` entirely with this implementation:**

```js
function attachedPos(choiceId, slot, total) {
  // Dynamic radius: shrink dots as circle fills
  const dotR = Math.max(1.5, (CHOICE_R - 2) / Math.sqrt(total + 1));

  // Fibonacci spiral distribution
  const goldenAngle = 2.399; // radians — golden angle
  const maxR        = CHOICE_R - dotR - 1; // keep dots within boundary
  const r           = maxR * Math.sqrt((slot + 0.5) / total);
  const angle       = slot * goldenAngle;

  return {
    x:    choiceX[choiceId] + r * Math.cos(angle),
    y:    CHOICE_Y          + r * Math.sin(angle),
    dotR: dotR,
  };
}
```

In `probAttrs()`, the attached state must use the `dotR` returned
by `attachedPos()` as the radius `r` instead of the fixed `PROB_R`.
Update the attached branch of `probAttrs()`:

```js
// attached — fibonacci packing inside choice circle
const siblings = tick.problems
  .map((q, i) => ({ ...q, id: i }))
  .filter(q => q.state === 'attached' && q.attachedTo === p.attachedTo);
const slot = siblings.findIndex(q => q.id === id);
const pos  = attachedPos(p.attachedTo, slot, siblings.length);
return { x: pos.x, y: pos.y, opacity: 1, fill: C.inkMid, r: pos.dotR };
```

Also update the `renderTick()` standard transition to pass `r` from
`probAttrs()` correctly — it already does `.attr('r', id => probAttrs(tick, id).r)`
so this should work without further changes there.

---

## Fix 2 — Contrast: step up colors one level

**CSS changes in `<style>` block — no inline styles:**

| Class | Property | Current | Change to |
|-------|----------|---------|-----------|
| `.period-readout` | `color` | `var(--ink-faint)` | `var(--ink-mid)` |
| `.figure-caption` | `color` | `var(--ink-faint)` | `var(--ink-mid)` |
| `.outcome-resolved` | `font-weight` | 300 (inherited) | 400 |
| `.outcome-oversight` | `font-weight` | 300 (inherited) | 400 |
| `.outcome-flight` | `font-weight` | 300 (inherited) | 400 |

**JS color token changes — SVG elements:**

In the `C` tokens object, update:
```js
C.inkFaint: '#9C8E78'  →  '#7A6E5F'   // one step darker for floating dots
C.inkGhost: '#C8BDA8'  →  '#B0A490'   // one step darker for circle strokes and labels
```

These are custom intermediate values between existing tokens —
they nudge contrast up without jumping to a full token level.

---

## Fix 3 — Resolved legend marker — make it legible

**Current behaviour:**
The resolved state in the legend uses `·` (middle dot) which is
too small and faint to read as a distinct symbol.

**Expected behaviour:**
Use a small filled circle SVG element inline, same size as other
legend symbols but at opacity 0.4 to convey "faded/processed":

Replace the `·` text with an inline SVG circle:
```html
<svg width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.4"/>
</svg>
```

This renders as a small dim dot — visually distinct from the
filled ENTERING/IN FORUM dots and the hollow SEARCHING circle.

---

## Notes
- Do not change scoring, positioning diagram, fill level, diagnosis, or energy accumulation
- Do not change animation timing
- No inline styles — CSS tokens only except where explicitly noted above
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these three fixes are done

---

## Fix 4 — Replace stroke brightness with stroke thickness for energy accumulation

**Current behaviour:**
Energy accumulation is shown by interpolating stroke color from
`C.inkGhost` toward `C.inkMid` using `d3.interpolateRgb`. Color
differences are subtle on the muted palette and hard to read.

**Expected behaviour:**
Replace color interpolation with stroke thickness. Thickness is
immediately legible — a visitor can see at a glance which forums
were heavily loaded and which were never engaged.

**Thickness scale:**

| State | stroke-width | stroke color |
|-------|-------------|--------------|
| Inactive (never opened) | 0.5 | `C.inkGhost` |
| Active, ratio 0–0.33 | 1.0 | `C.inkGhost` |
| Active, ratio 0.33–0.66 | 1.5 | `C.inkFaint` |
| Active, ratio 0.66–1.0 | 2.0 | `C.inkMid` |
| Resolved | 2.5 | `C.inkMid` |

Where `ratio = energySpent / energyRequired` (already available
in the ticks array per choice per tick).

**Replace the existing stroke transition in `renderTick()`:**

```js
svg.selectAll('circle.choice')
  .data(tick.choices)
  .transition()
    .duration(600)
    .ease(d3.easeCubicInOut)
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

Remove the `d3.interpolateRgb` import or usage if present.
