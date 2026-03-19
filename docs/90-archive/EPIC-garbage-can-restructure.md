---
id: EPIC-garbage-can-restructure
type: EPIC
title: Garbage Can Module — Four-Page Restructure
status: IN-PROGRESS
created: 2026-03-16
updated: 2026-03-16
owner: Robert Andersson
relates_to: [VISION-product, PRINCIPLE-coding-standards, PRINCIPLE-design-system, PRINCIPLE-punctuation, PRINCIPLE-organised-anarchy-questions, PRINCIPLE-organised-anarchy-diagnosis]
tags: [garbage-can, restructure, architecture, ux]
---

# Garbage Can Module — Four-Page Restructure

## Why

The current garbage can module is a single monolithic page (~1700 lines) that combines narrative, taxonomy, questionnaire, simulation, and results. It reads like a long document. The content serves four distinct purposes that should be four distinct pages, each with its own focus and audience.

## Structure

```
/modules/garbage-can/              → Narrative (index.html)
/modules/garbage-can/taxonomy/     → Organisation types reference
/modules/garbage-can/explorer/     → Simulation sandbox + comparison
/modules/garbage-can/assess/       → Self-assessment questionnaire
```

## Page definitions

### Page 1: Narrative
**URL:** `/modules/garbage-can/`
**Purpose:** The intellectual entry point. What is organised anarchy, what is the garbage can model, why does it matter.
**Audience:** Someone who has never heard of the model and wants to understand.
**Content:**
- The 1972 paper's core idea: organisations as garbage cans, not rational machines
- The four streams: problems, solutions, participants, choice opportunities
- Why this matters in practice: the gap between described and actual decision-making
- The three decision styles: deliberation, oversight, flight
- Connection to The Mix (the site's central thesis)
- Links to the other three pages as entry points

**Interactivity:** None. Long-form prose. Stands alone as a piece of writing.
**Tone:** From VISION-product: "Foundational, not procedural. Philosophical, not self-help."

### Page 2: Taxonomy
**URL:** `/modules/garbage-can/taxonomy/`
**Purpose:** Reference page. The classification system made concrete.
**Audience:** Someone who has read the narrative and wants to understand the types.
**Content:**
- The three structural dimensions explained: energy load, decision structure, access structure
- What each value means (light/moderate/heavy, unsegmented/hierarchical/specialized)
- The five organisation types with their diagnosis text:
  - The Coherent Traditional Organisation
  - The Complexity-Informed Organisation
  - The Mix
  - The Inverse Mix
  - The Siloed Organisation
- A static positioning diagram showing where each type sits
- The 3×3 grid showing how decision × access combinations map to types

**Interactivity:** Minimal. Possibly hover/click to highlight a type on the positioning diagram.
**Shared resources:** Diagnosis text from the existing `DIAGNOSES` object.

### Page 3: Simulation Explorer
**URL:** `/modules/garbage-can/explorer/`
**Purpose:** Sandbox. Play with the model directly.
**Audience:** Someone who wants to see the model in action without answering questions about their own organisation.
**Content:**
- Direct parameter selector: pick energy load, decision structure, access structure
- The field notes card (model explanation with bolded ontology terms)
- The simulation animation with all current features (phase labels, dimming, legend, counter)
- Summary statistics (single-run + 100-run average)
- "Run again" for stochastic variation
- **Comparison mode:** run two configurations side by side to see how different structures produce different outcomes

**Interactivity:** High. Parameter selection, simulation playback, comparison.
**Shared resources:** `gc-simulation.js`, field notes card, all viz code.

### Page 4: Self-Assessment
**URL:** `/modules/garbage-can/assess/`
**Purpose:** The personal experience. The recognition moment.
**Audience:** Someone who works in an organisation and wants to see their reality modelled.
**Content:**
- The 12-question grouped card questionnaire
- Positioning on the three axes (from raw scores)
- Organisation type diagnosis
- Simulation running with their parameters
- Summary statistics
- Contextual links back to the narrative for deeper understanding

**Interactivity:** High. Questionnaire, progressive reveal, simulation.
**Shared resources:** `gc-simulation.js`, `gc-scoring.js`, diagnosis text, all viz code.
**Link back:** After the diagnosis appears, a link: "Read more about this organisation type" → taxonomy page. After the simulation, a link: "Understand the model" → narrative page.

## Shared resources

| Resource | Used by | Location |
|----------|---------|----------|
| `gc-simulation.js` | Explorer, Assess | `/gc-simulation.js` |
| `gc-scoring.js` | Assess only | `/gc-scoring.js` |
| `css/main.css` | All four pages | `/css/main.css` |
| Diagnosis text | Taxonomy, Assess | Currently inline in HTML — extract to shared JS or keep duplicated |
| Field notes card | Explorer, Assess | HTML + CSS (duplicated or templated) |
| Viz code (drawViz, renderTick, etc.) | Explorer, Assess | Currently inline — consider extracting to `gc-viz.js` |
| Positioning diagram (drawPositioning) | Taxonomy, Assess | Currently inline — consider extracting |

## Open question: shared viz code

The simulation visualization (`drawViz`, `renderTick`, `probAttrs`, all the d3 layer setup) is ~400 lines of JS currently inline in the HTML. Both Explorer and Assess need it. Options:

1. **Extract to `gc-viz.js`** — a shared file loaded by both pages. Cleanest. Follows the single-responsibility principle. Requires defining a public API (what gets exposed).
2. **Duplicate** — copy the viz code into both pages. Simpler but creates maintenance burden.
3. **Defer** — build Explorer with duplicated code first, extract in a follow-up TECH-DEBT task.

Recommendation: Option 3. Get the pages working, then extract. Premature abstraction risks over-engineering the API.

## Open question: diagnosis text location

The `DIAGNOSES` and `DIAGNOSIS_CLUSTERS` objects are currently inline in the garbage-can HTML. Taxonomy and Assess both need them. Options:

1. **Extract to `gc-diagnosis.js`** — shared file.
2. **Duplicate** — copy into both pages.
3. **Keep in Assess, reference from Taxonomy as static HTML** — Taxonomy renders the diagnosis text as plain HTML (no JS lookup needed), Assess keeps the dynamic lookup.

Recommendation: Option 3 for now. The Taxonomy page can have the text hardcoded since it shows all five types statically. Assess keeps the dynamic lookup. Extract later if a third consumer appears.

---

## Stories — execution sequence

Each story is one handoff to Claude Code. Apply in order.

### STORY 1: CSS extraction and shared prep
**Prerequisite:** None
**Deliverable:** All module-page CSS moved from the `<style>` block to `css/main.css`. No functional changes.
**Why first:** Every subsequent story creates HTML pages that reference `main.css`. The styles need to be there before the pages are built. This also satisfies the coding standards compliance debt.
**Scope:**
- Move ~340 lines from `<style>` block to `main.css`
- Resolve any duplicate selectors
- Remove empty `<style>` tag from HTML
- Verify page renders identically after the move

### STORY 2: Narrative page
**Prerequisite:** STORY 1
**Deliverable:** `/modules/garbage-can/index.html` rewritten as the narrative essay. All questionnaire, simulation, and scoring code removed from this page.
**Scope:**
- Rewrite the module header and body as long-form prose covering the five content areas defined above
- Keep the nav, footer nav, module header structure, and tags
- Add navigation links to the other three sub-pages
- Remove the form, all stages, all JS except nav toggle
- Remove script references to `gc-simulation.js` and `gc-scoring.js`
- The page should be pure HTML + CSS, no JS beyond the mobile nav toggle

### STORY 3: Taxonomy page
**Prerequisite:** STORY 1
**Deliverable:** `/modules/garbage-can/taxonomy/index.html`
**Scope:**
- New page following the module page template (nav, footer nav, module header)
- Three dimensions explained with clear descriptions
- Five organisation types with diagnosis text rendered as static HTML
- Static positioning diagram showing the type grid (can reuse `drawPositioning` or render as pure SVG)
- The 3×3 decision × access grid showing cluster mappings
- Minimal JS: nav toggle, possibly a hover interaction on the type grid
- Links back to narrative, forward to explorer and assess

### STORY 4: Self-assessment page
**Prerequisite:** STORY 1, STORY 2 (the code being removed from index.html moves here)
**Deliverable:** `/modules/garbage-can/assess/index.html`
**Scope:**
- New page with the full current interactive flow: grouped card questionnaire → positioning → diagnosis → simulation → summary
- Move all existing JS (scoring, diagnosis lookup, drawViz, drawPositioning, form handling, step navigation) here
- Add contextual links: "Read more about this organisation type" → taxonomy, "Understand the model" → narrative
- All current features preserved: phase labels, dimming, dead tick speedup, dot stagger, searching pulse, legend/counter in SVG, field notes card, SVG tooltips, summary card with single-run + average
- The page loads `gc-simulation.js`, `gc-scoring.js`, and d3

### STORY 5: Simulation explorer page
**Prerequisite:** STORY 1, STORY 4 (reuses viz code from assess)
**Deliverable:** `/modules/garbage-can/explorer/index.html`
**Scope:**
- New page with direct parameter selection (three dropdowns or button groups for load, decision, access)
- Field notes card
- Simulation animation with all current features
- Summary statistics
- **Comparison mode:** a "Compare" button that opens a second simulation panel. User picks a second parameter set and runs both. Side by side on desktop, stacked on mobile.
- The page loads `gc-simulation.js` and d3 (no scoring needed)
- Links back to narrative and taxonomy

### STORY 6: Navigation and integration
**Prerequisite:** STORIES 2–5
**Deliverable:** All four pages cross-linked, module index updated
**Scope:**
- Footer nav on each page links to siblings: ← Narrative | Taxonomy | Explorer | Assess →
- Module index page (`/modules/index.html`) updated: module 03 shows as "Live" with link, possibly with sub-entries for the four pages
- Verify all internal links work with clean directory URLs
- Verify responsive behaviour on all four pages

---

## Out of scope

- Extracting `gc-viz.js` as a shared visualization module (future TECH-DEBT)
- Extracting `gc-diagnosis.js` (future TECH-DEBT if needed)
- Mobile polish beyond "acceptable" (future STORY)
- Final production copy for the narrative essay (can iterate after structure is in place)
- Any changes to `gc-simulation.js` or `gc-scoring.js`

---

## Success criteria

This epic is **DONE** when:
- [ ] Four pages exist at the defined URLs
- [ ] Each page has a clear, distinct purpose
- [ ] The self-assessment flow works end-to-end (questionnaire → diagnosis → simulation → summary)
- [ ] The explorer allows direct parameter selection and comparison
- [ ] The narrative reads as a standalone essay
- [ ] The taxonomy serves as a reference for all five types
- [ ] All pages cross-link correctly
- [ ] No `<style>` blocks remain in any HTML file
- [ ] All pages follow PRINCIPLE-coding-standards, PRINCIPLE-design-system, PRINCIPLE-punctuation
