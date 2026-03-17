---
id: PRINCIPLE-design-system
type: PRINCIPLE
title: To the Bedrock — Design System
status: ACTIVE
created: 2026-03-13
updated: 2026-03-17
owner: Robert Andersson
relates_to: [VISION-product]
tags: [design, ux, css, typography, colour]
---

# To the Bedrock — Design System

## Aesthetic Direction

**Editorial Scientific Notebook.**

The feel of a well-kept researcher's field journal — one that happens to contain interactive diagrams. Warm, matte, paper-like. Precise but not sterile. Typographically led. Visualizations feel like scientific illustrations or careful sketches, not dashboards.

The design enacts the intellectual stance: unhurried, considered, grounded in material reality rather than digital gloss.

## Theme Architecture (2026-03-17)

The site now supports multiple visual themes with one global switch.

- Theme definitions live in `css/themes.css`
- Default design tokens live in `css/tokens.css`
- Active theme is selected in `theme.config.js` via `window.PLATOSCAVE_THEME`
- `js/theme-bootstrap.js` applies the configured theme to `<html data-theme="...">` on every page

This document defines the **default/base design language**. Experimental themes may intentionally diverge from these defaults.

---

## Non-Negotiables (Base Theme)

- No gradients
- No drop shadows
- No gloss, shine, or glass-morphism
- No pure white or pure black
- No rounded cards that feel "app-like"
- No generic sans-serif body text (no Inter, Roboto, Arial)
- No decorative icons or emoji
- No animation that draws attention to itself — motion serves meaning

---

## Color Palette (Base Theme)

All colors are matte and desaturated. The palette reads like ink on aged paper.

```
--paper:       #F4EFE4   /* base background — warm off-white */
--paper-dark:  #EBE4D5   /* slightly deeper — card backgrounds, sections */
--paper-deep:  #E0D7C4   /* deepest paper — borders, subtle dividers */

--ink:         #2A2018   /* primary text — warm dark, not cold black */
--ink-mid:     #5C4F3A   /* secondary text, body copy */
--ink-faint:   #9C8E78   /* tertiary — labels, captions, metadata */
--ink-ghost:   #C8BDA8   /* borders, dividers, very quiet elements */

--rust:        #8B3A2A   /* primary accent — links, active states, markers */
--rust-light:  #B85C40   /* hover state for rust */
--ochre:       #9A7B3A   /* secondary accent — "live" status, data highlights */
--slate:       #3D4F5C   /* tertiary accent — scientific/data context */
```

### Usage Rules

- Backgrounds use only the `--paper-*` range
- Body text uses `--ink` and `--ink-mid` exclusively
- `--rust` is used sparingly: links, one active border per component, key data markers
- `--ochre` reserved for status indicators and positive data signals
- `--slate` for data/scientific visualization contexts where a cooler note is needed
- Never place `--rust` and `--ochre` adjacent to each other

---

## Typography (Base Theme)

### Typefaces

| Role | Font | Weight | Style |
|------|------|--------|-------|
| Display / Headings | Cormorant Garamond | 300 | Often italic |
| Body | EB Garamond | 400 | Upright / italic |
| Labels / Metadata / Code | DM Mono | 300–400 | Upright |

All three loaded from Google Fonts.

```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:ital,wght@0,300;0,400;1,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet" />
```

### Scale & Rules

- Base font size: `18px`
- Minimum font size: `0.75rem`. No text element on the site should be smaller than this.
- Body line-height: `1.7`
- Heading line-height: `1.08–1.2`
- Max line length for body text: `62ch`
- Headings are almost always **italic, light weight (300)** — this is a deliberate softness against the precision of the content
- Labels and metadata use `DM Mono` in `uppercase` with `letter-spacing: 0.1em` minimum
- Pull quotes use `Cormorant Garamond`, large, italic, with a `2px --rust` left border

### CSS Variables

```css
--serif:     'EB Garamond', Georgia, serif;
--serif-alt: 'Cormorant Garamond', Georgia, serif;
--mono:      'DM Mono', 'Courier New', monospace;
```

---

## Layout (Base Theme)

- Max content width: `1140px`, centered
- Page padding (horizontal): `2.5rem`
- Section padding (vertical): `5rem 0`
- Section dividers: `1px solid var(--ink-ghost)` — never heavier
- Grid: CSS Grid preferred over Flexbox for page-level layout
- **No sidebar.** Single-column narrative flow with wide breakouts for visualizations.

### Hero Layout

Two-column grid: `1fr 420px`. Left: identity and text. Right: a live visualization. On mobile, stacks vertically with visualization below.

### Module Cards

Not rounded. `2px` border. A `2px --rust` top-edge accent line that animates wider on hover. Subtle `translateY(-2px)` on hover — no box shadow.

---

## Texture

A paper grain effect is applied to `body` via an inline SVG noise filter as a background image. Subtle — opacity `0.035`. This is what makes the background feel matte rather than flat.

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
```

---

## Navigation (Base Theme)

- Fixed top bar
- Left: site name in italic Cormorant Garamond
- Right: module links in DM Mono, `0.7rem`, uppercase, spaced
- Border-bottom: `1px solid var(--ink-ghost)`
- Background: `var(--paper)` — not frosted, not blurred, just paper

---

## Visualization Style (Base Theme)

Visualizations should feel like they belong in the same notebook as the text. Guiding principles:

- **Stroke over fill** — line-drawn elements preferred over solid shapes where possible
- **Muted palette** — draw from `--rust`, `--ochre`, `--slate`, `--ink-faint` only; no saturated colors
- **No chart borders or bounding boxes** — let visualizations breathe into the page
- **Labels in DM Mono** — all axis labels, annotations, captions
- **Captions below** in `--ink-ghost`, mono, uppercase, small — like a figure number in a paper
- Animations are slow and deliberate (`transition: 0.6s ease` or slower for data transitions)
- For d3: use `svg` elements directly on `var(--paper)` background — no panel background behind the chart
- For Three.js: background color matches `var(--paper)` — `0xF4EFE4` in hex

---
## Module Sub-Navigation

Modules with multiple sub-pages use a sibling nav bar placed immediately below the module header. The bar shows all sibling pages separated by middots. The current page is highlighted and non-clickable.

Pattern:
  Narrative · Taxonomy · Explorer · Self-Assessment

Placement: below the module header, with a bottom border. Duplicated at the bottom of the page before the footer.

CSS class: .module-sub-nav
Active state: .module-sub-nav-link--active (ink-mid, pointer-events none)
Hover: sage

This pattern applies to any module with two or more sub-pages. Single-page modules do not need it.

In docs/PRINCIPLE-design-system.md, update the card variants section:

## Card variants:
- Questionnaire card (.q-card): warm background (--paper-dark), ink-ghost top border. Used for interactive form content.
- Summary card (.sim-summary-card): warm background (--paper-dark), sage top border. Used for simulation results.
- Field notes card (.field-notes-card): page background (--paper), slate-light left border. Sidebar note style. Used for educational context and model explanations. Visually distinct from interactive cards.

Each card type has a distinct visual identity. Do not mix treatments between card types.

## Motion Principles

- Page load: staggered fade-in of sections (`animation-delay`)
- Hover: `translateY(-2px)` on cards, color transitions on links — nothing bouncy
- Data transitions in d3: `duration(600).ease(d3.easeCubicInOut)`
- No looping animations except in deliberate generative/emergence visualizations (where the loop *is* the point)

---

## Component Patterns

### Section Label
```html
<p class="mono">01 — Emergence</p>
```
Mono, uppercase, faint, with a `—` separator. Precedes every section title.

### Pull Quote
```html
<blockquote class="pull-quote">
  Emergence describes observations of systems that have surprising macroscopic patterns...
</blockquote>
```
Large italic Cormorant, rust left border, no quotation marks.

### Status Badge (for modules)
```html
<span class="module-status status-live">Live</span>
<span class="module-status status-soon">Coming</span>
```
Mono, uppercase. `--ochre` for live, `--ink-faint` for coming.

### Tags
Small mono labels, plain text, no border, no background. Used for topic tagging on modules. Tags must not look interactive — see `PRINCIPLE-interactive-elements.md`.

---

## File Structure

```
/
├── index.html
├── theme.config.js
├── /docs
│   ├── VISION-product.md
│   ├── PRINCIPLE-design-system.md
│   ├── EPIC-navigation.md
│   ├── PRINCIPLE-responsive.md
│   └── DOC-CONVENTIONS.md
├── /css
│   ├── main.css
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── utilities.css
│   ├── themes.css
│   └── pages.css
├── /js
│   └── theme-bootstrap.js
└── /modules
    ├── /emergence-primer
    ├── /maturity
    ├── /garbage-can
    └── /mix-mapper
```

Each module lives in its own subfolder with its own `index.html`, keeping concerns separate and deployable independently.
