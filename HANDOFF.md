# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — energy accumulation visual, dot pulse, contrast improvements
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Energy accumulation visible on circles (cycles 11–20)

**Current behaviour:**
Cycles 11–20 show no visual activity even though energy is accumulating
toward resolution thresholds. The visitor thinks the simulation has stopped.

**Expected behaviour:**
As energy accumulates at a choice opportunity, its circle stroke gradually
brightens — from `C.inkGhost` toward `C.inkFaint` toward `C.inkMid` as
the energy ratio (`energySpent / energyRequired`) approaches 1.0.

The ticks array already contains `energyRequired` and `energySpent` per
choice per tick. Use these to calculate the fill ratio:

```js
const ratio = choice.energyRequired > 0
  ? Math.min(choice.energySpent / choice.energyRequired, 1)
  : 0;
```

Map `ratio` to stroke color using d3 interpolation:
```js
const stroke = d3.interpolateRgb(C.inkGhost, C.inkMid)(ratio);
```

Apply this in `renderTick()` to the choice circle stroke transition,
replacing the current binary active/resolved/inactive stroke logic.
Resolved circles keep `C.inkMid` stroke permanently.

---

## Fix 2 — Subtle pulse on attached dots during quiet cycles

**Current behaviour:**
Attached dots sit motionless in cycles 11–20 when no new problems enter.

**Expected behaviour:**
Attached dots gently pulse in opacity — breathing between 0.7 and 1.0
on a slow cycle (~2s) while attached. This signals they are still active
even when not moving.

Implement as a CSS animation on a class applied to attached dots:

Add to `<style>` block:
```css
@keyframes dot-pulse {
  0%, 100% { opacity: 1.0; }
  50%       { opacity: 0.6; }
}
.problem-attached {
  animation: dot-pulse 2s ease-in-out infinite;
}
```

In `probAttrs()`, return a class marker for attached state. In
`renderTick()`, add/remove the `problem-attached` class on dots
as they enter and leave the attached state.

---

## Fix 3 — Contrast improvements

The following CSS classes use colors that are too light at small sizes.
Update in the `<style>` block — no inline styles, CSS tokens only.

**In the module `<style>` block:**

| Class | Property | Current | Change to |
|-------|----------|---------|-----------|
| `.figure-eyebrow` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |
| `.period-readout` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |
| `.q-section-label` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |
| `.scale-pole` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |
| `.scale-option label` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |
| `.viz-legend-item` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |
| `.positioning-caption` | `color` | `var(--ink-ghost)` | `var(--ink-faint)` |

**In the JS color tokens object `C`:**

The SVG visualization uses hardcoded hex values. Update the tokens
to step up contrast — these mirror the CSS token changes above:

| Token | Current | Change to |
|-------|---------|-----------|
| `C.inkGhost` | `'#C8BDA8'` | Keep — used for borders/dividers only |
| `C.inkFaint` | `'#9C8E78'` | Keep — used for floating dots |

For SVG text labels (choice labels C0–C9, legend text), change fill
from `C.inkGhost` to `C.inkFaint` in the label layer and legend rendering.

For circle strokes in inactive state, keep `C.inkGhost` — the contrast
fix is for text and dots, not structural lines.

---

## Notes
- Do not change scoring, positioning diagram, fill level logic, or diagnosis
- Do not change animation timing
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these three fixes are done
