# HANDOFF.md

## Ready for Claude Code

### Task: Apply punctuation conventions to all UI text
- Files: `modules/garbage-can/index.html`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, and `docs/PRINCIPLE-punctuation.md` before touching anything

---

## Context

A new principle has been added: `docs/PRINCIPLE-punctuation.md`. It defines when to use emdashes (prose) versus colons, semicolons, and middle dots (data/UI text).

Apply this principle to all user-facing text in `modules/garbage-can/index.html`. This is a copy-only pass — no logic, no layout, no CSS changes.

---

## Scope

Review and rewrite punctuation in the following areas:

### 1. Summary readout lines (in `showEndState()`)

These are data/UI context — use colons for label-value pairs.

Current pattern:
```
Resolution — 40% — forum closed after genuine problem-solving
```

Target pattern:
```
Resolution: 40% — forum closed after genuine problem-solving
```

The first emdash becomes a colon (label-value). The second emdash stays (introduces a description — prose-like within a data line). Apply to all choice-level and problem-level summary lines.

### 2. Parameters in caption text

Current:
```
Parameters: heavy load — hierarchical decision — specialized access
```

Target:
```
Parameters: heavy load; hierarchical decision; specialized access
```

Semicolons for a series of items.

### 3. Cycle counter end state

Current:
```
Cycle 20 of 20 — showing final run
```

Target:
```
Cycle 20 of 20 · showing final run
```

Middle dot for a lightweight status separator.

### 4. Section labels and module numbering

Current:
```
01 — Energy load
02 — Access structure
03 — Decision structure
03 — The Garbage Can Model
```

Target:
```
01 · Energy load
02 · Access structure
03 · Decision structure
03 · The Garbage Can Model
```

Middle dot for number-title pairs. These appear in `q-section-label` elements and `module-header-number`.

### 5. Positioning caption

Current:
```
Load: heavy — Decision: hierarchical — Access: specialized
```

Target:
```
Load: heavy; Decision: hierarchical; Access: specialized
```

Semicolons for series.

### 6. Diagnosis prose

Leave emdashes in the diagnosis body text as-is — these are prose context where emdashes are appropriate. Do NOT rewrite diagnosis text. Only check that no paragraph has more than two emdashes; if it does, convert the least impactful one to a colon or period.

---

## How to find all affected text

Search the file for `\u2014` (Unicode emdash) and `&mdash;` (HTML entity). Every instance should be evaluated against the principle:
- Is this prose or data/UI?
- If data/UI, replace with colon, semicolon, middle dot, or period as appropriate
- If prose, keep — unless the paragraph already has 2+ emdashes

The middle dot character is `\u00B7` in JavaScript strings and `&middot;` in HTML.

---

## Notes
- This is a copy-only pass — do not change any logic, layout, CSS, or scoring
- Do not rewrite the diagnosis body text beyond the 2-emdash-per-paragraph limit
- Do not change question text — those are carefully worded survey instruments
- Stay on `experiment/organised-anarchy-mapper`
