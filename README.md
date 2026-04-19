# platoscave

# To the Bedrock

A portfolio of interactive tools and visualizations about complexity, emergence, and the friction between how organizations describe their work and how that work actually behaves.

**Live site:** https://rndrssn.github.io/platoscave/

## Site Structure

- **Home** (`/`) — identity and orientation
- **Modules** (`/modules/`) — interactive artifacts (numbered `xx`, `xx.yy`)
- **Notes** (`/notes/`) — narrative context, stories, and reflections (text-first)
- **Site Notes** (`/colophon/`) — utility/meta information

## Modules

- **01 · Emergence Primer** *(planned)* — Animated visualization of simple rules producing emergent patterns.
- **02 · Complexity Maturity Diagnostic** *(planned)* — Radar/positioning output from organisational survey questions.
- **03 · The Garbage Can Model** — An interactive implementation of Cohen, March & Olsen's 1972 model of organizational decision-making. Includes a narrative essay, taxonomy of organisation types, a concept animation, an exploration surface, and an assessment flow.
  - **03.01 Narrative** (`/modules/garbage-can/`)
  - **03.02 Taxonomy** (`/modules/garbage-can/taxonomy/`)
  - **03.03 What's a Garbage Can?** (`/modules/garbage-can/can-explainer/`)
  - **03.04 Explore** (`/modules/garbage-can/explorer/`)
  - **03.05 Assess** (`/modules/garbage-can/assess/`)
- **04 · Management Mix** — Maps where traditional control and complexity-informed learning coexist, clash, or drift apart. Explores epistemic bets: the assumptions an organisation makes about when it can know enough to decide.
  - **04.01 Epistemic Bets** (`/modules/mix-mapper/`)
- **05 · CV & Skills** — CV plus interactive force-directed skills graph linking role chronology with domain, technical, and leadership depth.
  - **05.01 Skills Graph** (`/modules/experience-skill-graph/`)
  - **05.02 CV** (`/modules/experience-skill-graph/cv/`)
  - Shortcut URLs: `/skills/` -> `05.01`, `/cv/` -> `05.02`
- **06 · The Descent** — How one piece of product work moves from open problem to verifiable criterion. The sections of a brief as stations of a descent. Paired narratively with Module 04 (same epistemic bet, at unit scale).
  - **06.01 The Descent** (`/modules/the-descent/`)
  - **06.02 Section Map** (`/modules/the-descent/section-map/`)

### Module 06 Contract (Minimal)

- Canonical root is `06.01` at `/modules/the-descent/`.
- Section Map is `06.02` at `/modules/the-descent/section-map/`.
- `06.02` runtime is data-driven (`STATIONS`, `TRACKS`, `ARTIFACTS`) and the anchor mode toggle must remain mouse + keyboard accessible (Enter/Space on toggleable rows).

## Built With

- Plain HTML, CSS, and JavaScript — no framework runtime
- D3.js (v7) for visualizations
- Hosted on GitHub Pages
- Notes content is authored in Markdown and compiled to static pages with `node scripts/build-notes.js`

## Notes CMS (Markdown + Obsidian)

- Markdown source lives in `content/notes/published/` (and optional drafts in `content/notes/drafts/`)
- Each note uses YAML frontmatter (`title`, `slug`, `date`, `tags`, `status`; `summary` optional)
  - `status` must be one of: `published`, `draft`, `unpublished`
  - only `published` notes are rendered to `/notes` and `/tags`
- Build notes + tags pages:
  - `node scripts/build-notes.js`
- One-command publish flow from `sandbox`:
  - `scripts/publish-note.sh -m "Publish note: <slug>" --only <slug>`
  - optional quick mode: `scripts/publish-note.sh -m "Publish note: <slug>" --quick --only <slug>`
  - optional LLM polish: `OPENAI_API_KEY=... scripts/publish-note.sh -m "Publish note: <slug>" --quick --polish <slug> --only <slug>`
- Generated output:
  - `notes/index.html`
  - `notes/<slug>/index.html`
  - `tags/index.html`
  - `tags/<tag>/index.html`

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
2. On success, the site is uploaded and deployed via `actions/deploy-pages`

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

- Canonical pattern: `xx.01` is the module root (`/modules/<slug>/`), not a nested subpage.
- Create a new module landing page scaffold:
  - `node scripts/new-module.js --number 06 --slug decision-theater --title "Decision Theater"`
- The scaffold writes `modules/<slug>/index.html` with:
  - root-level `xx.01` active sub-nav (`href="./"`)
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
  - Examples: `'default'`, `'urban-grid1'`, `'decision-collision-cold'`, `'new-yorker'`

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
