# HANDOFF.md

## Ready for Claude Code

### Fix: Mapper — counter mismatch, button style, dot positioning
- File: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

### Fix 1 — Counter mismatch
The live counters (boxes) and the end state summary (text below) show
different numbers. They are drawing from two different sources.

The fix: the end state summary must use exactly the same counts as the
live counters — not the simulation aggregate. One source of truth.
Remove whichever source is wrong and make both display the same values.

### Fix 2 — RUN AGAIN button styling
The RUN AGAIN button has a visible border box around it. This does not
match the design system. Remove the border. The button should be plain
text only — no box, no background, no border. Style it using existing
tokens from css/main.css only.

### Fix 3 — Dot positioning
Some problem dots are rendering above the choice opportunity circles
rather than inside or attached to them. Fix the positioning so dots
always render within the bounds of the visualization area and attach
correctly to their target circles.

## Notes
- Do not change anything else
- Do not change the questions, scoring, diagnosis text, or animation timing
- No inline styles — use css/main.css tokens only
- Stay on experiment/organised-anarchy-mapper
- Nothing else until these three fixes are done
