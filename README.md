# platoscave

# To the Bedrock

A portfolio of interactive tools and visualizations about complexity, emergence, and the friction between how organizations describe their work and how that work actually behaves.

**Live site:** https://rndrssn.github.io/platoscave/

## Site Structure

- **Home** (`/`) — identity and orientation
- **Catalogue** (`/modules/`) — interactive artifacts with local section numbering inside each entry
- **Notes** (`/notes/`) — narrative context, stories, and reflections (text-first)
- **Articles** (`/articles/`) — long-form essays and argument-driven writing
- **Site Notes** (`/colophon/`) — utility/meta information

## Navigation Shell

- Site title (`To the Bedrock`) links to `/`.
- Global link row is normalized by `js/nav-controller.js` to: `Notes`, `Articles`, `My Experience`, and a `Catalogue` trigger.
- `Catalogue` opens a contextual submenu (`Full catalogue` + live entries only). Entries marked `coming-soon` are intentionally hidden from this launcher.
- Sticky behavior: only the link row (`.main-nav`) pins on scroll (`.main-nav--pinned`); the title row remains in normal flow.

## Catalogue

- **Emergence** — Local rules yielding global patterns.
  - **01 Conway's Game of Life** (`/modules/emergence/`)
  - **02 GANTT meets Game of Life** (`/modules/emergence/ganttgol/`)
- **Organisational Diagnostic** *(planned)* — A situation check for predictive vs adaptive contexts.
- **The Garbage Can Model** — Organisational choice under ambiguity. An interactive implementation of Cohen, March & Olsen's 1972 model, with narrative essay, taxonomy of organisation types, a concept animation, an exploration surface, and an assessment flow.
  - **01 Organised Anarchy** (`/modules/garbage-can/`)
  - **02 Taxonomy** (`/modules/garbage-can/taxonomy/`)
  - **03 What's a Garbage Can?** (`/modules/garbage-can/can-explainer/`)
  - **04 Explore** (`/modules/garbage-can/explorer/`)
  - **05 Assess** (`/modules/garbage-can/assess/`)
- **Learning & Feedback** — Where traditional control and adaptive learning coexist. Explores epistemic bets and feedback debt: the assumptions an organisation makes about when it can know enough to decide, and what happens when evidence cannot revise those assumptions.
  - **01 Epistemic Bets** (`/modules/learning-feedback/`)
  - **02 Feedback Debt** (`/modules/learning-feedback/feedback-debt/`)
- **Flow & Queuing** — Queueing theory and the resource-utilization trap, using D3 visuals to show how average load, variability, backlog, and flow interact.
  - **01 Flow and Waiting** (`/modules/flow-queuing/`)
    - Plain-language introduction to queueing theory, utilization pressure, variability amplification, Little's Law, and TOC framing.
  - **02 Taxonomy** (`/modules/flow-queuing/taxonomy/`)
    - Flow-regime taxonomy for diagnosing load pressure, variability profile, release discipline, and constraint behavior.
  - **03 Explore** (`/modules/flow-queuing/explore/`)
    - Interactive lab with arrival/capacity controls, backlog charts, and live readouts from M/M/1, Kingman's approximation, and Little's Law.
  - **04 Concept Map** (`/modules/flow-queuing/concept-graph/`)
    - D3 force-directed graph showing how queueing theory, complexity science, and modern agile practice connect; observations they predict; folklore intuitions and the counter-intuitive surprises that contradict them.
  - **05 Appendix: M/M/1 Derivation** (`/modules/flow-queuing/derivation/`)
    - Mathematical appendix deriving the M/M/1 queueing formula from Poisson arrivals, exponential service, and steady-state balance equations.
- **From Ambiguity to Clarity** — How open work becomes clear enough to test and build. Paired narratively with Module 04 (same epistemic bet, at unit scale).
  - **01 From Ambiguity to Clarity** (`/modules/ambiguity-clarity/`)
  - **02 Clarity Map** (`/modules/ambiguity-clarity/section-map/`)

### Also on site

- **My Experience (Skills + CV)** — force-directed skills graph plus CV. Reachable via the footer and the shortcut URLs `/skills/` → `/modules/experience-skill-graph/` and `/cv/` → `/modules/experience-skill-graph/cv/`.
  - Uses a dedicated CV/Skills shell with a local view switcher (`Skills Graph` ↔ `CV`) rather than the standard module breadcrumb/sub-nav pattern.

### Module 06 Contract (Minimal)

- Canonical root is local section `01` at `/modules/ambiguity-clarity/`.
- Clarity Map is local section `02` at `/modules/ambiguity-clarity/section-map/`.
- Section `02` runtime is data-driven (`STATIONS`, `TRACKS`, `ARTIFACTS`) and the anchor mode toggle must remain mouse + keyboard accessible (Enter/Space on toggleable rows).

## Built With

- Plain HTML, CSS, and JavaScript — no framework runtime
- D3.js (v7) for visualizations, including queue charts, graph layouts, and simulation views
- Hosted on GitHub Pages
- Notes content is authored in Markdown and compiled to static pages with `node scripts/build-notes.js`

## Writing CMS (Markdown + Obsidian)

- Markdown source lives in `content/notes/published/` (and optional drafts in `content/notes/drafts/`)
- Each note uses YAML frontmatter (`title`, `slug`, `date`, `tags`, `status`; `summary` optional)
  - `status` must be one of: `published`, `draft`, `unpublished`
  - only `published` notes are rendered to `/notes` and `/tags`
- Build notes, articles, and tags pages:
  - `node scripts/build-notes.js`
- One-command publish flow from `sandbox`:
  - note: `scripts/publish-note.sh -m "Publish writing: notes:<slug>" --only notes:<slug>`
  - optional full-suite mode: `scripts/publish-note.sh -m "Publish writing: <target>" --only <target> --full-suite`
  - optional LLM polish: `OPENAI_API_KEY=... scripts/publish-note.sh -m "Publish writing: <target>" --polish <target> --only <target>`
- Generated output:
  - `notes/index.html`
  - `notes/<slug>/index.html`
  - `articles/index.html`
  - `articles/<slug>/index.html`
  - `tags/index.html`
  - `tags/<tag>/index.html`

## Articles in Writing CMS

- Markdown source lives in `content/articles/published/` (and optional drafts in `content/articles/drafts/`)
- Articles use the same frontmatter schema as notes (`title`, `slug`, `date`, `tags`, `status`; `summary` optional)
  - `status` must be one of: `published`, `draft`, `unpublished`
  - only `published` articles are rendered to `/articles`
- Publish one article:
  - `scripts/publish-note.sh -m "Publish writing: articles:<slug>" --only articles:<slug>`

## Experience-Skill Graph CMS (Markdown + Obsidian)

This graph uses a single Markdown file as a lightweight CMS.

### Source files

- Data file: `content/graph-data/experience-skill-graph.md`
- Loader: `modules/experience-skill-graph/graph-data-loader.js`
- Graph page: `modules/experience-skill-graph/index.html`

### Note schema

The data file includes frontmatter plus section rows:

```md
---
id: experience-skill-graph
type: graph-data
title: Experience-Skill Graph Data
---

## Skills
- skill-robotics | Robotics | 90 | [[cat-technical]]
```

Field rules:
- Row format:
  - categories: `- <id> | <label> | <order>`
  - skills/experiences: `- <id> | <label> | <order> | [[linked-id]], [[linked-id]]`
- `id`: stable slug used for linking and node identity
- `label`: rendered text in the graph
- `order`: numeric sort key (used for chronology and grouping)

### Linking model (Obsidian-style)

- Experience rows -> link to skills
- Skill rows -> link to category
- Links use `[[wikilink]]` format

Example experience row:

```md
- exp-aiim | AIIM (2021) | 5 | [[skill-pm]], [[skill-agile]], [[skill-robotics]]
```

### Common edits

1. Remove a skill from an experience:
   - remove the `[[skill-...]]` link in the relevant experience row
2. Add a skill to an experience:
   - add a skill row under `## Skills` if it does not exist
   - link it from the relevant experience row under `## Experiences`
3. Rename a node label:
   - update the row label segment (`| <label> |`)
4. Reorder chronology:
   - update `order` values in `## Experiences`

### Validate and release

1. Run tests:

```bash
node tests/run-all.js
```

2. Commit and release through normal flow:
   - `sandbox` -> `develop` -> `main`

## Deployment

The site deploys to GitHub Pages via the `Deploy to GitHub Pages` GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). It runs on every push to `main`:

1. `node tests/run-all.js` runs first
2. On success, the deploy job runs `node scripts/build-notes.js` so Markdown notes/articles are reflected in the Pages artifact
3. The site is uploaded and deployed via `actions/deploy-pages`

If a deploy needs to be re-run, trigger it manually from the Actions tab (`Run workflow` on the `Deploy to GitHub Pages` workflow), or push an empty commit:

```
git commit --allow-empty -m "Force GitHub Pages redeploy" && git push origin main
```

## Testing

- Canonical full suite:
  - `node tests/run-all.js`
- `run-all` includes navigation link checks and notes build checks.
- Optional real-browser smoke test:
  - `tests/test-browser-smoke-optional.js` (auto-skips unless Playwright is installed)

## Module Scaffolding

- Canonical pattern: local section `01` is the module root (`/modules/<slug>/`), not a nested subpage.
- Create a new module landing page scaffold:
  - `node scripts/new-module.js --slug decision-theater --title "Decision Theater"`
- The scaffold writes `modules/<slug>/index.html` with:
  - root-level `01` active sub-nav (`href="./"`)
  - module back-arrow link to `/modules/`

## Themes

- Styling tokens are defined in [`css/tokens.css`](css/tokens.css)
- Core UI color/link primitives:
  - `--link-inline`, `--link-inline-hover`, `--link-inline-visited` for inline prose links
  - `--link-ui`, `--link-ui-hover` for icon/action links (for example social icons)
- Shared primitives:
  - Icon sizing via `--icon-size-sm|md|lg`
  - Card styling via `--card-*` tokens (`surface`, `border`, `accent`, `radius`, `shadow`, `pad`)
- Shared monochrome SVG icons are stored in `assets/images/icons/` and rendered with CSS mask for theme-driven color
- Theme overrides live in [`css/themes.css`](css/themes.css)
- Active site-wide theme is set in [`theme.config.js`](theme.config.js)
- Edit only `window.PLATOSCAVE_THEME = '...'` in `theme.config.js` to switch all pages
  - Examples: `'default'`, `'decision-collision-cold'`, `'neon-brutalist-extreme'`, `'neon-brutalist-daylight'`

## Documentation

- Tracked project docs live under `docs/`.
- Optional local/private doc overlay workflow:
  - `scripts/sync-local-docs.sh`
  - `scripts/sync-local-docs.sh --source ~/private/platoscave-docs`

## Credits

- Simulation based on Cohen, M. D., March, J. G., & Olsen, J. P. (1972). A Garbage Can Model of Organizational Choice. *Administrative Science Quarterly*, 17(1), 1–25.
- JavaScript implementation translated from [Mac13kW/Garbage_Can_Model](https://github.com/Mac13kW/Garbage_Can_Model) (MIT License)
- Self-hosted font families and licenses: [`THIRD_PARTY_FONTS.md`](THIRD_PARTY_FONTS.md)

## License

© 2026 Robert Andersson. All rights reserved.
