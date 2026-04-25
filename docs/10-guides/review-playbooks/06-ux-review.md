---
id: GUIDE-06-ux-review
type: GUIDE
title: UX Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-04-25
owner: Robert Andersson
relates_to: [GUIDE-llm-review-playbooks-index, CORE-quality-gates]
tags: [llm, review, playbook]
load_when: [when-running-reviews]
do_not_load_when: []
token_cost_estimate: low
---

# UX Review Playbook

## Scope

Task success, cognitive load, feedback loops, and usability quality.

## Check

- Key user journeys and dead ends.
- Friction in forms, navigation, and content discovery.
- Feedback quality for loading/success/error states.
- Mobile usability and touch target safety.

### Explanation-of-explanation redundancy

A symptom that the design isn't self-explanatory: the page contains a legend *and* a caption restating the legend *and* an essay section explaining the legend. Each layer compensates for the previous one not landing. Flag when:

- [ ] A caption immediately below a legend restates category names or category visual encodings.
- [ ] An essay section after a viz spends its first paragraph re-explaining the legend swatches.
- [ ] A detail panel duplicates information already on the SVG (the node label is visible — repeating it as a heading is redundant).

The fix is usually upstream: the visualization's category model is too detailed, or the encoding is unclear. Don't paper over with prose.

### Microcopy role discipline

- [ ] Body copy in `<header>` regions describes content, not interactions ("Drag a node, hover to focus" belongs in viz chrome, not page header).
- [ ] Interaction instructions live in the viz chrome microtype tier (mono uppercase, ~0.6rem) — see UI Design System Review for the convention.

## Report

- Flows that block task completion (Must).
- Friction that materially slows users (Should).
- Redundant or contradictory information layers around a single artifact (Should).
- Delight/polish opportunities (Could).

## Verify

- Task-based walkthrough for primary journeys.
- Include desktop + mobile observations.
- For pages with visualizations: cover the legend, the SVG, the detail/scoreboard panel, and any caption — confirm each says something the others don't.
