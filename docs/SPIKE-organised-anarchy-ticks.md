---
id: SPIKE-organised-anarchy-ticks
type: SPIKE
title: Organised Anarchy — d3 Ticks Feasibility
status: OBSOLETE
created: 2026-03-13
updated: 2026-03-15
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-sim]
tags: [garbage-can, d3, animation, feasibility]
---

# Organised Anarchy — d3 Ticks Feasibility

## Dependency

**Requires `SPIKE-organised-anarchy-sim` — VALIDATED.**

This spike consumes the `ticks` array from `gc-simulation.js`. No other dependencies.

---

## Purpose

Answer one question: can d3 consume the `ticks` array from the simulation and produce a legible animated visualization of problems moving between choice opportunities?

This spike is purely technical. Aesthetics, design system compliance, and styling are explicitly out of scope. A working ugly animation is a full success. A beautiful broken one is a failure.

---

## What the Ticks Array Contains

Each tick is a snapshot of simulation state:

```js
{
  tick: Number,
  choices: [
    { id, state: 'inactive'|'active'|'resolved', energyRequired, energySpent }
  ],
  problems: [
    { id, state: 'inactive'|'floating'|'attached'|'resolved', attachedTo: choiceId|null }
  ]
}
```

20 ticks total (PERIODS = 20). 10 choices, 20 problems per tick.

---

## What to Build

A single standalone HTML file: `tests/test-gc-ticks.html`

It should:
1. Load `gc-simulation.js` and run with fixed parameters (`moderate`, `unsegmented`, `unsegmented`)
2. Load d3 from CDN
3. Render choices as fixed circles arranged in a row
4. Render problems as smaller dots
5. Animate problems moving to their attached choice on each tick, floating freely when unattached, disappearing when resolved
6. Step through ticks automatically at a readable pace (~800ms per tick)

No design system compliance required. Plain black and white is fine. The question being answered is whether the data structure drives the animation correctly — not whether it looks good.

---

## Success Criteria

This spike is **VALIDATED** if:

- [ ] Choices render as stable fixed positions
- [ ] Problems animate to their attached choice each tick
- [ ] Floating problems visually distinguish from attached ones
- [ ] Resolved problems disappear or change state visibly
- [ ] The animation runs through all 20 ticks without errors
- [ ] The overall motion feels like it could tell a story about organisational decision making

This spike is **ABANDONED** if:

- The ticks data structure cannot drive smooth d3 transitions
- The animation is too chaotic to be readable regardless of styling

---

## Out of Scope

- Design system compliance
- Color palette
- Typography
- Integration with the form or scoring

---

## Branch

All work on `experiment/organised-anarchy-mapper`.

---

## Next Spike

When validated, `SPIKE-organised-anarchy-viz` takes this working animation and applies the design system aesthetic.
