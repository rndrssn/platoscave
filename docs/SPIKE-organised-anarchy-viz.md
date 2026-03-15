---
id: SPIKE-organised-anarchy-viz
type: SPIKE
title: Organised Anarchy — Visualization Aesthetic
status: DRAFT
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [SPIKE-organised-anarchy-ticks, PRINCIPLE-design-system]
tags: [garbage-can, d3, visualization, design-system]
---

# Organised Anarchy — Visualization Aesthetic

## Dependency

**Requires `SPIKE-organised-anarchy-ticks` — VALIDATED.**

The working animation from that spike is the starting point. This spike applies the design system — it does not rebuild the animation from scratch.

---

## Purpose

Take the working d3 animation from `SPIKE-organised-anarchy-ticks` and make it feel like it belongs in the same notebook as the rest of the site. The visualization must comply fully with `PRINCIPLE-design-system.md` and feel like a scientific illustration, not a dashboard widget.

---

## Design Constraints

All of the following are required — not optional:

- Background: `var(--paper)` — no panel, no border, no bounding box
- Choice opportunities: sparse stroke-only circles or squares — no fill
- Problems: small dots — `--rust` when attached, `--ink-faint` when floating, disappear on resolved
- Participants (if shown): `--slate` — subtle, secondary to problems
- Labels in `DM Mono`, uppercase, `0.6rem`, `--ink-ghost`
- Animation: slow and deliberate — tick transitions at 600ms minimum, `d3.easeCubicInOut`
- No looping — run once through the 20 ticks, hold final state
- Caption below in `DM Mono`, faint, uppercase — like a figure number in a paper

The overall effect should feel like watching a diagram animate itself in a scientific paper. Unhurried. The motion carries meaning.

---

## What to Build

A revised standalone HTML file: `tests/test-gc-viz.html`

Same structure as `test-gc-ticks.html` but with full design system styling applied. Fixed parameters for now (`moderate`, `unsegmented`, `unsegmented`) — parameter input comes in the integration spike.

---

## Success Criteria

This spike is **VALIDATED** if:

- [ ] The visualization uses only design system colors, fonts, and spacing
- [ ] It feels like a scientific illustration — not a dashboard
- [ ] Motion is slow and deliberate — nothing bouncy or attention-seeking
- [ ] The visualization is legible at the container widths used on module pages
- [ ] Someone unfamiliar with the model can roughly understand what is happening from watching it

This spike is **ABANDONED** if:

- The animation cannot be made to feel calm and legible within design system constraints
- The visual language of nodes and movement does not communicate the model's logic

---

## Out of Scope

- Parameter input from a form
- Positioning diagram
- Diagnosis text
- Mobile responsiveness

---

## Branch

All work on `experiment/organised-anarchy-mapper`.

---

## Next Spike

When validated, this visualization feeds into `SPIKE-organised-anarchy-mapper` (integration).
