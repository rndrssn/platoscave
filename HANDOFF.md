# HANDOFF.md

## Ready for Claude Code

### Bug report: Mapper — fill level, floating dots, RUN AGAIN weight
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Bug 1 — Fill level counts resolved problems, should count attached problems

**Location:** `renderTick()` function, lines 1036–1048

**Current behaviour:**
The fill level counts problems where `p.state === 'resolved'`. This means
circles only fill when problems have been fully resolved there — which
rarely happens, so circles appear mostly empty.

**Expected behaviour:**
The fill level should represent how many problems have ever been thrown
into that garbage can — i.e. problems that have attached to it at any
point during the simulation, regardless of outcome. This is the "fullness"
of the can, not the resolution rate.

The count should be cumulative — it never decreases. Once a problem has
attached to a circle, that circle's fill count goes up by one and stays up,
even if the problem later drifts away or resolves.

**Fix approach:**
Maintain a separate array `everAttached[M]` initialised to zeros. On each
tick, for each problem that is currently `attached` to a choice, increment
`everAttached[p.attachedTo]` if it has not already been counted for that
problem. Use `everAttached` to drive the fill level instead of counting
resolved problems.

Fill proportion = `everAttached[i] / 20` (total problem space is always 20).

---

## Bug 2 — Floating dots render above the SVG canvas bounds

**Location:** `floatPos()` function and SVG height definition

**Current behaviour:**
Some dots in `floating` or `inactive` state render above the circles,
outside the visible SVG area. This is because `floatPos()` calculates
positions relative to `CHOICE_Y` with a negative offset, and the SVG
viewBox top does not have enough room above the circles.

**Expected behaviour:**
All dots must remain within the SVG canvas bounds at all times. Floating
dots should drift in the space around the circles, not above the canvas.

**Fix approach:**
Either increase the SVG viewBox to add space above `CHOICE_Y`, or constrain
`floatPos()` so it never returns a `y` value less than a minimum safe margin
(e.g. `CHOICE_Y - CHOICE_R - 10`).

---

## Bug 3 — RUN AGAIN button renders too heavy

**Location:** `#replay-btn` element styling

**Current behaviour:**
The RUN AGAIN button text appears heavier than other mono labels on the page.

**Expected behaviour:**
Should match other mono labels — DM Mono, weight 300, uppercase.
Use existing tokens and classes from `css/main.css` only. No inline styles.

---

## Notes
- Do not change the animation timing or logic
- Do not change the questions, scoring, positioning diagram, or diagnosis text
- No inline styles — css/main.css tokens only
- Stay on `experiment/organised-anarchy-mapper`
- Nothing else until these three bugs are fixed
