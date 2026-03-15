# HANDOFF.md

## Ready for Claude Code

### SPIKE-organised-anarchy-viz — Visualization
- Doc: `docs/SPIKE-organised-anarchy-viz.md`
- Task: Read the spike doc. Build `tests/test-gc-viz.html` — a standalone
  page that loads `gc-simulation.js`, runs the simulation with fixed
  parameters (moderate, unsegmented, unsegmented), and animates the
  result using d3 loaded from CDN. Render choice opportunities as fixed
  positions, problems as animated dots moving between choices each tick.
  Apply full design system compliance from `docs/PRINCIPLE-design-system.md`.
  Animation must be slow and deliberate — 600ms minimum per tick transition,
  d3.easeCubicInOut. No looping — run once through all 20 ticks and hold
  final state. Caption below in DM Mono, faint, uppercase.
- Branch: `experiment/organised-anarchy-mapper`

## Notes
- All new files must follow `docs/DOC-CONVENTIONS.md`
- Stay on `experiment/organised-anarchy-mapper`
- The only deliverable is `tests/test-gc-viz.html`
- d3 must be loaded from CDN — no local install
- This spike folds in the ticks feasibility work — prove d3 can consume
  the ticks array AND apply design system styling in the same file
- Do not begin any other spike
- Nothing else until this spike is resolved
