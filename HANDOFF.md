# HANDOFF.md

## Ready for Claude Code

### UX: Mapper — grouped card questionnaire
- File: `modules/garbage-can/index.html`, `css/main.css`
- Branch: `experiment/organised-anarchy-mapper`
- Read `CLAUDE.md` and `docs/PRINCIPLE-coding-standards.md` before touching anything

---

## Context

The 12-question form currently stacks vertically — 3–4 screen heights of scrolling before anything happens. It reads like a corporate survey. The questions already belong to three logical groups (energy load, access structure, decision structure). Show one group at a time as a card, with a "Continue" action between groups.

### New flow

1. Group 1 visible (5 questions about energy load) → "Continue" button
2. Group 1 fades/collapses, Group 2 appears (3 questions about access) → "Continue" button
3. Group 2 fades/collapses, Group 3 appears (4 questions about decision) → "Map this organisation" button
4. Submit triggers scoring as before

A step indicator shows progress: "1 of 3", "2 of 3", "3 of 3".

---

## Fix 1 — Add step indicator and continue buttons to the HTML

Each `q-section` gets a continue button. Groups 2 and 3 start hidden. A step indicator sits above the form.

Find (~line 388):
```html
        <form id="questionnaire" novalidate>

          <div class="q-section">
            <p class="q-section-label">01 &mdash; Energy load</p>
```

Replace with:
```html
        <p class="q-step-indicator" id="q-step">1 of 3</p>
        <form id="questionnaire" novalidate>

          <div class="q-section q-card" id="q-group-1">
            <p class="q-section-label">01 &mdash; Energy load</p>
```

Find the end of group 1, before group 2 starts (~line 467):
```html
          </div>

          <div class="q-section">
            <p class="q-section-label">02 &mdash; Access structure</p>
```

Replace with:
```html
            <div class="submit-row">
              <button type="button" class="submit-btn" id="q-continue-1">Continue</button>
              <p class="form-error" id="form-error-1" hidden>Please answer all questions in this section.</p>
            </div>
          </div>

          <div class="q-section q-card" id="q-group-2" hidden>
            <p class="q-section-label">02 &mdash; Access structure</p>
```

Find the end of group 2, before group 3 starts (~line 516):
```html
          </div>

          <div class="q-section">
            <p class="q-section-label">03 &mdash; Decision structure</p>
```

Replace with:
```html
            <div class="submit-row">
              <button type="button" class="submit-btn" id="q-continue-2">Continue</button>
              <p class="form-error" id="form-error-2" hidden>Please answer all questions in this section.</p>
            </div>
          </div>

          <div class="q-section q-card" id="q-group-3" hidden>
            <p class="q-section-label">03 &mdash; Decision structure</p>
```

Find the submit row (~line 582):
```html
          <div class="submit-row">
            <button type="submit" class="submit-btn">Map this organisation</button>
            <p class="form-error" id="form-error">Please answer all twelve questions before continuing.</p>
          </div>

        </form>
```

Replace with:
```html
            <div class="submit-row">
              <button type="submit" class="submit-btn">Map this organisation</button>
              <p class="form-error" id="form-error">Please answer all questions before continuing.</p>
            </div>
          </div>

        </form>
```

Note: the submit button moves inside group 3's `q-section` div. The closing `</div>` for group 3 now comes after the submit row.

---

## Fix 2 — Add the step navigation logic

Add this script block inside the existing `<script>` section, after the nav toggle handler and before the diagnosis lookup constants. This handles the continue buttons, per-group validation, and step indicator.

Insert after the nav toggle handler (~line 648):

```js
    // ─── Questionnaire step navigation ───────────────────────────────────────────
    const Q_GROUPS = [
      { id: 'q-group-1', questions: ['q0', 'q1', 'q2', 'q3', 'q4'], errorId: 'form-error-1', continueId: 'q-continue-1' },
      { id: 'q-group-2', questions: ['q5', 'q6', 'q7'],             errorId: 'form-error-2', continueId: 'q-continue-2' },
      { id: 'q-group-3', questions: ['q8', 'q9', 'q10', 'q11'],     errorId: null,           continueId: null },
    ];

    let currentGroup = 0;

    function validateGroup(groupIdx) {
      const group = Q_GROUPS[groupIdx];
      for (let i = 0; i < group.questions.length; i++) {
        if (!document.querySelector(`input[name="${group.questions[i]}"]:checked`)) {
          return false;
        }
      }
      return true;
    }

    function advanceGroup(fromIdx) {
      const group = Q_GROUPS[fromIdx];
      if (!validateGroup(fromIdx)) {
        if (group.errorId) document.getElementById(group.errorId).hidden = false;
        return;
      }
      if (group.errorId) document.getElementById(group.errorId).hidden = true;

      // Hide current group
      document.getElementById(group.id).hidden = true;

      // Show next group
      currentGroup = fromIdx + 1;
      document.getElementById(Q_GROUPS[currentGroup].id).hidden = false;
      document.getElementById('q-step').textContent = `${currentGroup + 1} of 3`;

      // Scroll to top of form area
      document.getElementById(Q_GROUPS[currentGroup].id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.getElementById('q-continue-1').addEventListener('click', function () {
      advanceGroup(0);
    });

    document.getElementById('q-continue-2').addEventListener('click', function () {
      advanceGroup(1);
    });
```

---

## Fix 3 — Update the form submit validation

The existing form submit handler validates all 12 questions at once. It should still do this (as a safety check), but the per-group validation in Fix 2 handles the user-facing error. Keep the existing validation but update the error message.

Find in the form submit handler (~line 1261):
```js
        if (!checked) {
          document.getElementById('form-error').style.display = 'block';
          return;
        }
```

No change needed — this is a fallback safety check. It stays as-is.

---

## Fix 4 — Add card and step indicator styles to `css/main.css`

Add to `css/main.css`:

```css
/* ─── Questionnaire card ─────────────────────────────── */
.q-card {
  background: var(--paper-dark);
  border: 2px solid var(--paper-deep);
  border-top: 2px solid var(--ink-ghost);
  padding: 2rem 1.5rem;
}

@media (min-width: 640px) {
  .q-card {
    padding: 2rem 2.5rem;
  }
}

.q-step-indicator {
  font-family: var(--mono);
  font-size: 0.62rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-ghost);
  margin-bottom: 1rem;
}
```

---

## Notes
- The form still submits normally via the existing `<form>` submit handler — the card navigation is purely visual progressive disclosure
- All radio inputs remain inside the single `<form>` element — no form restructuring
- Group 3 contains the submit button, so the user sees "Map this organisation" only after answering groups 1 and 2
- The existing `.q-section` class keeps its styles — `.q-card` adds the card treatment on top
- The old single `form-error` element stays as a fallback — per-group errors handle the normal case
- Do not change the scoring logic, question text, or radio input names
- Stay on `experiment/organised-anarchy-mapper`
