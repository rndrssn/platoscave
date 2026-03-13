---
id: VISION-product
type: VISION
title: To the Bedrock — Project Vision
status: ACTIVE
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: []
tags: [vision, product, complexity, emergence]
---

# To the Bedrock — Project Vision

## What This Is

A personal portfolio site that publishes ideas through **interactive tools and visualizations**, not blog posts. Readers do not consume — they engage. They answer questions, manipulate models, and see their own organizational reality reflected back.

The medium is intentional: using complexity-aware, emergent tools to communicate ideas *about* complexity. The form enacts the argument.

---

## Name & Framing

**To the Bedrock** signals a preference for foundational, first-principled, philosophical treatment of topics — as a deliberate counterpoint to the pyramids, icebergs, and 2D decision matrices that dominate management discourse.

The site covers:
- **Product Management, Product Development, and Innovation** across what is called *The Mix* (see below)
- **Machine Learning / AI** — particularly computer vision and statistics/analytics
- **Physics** — academic background, occasional thread
- Ambitious intersections of all three

---

## The Mix

The central domain of experience. Refers to environments where **high-software-content and low-software-content practices collide**:

- Hardware product development with firmware/middleware/software layers
- Traditionally non-digital enterprises running IT/App products and services
- High-touch service delivery backed by software
- Any organization blending *traditionally trained management* (mechanistic, reductionist) with *modernly trained management* (complex, feedback-looping, emergent)

The Mix produces counter-intuitive emergent phenomena. That friction is the subject.

---

## Core Intellectual Thread

**Emergence is not subjective — but it is observer-relative.**

Emergence describes surprising macroscopic patterns arising from relatively simple entity descriptions, rules, and interactions. It is not a buzzword for mystery or non-determinism. It sits at the intersection of Control Theory, Computation, Thermodynamics, and Statistical Mechanics — the study of *matter with purpose* (Krakauer).

What is surprising is not observer-dependent. It exists independently. But how we experience and understand that surprise *is* relative to who, where, and when we are — our capacities, constraints, and position.

This observer-relativity is the main thread. It explains the fault line in The Mix: people operating from within a Traditional-Informed management frame cannot access the underlying complexity of the systems they manage — not because the complexity is hidden, but because their epistemic position, and their unwillingness to seek new perspectives, keeps them from it.

This is Plato's Cave. The shadows are real. The prisoners reason about them carefully. But they mistake the map for the territory.

---

## The Allegory in Practice

Traditional management (GANTT, matrices, linear hierarchies) treats representations of work — plans, metrics, reports — as reality itself. High ontological authority given to the map. Precision of measurement mistaken for understanding.

Complexity-informed management accepts that the system's full reality cannot be seen from any one vantage point. Knowledge is emergent, partial, co-created. It demands humility over control.

The site does not argue this abstractly. It **demonstrates it interactively** — putting users through structured tools that reveal something about their situation they did not expect to see.

---

## Site Structure — Concept

Not a blog. A set of **modules** — self-contained interactive applications, each exploring one idea. Navigation between modules is lateral, not hierarchical.

### Planned Modules

| # | Name | Description | Status |
|---|------|-------------|--------|
| 01 | Emergence Primer | Animated visualization of simple rules producing surprising patterns (e.g. Conway-adjacent). Conceptual on-ramp. | Planned |
| 02 | Complexity Maturity Diagnostic | User answers questions about their organization → receives a visualization of their complexity-thinking maturity. Radar/positioning output. | Planned |
| 03 | The Garbage Can Model | Interactive simulation of Cohen, March & Olsen's Garbage Can Model of organizational choice. Users map their own organization onto the model. | Planned |
| 04 | The Mix Mapper | Tool for mapping an organization's position in the high/low software content spectrum and surfacing implications. | Exploratory |

### Shell / Home Page

- Identity and framing: who, what, why
- Entry points to modules
- One live teaser visualization on landing (small, conceptual, alive)
- No blog feed, no timeline, no social proof

---

## Tone & Voice

- Foundational, not procedural
- Philosophical, not self-help
- Precise, not academic for its own sake
- Willing to be direct: *"Traditional is by and large wrong"* — not diplomatic where diplomacy obscures truth
- The writing assumes a reader capable of sitting with complexity; it does not simplify to the point of falsification

---

## Technical Constraints

- Hosted on **GitHub Pages**
- Developed with **Claude Code in VSCode**
- **Plain HTML/CSS/JS** — no framework overhead; keeps deployment trivial and d3/Three.js integration direct
- **d3.js** primary visualization library (data-driven, fine-grained control)
- **Three.js** for 3D conceptual pieces where appropriate
- Incremental build: shell first, one module at a time

---

## What Success Looks Like

A reader who works in The Mix — embedded in a traditionally managed organization, frustrated by the gap between how work is described and how it actually behaves — arrives at the site and feels, for the first time, that someone has named and modeled the thing they have been living inside.

They do not just read about it. They interact with a model of it, and see their own situation in the output.
