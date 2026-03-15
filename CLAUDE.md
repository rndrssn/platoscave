# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — counters, resolved dots, border removal
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

### Fix 1 — Counters must read from simulation proportions, not ticks

The counters currently count from the ticks array of the last single
Monte Carlo iteration. This is wrong. The counters must display the
100-iteration mean proportions from the simulation output.

The simulation output is already logged to console:
`{ resolution: Number, oversight: Number, flight: Number }`

These are proportions (0–1). Convert to counts by multiplying by 20
(total number of problems) and rounding. Ensure the four counts sum
to exactly 20 — assign any rounding remainder to unresolved.

```js
const resolved   = Math.round(simOutput.resolution * 20);
const oversight  = Math.round(simOutput.oversight  * 20);
const flight     = Math.round(simOutput.flight     * 20);
const unresolved = 20 - resolved - oversight - flight;
```

These four values must be used for both the live counters during
animation and the end state summary after animation completes.
The animation itself continues to play from the ticks array — do
not change the animation logic.

### Fix 2 — Resolved dots stay inside the circle

When a problem resolves, instead of disappearing it must leave a
small filled dot inside the choice opportunity circle. Resolved dots
accumulate inside the circle across ticks. They do not move after
resolving. Use --rust for resolved dots inside circles to distinguish
them from active problem dots.

The circle should not change size or shape — resolved dots sit within
its bounds, arranged so they do not overlap each other.

### Fix 3 — Remove all counter border boxes

The four counter elements (RESOLVED, OVERSIGHT, FLIGHT, UNRESOLVED)
currently have visible border boxes around them. Remove all borders.
Plain text only — no box, no background, no border.
Use existing tokens from css/main.css only. No inline styles.

## Notes
- Do not change the animation timing or layout
- Do not change the questions, scoring, or diagnosis text
- Do not change the RUN AGAIN trigger or stochastic note
- No inline styles — css/main.css tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these three fixes are done
