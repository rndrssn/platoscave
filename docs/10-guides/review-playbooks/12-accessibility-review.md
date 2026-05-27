# Accessibility Review Playbook

## Scope

WCAG-aligned baseline for semantics, keyboard support, and assistive tech compatibility.

## Check

- Landmark/headings/form labels and control semantics.
- Keyboard operability and visible focus.
- Contrast, motion sensitivity, and status announcements.
- ARIA usage correctness (no redundant/misleading ARIA).

### Visualization-specific ARIA patterns

Complex interactive visualizations have additional requirements beyond standard form/landmark checks.

#### Force-directed graphs (Skills graph, Flow & Queuing Concept Map)

- [ ] The SVG container has `role="img"` and `aria-label` describing the graph (e.g. "Skills graph showing experience and category relationships").
- [ ] Interactive nodes have `tabindex="0"` and respond to `Enter`/`Space` to activate (same as click).
- [ ] Focus state is visible: the shared `is-active` class from `css/components/force-graph-states.css` must produce a visible outline, not just a color change.
- [ ] Legend filter buttons use `aria-pressed` to communicate active/inactive state.
- [ ] Reduced-motion: simulation runs synchronously then stops; no continuous animation under `prefers-reduced-motion: reduce`.

#### Garbage Can simulation (Explorer, Assess)

- [ ] Simulation controls (sliders, select menus) have explicit `<label>` associations or `aria-label`.
- [ ] Live result regions use `aria-live="polite"` so screen readers announce when simulation output updates.
- [ ] The running/complete simulation state is communicated via an `aria-live` region or `aria-busy` on the output container.
- [ ] The SVG visualization has `role="img"` and a descriptive `aria-label` or `<title>` child element.

#### Mix Mapper (Learning & Feedback / Epistemic Bets)

- [ ] Mode toggle buttons use `aria-pressed` for active state.
- [ ] SVG arc/node labels are not the only source of information; a text summary is available.
- [ ] Animated pulses are suppressed or reduced under `prefers-reduced-motion: reduce`.
- [ ] Tooltip content is accessible via keyboard focus (not hover-only).

#### Satellite Index Explorer

- [ ] Primary action button (`Load indices` / `New viewport`) is keyboard focusable and has a visible focus ring.
- [ ] `Terrain` toggle uses `aria-pressed`.
- [ ] Loading state communicates progress: either `aria-busy` on the viewer container or an `aria-live` status region.
- [ ] Error and warning states (viewport limit, live imagery unavailable) appear in a visible, non-color-only way.

## Report

- Task-blocking accessibility failures (Must).
- Important but non-blocking gaps (Should).
- Progressive enhancements (Could).

## Verify

- Keyboard-only smoke test.
- Automated a11y checks (`node tests/test-a11y-critical-pages.js` if available) + manual spot check.
- For visualizations: verify each ARIA pattern above is present before marking the review complete.
