# HANDOFF.md

## Ready for Claude Code

### Bug report: Mapper — visual exits, C9 clipping, RUN AGAIN style, sage color
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Bug 1 — No visual distinction between resolution, flight, and oversight exits

**Location:** `probAttrs()` function, lines 994–1019. `renderTick()` function.

**Current behaviour:**
All three exit types make the dot invisible with `opacity: 0`. A visitor
cannot tell the difference between a problem that was resolved, one that
fled, and one that was caught by oversight.

**Expected behaviour:**
Three distinct visual exits, implemented as d3 transitions in `renderTick()`:

**Resolution** (problem `state === 'resolved'`, previous state was `attached`):
- Dot moves to the center of its choice circle (`x: choiceX[p.attachedTo]`, `y: CHOICE_Y`)
- Dot shrinks to `r: 1.5` and changes fill to `C.ochre`
- Dot fades to `opacity: 0` after a short pause
- This happens over 600ms

**Flight** (problem transitions from `attached` to `floating`):
- Detect this by comparing `ticks[tickIdx-1].problems[id].state === 'attached'`
  and `ticks[tickIdx].problems[id].state === 'floating'`
- On the tick this transition occurs: briefly flash the dot fill to `C.rust`
  before it moves to its floating position
- Use a two-step transition: first change fill to `C.rust` (200ms),
  then move to float position and fade slightly (400ms)

**Oversight** (choice `state` transitions from `active` to `resolved`
while problems were attached to it in the previous tick):
- Detect: `ticks[tickIdx-1].choices[c].state === 'active'` and
  `ticks[tickIdx].choices[c].state === 'resolved'` and problems
  were attached to `c` in previous tick
- Those problems (now floating) briefly flash `C.ochre` on that tick

**Implementation note:**
`probAttrs()` currently returns static attrs per tick. To implement the
flight flash, add a `prevTick` parameter to `renderTick()` so transition
states can be detected by comparing previous and current tick.

---

## Bug 2 — C9 circle and dots clipped at right edge

**Location:** `PAD_H = 48` (line 889), `attachedPos()` uses `r = CHOICE_R + 8 = 23`

**Current behaviour:**
Last circle `choiceX[9] = SVG_W - 48`. Attached dots orbit at radius 23,
reaching `SVG_W - 25` which clips at the SVG edge.

**Fix:**
Increase `PAD_H` from `48` to `72`. This shifts all circles inward and
gives the rightmost circle enough margin for orbiting dots and the label.

---

## Bug 3 — RUN AGAIN button incorrectly uses submit-btn class

**Location:** Line 611 — `<button class="submit-btn" id="replay-btn" hidden>Run again</button>`

**Current behaviour:**
Uses `submit-btn` class which has a visible border and padding, making
it look like the form submit button.

**Expected behaviour:**
Plain text trigger — no border, no background, no padding.
DM Mono, weight 300, uppercase, `--ink-faint` color, `--rust` on hover.

**Fix:**
Remove `class="submit-btn"` and add a new CSS class `replay-btn` in
the `<style>` block with the correct styling using CSS tokens only.

---

## Bug 4 — C.sage color token is wrong

**Location:** Line 724 — `sage: '#3E5E35'`

**Current behaviour:**
`C.sage` is `#3E5E35` — a dark green. This is the old broken `--rust`
value. Attached dots use `C.sage` and render in the wrong color.

**Fix:**
Remove `C.sage` entirely. Replace all uses of `C.sage` in the file with
`C.inkMid` (`#5C4F3A`) for attached dots — a warm neutral that reads
clearly against the paper background without being an accent color.
The accent colors (`C.rust`, `C.ochre`) are reserved for the exit
transitions defined in Bug 1.

---

## Notes
- Do not change the questions, scoring, positioning diagram, or fill level logic
- Do not change animation timing (800ms interval, 600ms transitions)
- No inline styles — use CSS tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these four bugs are fixed
