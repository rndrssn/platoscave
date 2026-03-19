---
id: PRINCIPLE-punctuation
type: PRINCIPLE
title: To the Bedrock — Punctuation Conventions
status: DRAFT
created: 2026-03-16
updated: 2026-03-16
owner: Robert Andersson
relates_to: [VISION-product, PRINCIPLE-design-system]
tags: [copy, punctuation, tone, ui-text]
---

# To the Bedrock — Punctuation Conventions

## The Emdash Problem

The emdash (—) is the site's default connective tissue. It appears in prose, labels, readouts, summaries, captions, and navigation. Used well, it creates rhythm and directness. Overused, it makes every line feel breathless and structurally identical.

This principle defines where the emdash belongs and where it should be replaced.

---

## Two contexts, two rules

### 1. Prose — emdashes welcome

In flowing text where the reader is in a reflective mode — diagnosis bodies, module introductions, the vision document — emdashes serve their natural purpose: parenthetical asides, dramatic reframing, appositional clauses.

**Keep the emdash when it:**
- Introduces a reframe or surprise: "This is not disorder — it is a different kind of order"
- Sets off a parenthetical that would be awkward in commas: "the instruments of traditional management — governance structures, reporting lines, sanctioned decision forums — are reasonably well matched"
- Creates deliberate pause before a conclusion

**Limit:** no more than two emdashes per paragraph. If a paragraph has three or more, at least one should become a colon, semicolon, or period.

### 2. Data and UI — colons and semicolons preferred

In labels, readouts, summaries, captions, navigation elements, and any text that presents structured information, the emdash competes with the data. Use colons for label-value pairs, semicolons for separating items in a series, and periods for distinct statements.

**Replace the emdash with a colon when:**
- Separating a label from its value: `Load: heavy` not `Load — heavy`
- Introducing a description after a term: `Resolution: 40%` not `Resolution — 40%`
- A readout line has a name and an explanation: `Oversight: forum closed with no problem attached`

**Replace the emdash with a semicolon when:**
- Joining two related but independent clauses in a compact context: `Parameters: heavy load; hierarchical decision; specialized access`

**Replace the emdash with a period when:**
- Two ideas in a caption or readout are genuinely separate thoughts
- Stacking emdashes across consecutive lines — break the pattern

---

## Examples

### Before (emdash everywhere)
```
Resolution — 40% — forum closed after genuine problem-solving
Oversight — 55% — forum closed with no problem attached
Parameters: heavy load — hierarchical decision — specialized access
Cycle 20 of 20 — showing final run
03 — The Garbage Can Model
```

### After (context-appropriate punctuation)
```
Resolution: 40% — forum closed after genuine problem-solving
Oversight: 55% — forum closed with no problem attached
Parameters: heavy load; hierarchical decision; specialized access
Cycle 20 of 20 · showing final run
03 · The Garbage Can Model
```

Note: the middle dot (·) works for number-title pairs and status-label pairs where even a colon feels heavy. It is already used in the mini-nav.

---

## Where this applies

- All UI text rendered by JavaScript (summaries, readouts, captions, counters)
- HTML labels and section headers
- CSS does not generate punctuation, so no CSS changes needed
- Diagnosis prose and module introduction prose follow the "prose" rule, not the "data" rule

---

## Instructions for Claude Code

When writing or editing any user-facing text in this project:

1. Check whether the context is **prose** or **data/UI**
2. In prose: emdashes are fine, limit two per paragraph
3. In data/UI: prefer colons for label-value, semicolons for series, periods for separate thoughts
4. If a line has more than one emdash, rewrite it
5. When in doubt, read the line aloud — if the emdashes create ambiguity about what is a label and what is a value, replace them
