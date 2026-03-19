---
id: PRINCIPLE-interactive-elements
type: PRINCIPLE
title: To the Bedrock — Interactive Element Hierarchy
status: ACTIVE
created: 2026-03-16
updated: 2026-03-16
owner: Robert Andersson
relates_to: [PRINCIPLE-design-system, PRINCIPLE-coding-standards]
tags: [design, ux, buttons, links, interactive, hierarchy]
---

# To the Bedrock — Interactive Element Hierarchy

## Problem

The site uses multiple interactive elements (buttons, links, labels) that look too similar. Tags look like buttons. Links are invisible. CTAs have no visual hierarchy. This principle defines four tiers of interactive and non-interactive elements, each with a distinct visual treatment.

---

## The Four Tiers

### Tier 1 — Primary CTA

The main action the user should take next. One per visible context. Bordered box, most prominent.

**Visual:** DM Mono, uppercase, 0.7rem, letter-spacing 0.12em. Border: 1px solid `--ink-ghost`. Color: `--ink-mid`. On hover: border `--ink-mid`, color `--ink`. Padding: 0.75rem 2rem. Disabled state: `--ink-ghost` color and border, cursor not-allowed.

**CSS class:** `.cta-primary` (currently `.submit-btn`)

**Used for:**
- Map this organisation
- See how decisions play out
- Continue (questionnaire groups)
- Run simulation (explorer)

### Tier 2 — Secondary Action

A minor or repeat action. No border, plain text, less prominent than primary. Prefixed with a right chevron (›) as a subtle affordance.

**Visual:** DM Mono, uppercase, 0.7rem, letter-spacing 0.12em. Color: `--ink-faint`. No border, no background. On hover: color `--rust`. Cursor pointer. `::before` content: `\203A` (›) with `margin-right: 0.35rem`.

**CSS class:** `.cta-secondary` (currently `.replay-btn`)

**Used for:**
- Run again
- Retake assessment
- Hide questionnaire

### Tier 3 — Navigation Link

Takes the user to another page or section. Visually distinct from actions — uses sage and an underline on hover.

**Visual:** DM Mono, uppercase, 0.6rem, letter-spacing 0.1em. Color: `--sage`. No underline by default. On hover: `--sage-light`, text-decoration underline. Transition: color 0.2s ease.

**CSS class:** `.nav-link-contextual` (currently `.diagnosis-link` and `.footer-nav-link`)

**Used for:**
- Read more about the organisation types
- Understand the model
- Footer nav (← The Garbage Can Model, Explorer →)
- Essay sub-page link cards (these have their own card treatment but the text follows this tier)

### Tier 4 — Tag / Label

Metadata. Not interactive. Must NOT look like a button or link.

**Visual:** DM Mono, uppercase, 0.58rem, letter-spacing 0.1em. Color: `--ink-faint`. No border, no background, no hover state. Plain text.

**CSS class:** `.tag-label`

**Used for:**
- Garbage Can Model, Organisational theory, Decision science
- Any future metadata tags on module pages

---

## Rules

1. **Tags must never have borders.** A bordered element implies interactivity.
2. **Only primary CTAs get borders.** The border is the primary visual affordance for "click me."
3. **Links always use sage.** Sage means "this goes somewhere." No other element uses sage as its primary color.
4. **Secondary actions are plain text.** They are available but not calling for attention.
5. **One primary CTA per visible context.** If two bordered buttons are visible at the same time, one of them should be secondary.

---

## Migration from Current Classes

| Current class | New class | Change needed |
|---|---|---|
| `.submit-btn` | `.cta-primary` | Rename or alias |
| `.replay-btn` | `.cta-secondary` | Rename or alias |
| `.collapsible-toggle` | `.cta-secondary` | Restyle — currently uses bordered box |
| `.diagnosis-link` | `.nav-link-contextual` | Add underline on hover |
| `.footer-nav-link` | `.nav-link-contextual` | Already close, add underline on hover |
| `.module-tag` | `.tag-label` | Remove border |
| `.essay-link-label` | Tier 3 text inside a card | Keep card treatment, ensure label uses sage |

---

## Instructions for Claude Code

When creating or modifying any interactive element:

1. **Determine the tier** before choosing a class
2. **Never use a bordered box for non-interactive elements**
3. **Never use sage for non-navigation elements** — sage means "this is a link"
4. **Secondary actions should not compete with primary CTAs** — if both are visible, the primary must be more prominent
5. **Read this file** before adding any button, link, or label to any page
