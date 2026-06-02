# Session Handoff

## 1. Session Summary

This session explored a future Platoscave module about Bell's inequality, seeded from `content/notes/published/Wrap-head-around-Bell-inequality.md` and the generated note at `notes/bellsinequality/`.

No module implementation has started. The current artifact is a concept and research handoff for a future agent.

The agreed direction is an interactive D3 module that makes two ideas vivid:

- Alice and Bob each see locally random outcomes.
- When their results are compared by measurement setting, the paired correlations exceed what local hidden-variable "prewritten instruction" models can produce.

## 2. Repository + Branch State

- Repository: `/Users/robertandersson/dev/platoscave`
- Branch at handoff time: `sandbox`
- Recent commits:
  - `b5af4a2 updates to notes publish script`
  - `c2c036a Publish writing: notes:bellsinequality`
  - `e99e803 narrative on sat improved`
- Pre-existing modified files observed before creating this handoff:
  - `css/components/footer.css`
  - `css/layout.css`
  - `css/pages/content-cards.css`
  - `css/pages/module-foundation.css`
  - `modules/garbage-can/assess/index.html`
  - `notes/index.html`
  - `scripts/build-notes.js`
  - `scripts/lib/page-shell.js`

Do not revert or overwrite those changes unless the user explicitly asks.

## 3. Commits From This Session

None.

## 4. Files Changed

WIP / uncommitted:

- `HANDOFF.md`
  - Captures Bell's inequality module concept, research notes, animation pattern, open decisions, and implementation guidance.

## 5. Validation Run Result

Not run. This was a concept documentation step only; no runtime/module code was changed.

## 6. Open Decisions / WIP

Primary open decision:

- Module slug and title.
  - Candidate slug: `bell-inequality`
  - Candidate display title: `Bell's Inequality`
  - Candidate section 01 title: `Bell Lab`

Naming decision:

- The published note currently describes "Bob and Claire" after saying Alice creates the pair. The requested module concept should likely normalize to the conventional Alice/Bob measurement stations, with the source as `Source`, `Emitter`, or `Charlie`.

Module IA decision:

- Recommended starting structure:
  - `01 Bell Lab` at `modules/bell-inequality/`
  - Optional later `02 Hidden Instructions` at `modules/bell-inequality/hidden-instructions/`
  - Optional later `03 Correlation Landscape` at `modules/bell-inequality/correlation-landscape/`
- For an MVP, keep everything on section 01 and use in-page sections rather than multiple local pages.

Tone decision:

- Keep the module playful and tactile, but not toy-like. It should feel like an interactive systems lab in the existing Platoscave design language.

## 7. Research Notes

Core framing:

- Bell's theorem is not just "quantum mechanics is weird." It says local hidden-variable explanations imply a mathematical correlation bound, while quantum mechanics predicts and experiments observe violations of that bound.
- In CHSH form, local/factorizable theories obey `|S| <= 2`.
- Quantum mechanics can reach Tsirelson's bound, `2 * sqrt(2)`.
- In the CHSH game framing, local classical strategies can win at most `75%`; the optimal quantum strategy wins `cos^2(pi / 8) = (2 + sqrt(2)) / 4`, about `85.4%`.
- The pedagogical heart: Alice's marginal stream and Bob's marginal stream each look random, close to 50/50. The nonclassical structure appears only in the paired comparison, grouped by setting pair.

Useful sources checked:

- Bell, J. S. "On the Einstein Podolsky Rosen Paradox" (1964): https://doi.org/10.1103/PhysicsPhysiqueFizika.1.195
- HTML transcript of Bell 1964: https://sengerm.github.io/html-academic-publishing/examples/1964_Bell/Bell_1964_On%20the%20Einstein%20Podolsky%20Rosen%20paradox.html
- Stanford Encyclopedia of Philosophy, "Bell's Theorem": https://plato.stanford.edu/archives/spr2024/entries/bell-theorem/
- IBM Quantum Learning, "CHSH game": https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game
- Nobel Prize in Physics 2022 summary: https://www.nobelprize.org/prizes/physics/2022/summary/
- Virtual Lab by Quantum Flytrap paper: https://arxiv.org/abs/2203.13300

## 8. Recommended Module Concept

Use the Bell Lab / Coincidence Counter as the primary animation pattern.

This should be a round-based animation, not a continuous physics simulation:

1. A central source emits a paired event.
2. Alice and Bob independently choose one of two detector settings.
3. Each detector snaps to its selected angle.
4. Two particles travel outward from the source to the detectors.
5. Alice records `+` or `-`; Bob records `+` or `-`.
6. Each local stream looks random when viewed alone.
7. The paired event is copied into a central coincidence ledger.
8. Statistics update after each round:
   - Alice local `+/-` balance
   - Bob local `+/-` balance
   - correlation by setting pair
   - CHSH score or game win rate
   - classical ceiling at `75%`
   - quantum target at about `85.4%`

Main explanatory pattern:

- Animated trials create the concrete lab feeling.
- Accumulating statistics create the reveal.
- The punchline is not a single surprising event; it is the stable statistical pattern.

Supporting animation:

- Hidden Instruction Cards.
- Show a classical pair carrying prewritten answers for all possible settings, such as `A0`, `A1`, `B0`, `B1`.
- Let the viewer inspect or randomize instruction cards.
- Demonstrate that a fixed local answer sheet cannot satisfy all four CHSH winning conditions; at least one setting pair must fail.
- This makes the `75%` classical ceiling feel inevitable before the quantum run exceeds it.

Optional deeper animation:

- Correlation Landscape.
- Show a heatmap or curve of quantum correlation as angle difference changes.
- Highlight the standard CHSH angles and the resulting `S = 2 * sqrt(2)`.
- This is better as a later section or appendix, not the first screen.

## 9. Suggested Next Actions

When implementation is approved:

1. Load `README.md`, `design-system/index.html`, `design-system/BACKLOG.md`, and `docs/10-guides/GUIDE-architecture.md`.
2. Re-read `content/notes/published/Wrap-head-around-Bell-inequality.md`.
3. Decide the module slug/title with the user if needed.
4. Scaffold with `node scripts/new-module.js --slug bell-inequality --title "Bell's Inequality"` if this fits the repo script contract.
5. Implement section 01 as a single D3 lab page first.
6. Add a page-specific JS file with a one-sentence top-of-file purpose comment for `REPO_MAP.md`.
7. Add/update `modules/index.html`, `js/module-route-data.js`, and README catalogue entries if the module becomes live.
8. Add focused contract tests for:
   - module landing IA pattern
   - presence of D3 script and lab root
   - copy/labels for local randomness, classical ceiling, and quantum target
   - deterministic/statistical simulation helpers if factored into testable functions
9. Run `node tests/run-all.js` before any commit.

## 10. Session Start Checklist

For the next agent:

1. Read `AGENTS.md` first. It requires plan before acting.
2. Read this `HANDOFF.md`.
3. Check branch/status with `git status --short --branch`.
4. Do not touch unrelated dirty files.
5. Confirm whether the user wants implementation or further concept exploration.
6. If implementing UI, consult the design system before writing CSS.
