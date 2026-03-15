# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — problem entrance animation, state distinction, legend, C0/C9 labels, flight color
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Fix 1 — Problem entrance animation

**Current behaviour:**
All 20 problems are initialised at opacity 0 and appear suddenly when
they enter. The visitor cannot see the system building up over time.

**Expected behaviour:**
When a problem transitions from `inactive` to `floating` or `attached`
for the first time, it should fade in visibly — not just appear.

**Implementation:**
Track which problem IDs have ever been active using a Set:
```js
const everActive = new Set();
```

In `renderTick()`, for each problem transitioning from inactive to
active for the first time (id not in `everActive`):
- Add id to `everActive`
- Apply a fade-in transition: start at opacity 0, scale up from r:1
  to `PROB_R` over 400ms with `d3.easeCubicOut`

This makes the two problems entering each cycle clearly visible
as new arrivals rather than sudden appearances.

---

## Fix 2 — Visual state distinction

**Current behaviour:**
`floating` and `attached` dots look too similar — both are small
dark dots. The three active states need clearer visual distinction.

**Expected behaviour:**

| State | Fill | Opacity | Radius | Meaning |
|-------|------|---------|--------|---------|
| `inactive` | `C.inkGhost` | 0 | `PROB_R` | Not yet in system |
| `floating` | `C.inkFaint` | 0.7 | `PROB_R` | Searching for a forum |
| `attached` | `C.inkMid` | 1.0 | `PROB_R + 1` | In a forum, waiting |
| `resolved` | fades out | 0 | `PROB_R` | Processed |

The attached state gets `r: PROB_R + 1` — slightly larger — to signal
it has found a home. The floating state is slightly more transparent
to read as "searching, unsettled."

Also move attached dots **inside** the circle:
In `attachedPos()`, change `r = CHOICE_R + 8` to `r = CHOICE_R - 6`.
Dots now orbit inside the circle boundary — ontologically correct,
a problem inside the garbage can.

---

## Fix 3 — Legend below the animation

**Expected behaviour:**
A small legend below the animation, above the cycle readout.
Four items in a single row:

```
● ENTERING    ◌ SEARCHING    ● IN FORUM    · RESOLVED
```

Each symbol uses the color of that state. Labels in DM Mono,
uppercase, `0.55rem`, `--ink-ghost`. The symbols are small SVG
circles inline with the text, or use Unicode bullets styled
with CSS color.

Add as a static HTML element below `#viz-svg`:
```html
<div class="viz-legend" id="viz-legend" hidden></div>
```

Show it (remove hidden) when `drawViz()` is called.

CSS for `.viz-legend` — add to `<style>` block, no inline styles:
```css
.viz-legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
.viz-legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--mono);
  font-size: 0.55rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-ghost);
}
```

---

## Fix 4 — FLIGHT label color missing

**Current behaviour:**
RESOLVED shows in `--ochre`, OVERSIGHT in `--slate`, but FLIGHT
is not colored — it renders the same as the surrounding text.

**Fix:**
Apply `outcome-flight` class to the FLIGHT label in `showEndState()`.
The `.outcome-flight { color: var(--rust); }` CSS class already exists.
The label just needs the class applied.

---

## Fix 5 — C0 and C9 labels still missing

**Current behaviour:**
C0 label is hidden behind dots sitting below the circle.
C9 is clipped at the right edge.

**Fix for C0:**
The two dots below C0 are attached dots now inside the circle
(after Fix 2 moves them inside). The label sits at
`CHOICE_Y + CHOICE_R + 13`. If dots are inside the circle they
should no longer obscure the label.

**Fix for C9:**
Increase `PAD_H` from current value to `96`. Verify
`choiceX[9] + CHOICE_R + PROB_R` stays within `SVG_W`.

---

## Notes
- Do not change scoring, positioning diagram, fill level logic, or diagnosis text
- Do not change animation timing (800ms interval, 600ms transitions)
- No inline styles — CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these five fixes are done
