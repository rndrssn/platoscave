# HANDOFF.md

## Ready for Claude Code

### STORY 2: Copy current page to /assess/, rewrite index.html as narrative essay
- Files: `modules/garbage-can/index.html`, `modules/garbage-can/assess/index.html` (new)
- Branch: `experiment/organised-anarchy-mapper`
- Epic: `docs/EPIC-garbage-can-restructure.md`
- Read `CLAUDE.md`, `docs/PRINCIPLE-coding-standards.md`, `docs/PRINCIPLE-punctuation.md`, and `docs/VISION-product.md` before touching anything

---

## Context

The current `modules/garbage-can/index.html` is a monolithic interactive page. It needs to become a standalone narrative essay. The interactive code will be needed later for the self-assessment page (Story 4).

Two steps in this handoff:
1. Copy the current file to `/assess/` as a working backup
2. Rewrite the original as a narrative essay

---

## Step 1 — Copy current page to /assess/

```bash
mkdir -p modules/garbage-can/assess
cp modules/garbage-can/index.html modules/garbage-can/assess/index.html
```

Then in `modules/garbage-can/assess/index.html`, update the relative paths:

| Find | Replace |
|------|---------|
| `href="../../css/main.css"` | `href="../../../css/main.css"` |
| `href="../../"` (nav home links) | `href="../../../"` |
| `href="../../modules/"` (nav index link) | `href="../../../modules/"` |
| `src="https://d3js.org/d3.v7.min.js"` | no change (CDN) |
| `src="../../gc-simulation.js"` | `src="../../../gc-simulation.js"` |
| `src="../../gc-scoring.js"` | `src="../../../gc-scoring.js"` |
| `href="../maturity/"` (footer nav) | `href="../../maturity/"` |
| `href="../mix-mapper/"` (footer nav) | `href="../../mix-mapper/"` |

Update the `<title>` tag:
```html
<title>Self-Assessment · The Garbage Can Model · To the Bedrock</title>
```

Do NOT make any other changes to the assess copy. It must remain a working interactive page. Verify it loads and functions at `/modules/garbage-can/assess/`.

---

## Step 2 — Rewrite index.html as narrative essay

Strip all interactive content from `modules/garbage-can/index.html` and replace with long-form prose. The page becomes a pure reading experience — no JS beyond the mobile nav toggle.

### 2a — Remove all scripts except nav toggle

Delete these script tags and their contents:
```html
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="../../gc-simulation.js"></script>
  <script src="../../gc-scoring.js"></script>
```

Keep only the nav toggle script:
```html
  <script>
    document.querySelector('.nav-mobile-toggle').addEventListener('click', function () {
      document.querySelector('.nav-links').classList.toggle('is-open');
    });
  </script>
```

Also add scroll restoration at the top of the script:
```js
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
```

### 2b — Remove all interactive HTML

Delete everything between `</header>` and the footer nav:
- The questionnaire (Stage 1)
- The results area (mini-nav, diagnosis, positioning, simulation sections)
- All form elements, SVGs, summary cards, buttons

### 2c — Rewrite the module header

Replace the current header content:

```html
      <!-- Module header -->
      <header class="module-header">
        <p class="module-header-number">03 &middot; The Garbage Can Model</p>
        <h1 class="module-header-title">Organised Anarchy</h1>
        <p class="module-header-body">
          In 1972, Cohen, March and Olsen asked a simple question: what if organisations
          do not make decisions the way they think they do? What if the process is not
          rational deliberation but something closer to a collision of independent streams,
          each following its own logic, meeting more or less at random?
        </p>
        <div class="module-tags">
          <span class="module-tag">Garbage Can Model</span>
          <span class="module-tag">Organisational theory</span>
          <span class="module-tag">Decision science</span>
          <span class="module-tag">Cohen, March &amp; Olsen 1972</span>
        </div>
      </header>
```

### 2d — Add the narrative essay

After the header, add the essay content. Use existing CSS classes — no new styles needed.

```html
      <!-- Essay -->
      <article class="module-essay">

        <section class="essay-section">
          <h2 class="essay-heading">The Four Streams</h2>
          <p class="essay-body">
            The Garbage Can Model describes organisations as the intersection of four
            independent streams: <strong>problems</strong> that need attention,
            <strong>solutions</strong> that exist whether or not a matching problem has been
            identified, <strong>participants</strong> whose attention drifts between forums,
            and <strong>choice opportunities</strong> where decisions could be made.
          </p>
          <p class="essay-body">
            In a rational model, a problem surfaces, participants gather, solutions are
            evaluated, and a decision is made. In the garbage can model, these streams
            collide inside choice opportunities with no guarantee that the problem in the
            room matches the solution being offered, or that the participants present are
            the ones who understand either.
          </p>
        </section>

        <section class="essay-section">
          <h2 class="essay-heading">Three Ways a Decision Gets Made</h2>
          <p class="essay-body">
            The model identifies three styles of decision-making, only one of which
            involves actually solving the problem at hand.
          </p>
          <p class="essay-body">
            <strong>Deliberation</strong> occurs when a problem attaches to a choice
            opportunity, sufficient energy accumulates, and the problem is genuinely
            resolved. This is what organisations believe happens most of the time.
            The model suggests it is the exception.
          </p>
          <p class="essay-body">
            <strong>Oversight</strong> occurs when a choice opportunity resolves with
            no problem attached. The meeting happened, the budget was approved, the
            decision was recorded. But the underlying problem was elsewhere, unaddressed.
            The organisation produced a decision without producing a resolution.
          </p>
          <p class="essay-body">
            <strong>Flight</strong> occurs when problems leave a choice opportunity
            before it resolves. The issue was raised, discussed, and then abandoned
            as participants moved on to other forums. The problem did not get solved.
            It migrated.
          </p>
        </section>

        <section class="essay-section">
          <h2 class="essay-heading">Organised Anarchy</h2>
          <p class="essay-body">
            Cohen, March and Olsen coined the term <em>organised anarchy</em> to
            describe institutions characterised by three properties: problematic
            preferences (the organisation's goals are unclear or inconsistent),
            unclear technology (the organisation does not fully understand its own
            processes), and fluid participation (who shows up to which decision
            varies unpredictably).
          </p>
          <p class="essay-body">
            Universities were the original case study. But the description applies
            to any organisation where the work is emergent, the environment is
            complex, and the management instruments were designed for a simpler system.
            This is what this site calls <em>The Mix</em>.
          </p>
        </section>

        <section class="essay-section">
          <h2 class="essay-heading">Why This Matters</h2>
          <p class="essay-body">
            Most organisations operate as if decisions are made rationally: a problem
            is identified, options are weighed, a choice is made. Governance structures,
            reporting lines, and capital allocation processes are all built on this
            assumption. The garbage can model reveals what happens when that assumption
            is wrong.
          </p>
          <p class="essay-body">
            In heavy-load organisations, problems outnumber the system's capacity to
            resolve them. Forums close without addressing the issues that were raised.
            Problems migrate between meetings, never finding a home. The organisation
            produces decisions at a steady rate, but the problems persist.
          </p>
          <p class="essay-body">
            The gap between the decisions being made and the problems being experienced
            is not a failure of communication or competence. It is a structural property
            of the system. The instruments were designed for a different kind of organisation.
          </p>
        </section>

        <section class="essay-section">
          <h2 class="essay-heading">Explore the Model</h2>
          <p class="essay-body">
            This module offers three ways to engage with the Garbage Can Model:
          </p>
          <div class="essay-links">
            <a class="essay-link" href="taxonomy/">
              <span class="essay-link-label">Taxonomy</span>
              <span class="essay-link-desc">The five organisation types and how they are classified</span>
            </a>
            <a class="essay-link" href="explorer/">
              <span class="essay-link-label">Simulation Explorer</span>
              <span class="essay-link-desc">Run the model with any parameter combination</span>
            </a>
            <a class="essay-link" href="assess/">
              <span class="essay-link-label">Self-Assessment</span>
              <span class="essay-link-desc">Answer twelve questions and see your organisation modelled</span>
            </a>
          </div>
        </section>

      </article>
```

### 2e — Update footer nav

The footer nav should link to sibling modules, not sub-pages:

```html
      <!-- Footer nav -->
      <nav class="module-footer-nav" aria-label="Module navigation">
        <a class="footer-nav-link" href="../maturity/">&larr; Previous</a>
        <a class="footer-nav-link" href="../mix-mapper/">Next &rarr;</a>
      </nav>
```

This is unchanged from current. Keep as-is.

### 2f — Update the title tag

```html
  <title>Organised Anarchy · The Garbage Can Model · To the Bedrock</title>
```

---

## Step 3 — Add essay styles to `css/main.css`

The narrative uses new classes for the essay content and sub-page links. Add to `css/main.css`:

```css
/* ─── Module essay ───────────────────────────────────── */
.module-essay {
  margin-top: 2rem;
}

.essay-section {
  padding: 2rem 0;
  border-top: 1px solid var(--ink-ghost);
}

.essay-heading {
  font-family: var(--serif-alt);
  font-weight: 300;
  font-style: italic;
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  line-height: 1.15;
  color: var(--ink);
  margin-bottom: 1.25rem;
}

.essay-body {
  font-family: var(--serif);
  font-size: 1rem;
  color: var(--ink-mid);
  line-height: 1.8;
  max-width: 60ch;
  margin-bottom: 1rem;
}

.essay-body:last-child {
  margin-bottom: 0;
}

.essay-body strong {
  font-weight: 500;
  color: var(--ink);
}

.essay-body em {
  font-style: italic;
}

/* ─── Essay sub-page links ───────────────────────────── */
.essay-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.essay-link {
  display: block;
  background: var(--paper-dark);
  border: 2px solid var(--paper-deep);
  border-left: 2px solid var(--sage);
  padding: 1.25rem 1.5rem;
  text-decoration: none;
  transition: transform 0.2s ease;
  max-width: 480px;
}

.essay-link:hover {
  transform: translateX(4px);
}

.essay-link-label {
  display: block;
  font-family: var(--serif-alt);
  font-weight: 300;
  font-style: italic;
  font-size: 1.15rem;
  color: var(--ink);
  margin-bottom: 0.25rem;
}

.essay-link-desc {
  display: block;
  font-family: var(--mono);
  font-size: 0.58rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}
```

---

## Verification

After applying:

1. Open `/modules/garbage-can/` — should show the narrative essay, no form, no simulation, no JS errors
2. Open `/modules/garbage-can/assess/` — should show the full interactive page (exact copy of what was there before)
3. Click the three sub-page links at the bottom of the narrative — taxonomy and explorer will 404 (not built yet), assess should load
4. Check that the essay reads well, headings are styled, sub-page link cards render correctly

---

## Notes
- The essay text is a first draft. It can be iterated after the structure is in place. The important thing is that the page exists and has the right shape.
- The essay content is based on the original Cohen, March & Olsen (1972) paper and the site's VISION-product.md framing
- The `module-essay`, `essay-section`, `essay-heading`, `essay-body`, `essay-link` classes are new and generic enough to reuse for future module narratives
- The `/assess/` copy is a safety net. Story 4 will clean it up (update nav, remove narrative content, add contextual links)
- Do not change `gc-simulation.js`, `gc-scoring.js`, or `css/main.css` beyond adding the new essay styles
- Follow `docs/PRINCIPLE-punctuation.md` for all text
- Stay on `experiment/organised-anarchy-mapper`
