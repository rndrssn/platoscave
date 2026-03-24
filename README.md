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

- **03 · The Garbage Can Model** — An interactive implementation of Cohen, March & Olsen's 1972 model of organizational decision-making. Includes a narrative essay, taxonomy of organisation types, a concept animation, an exploration surface, and an assessment flow.
  - **03.01 Narrative** (`/modules/garbage-can/`)
  - **03.02 Taxonomy** (`/modules/garbage-can/taxonomy/`)
  - **03.03 What's a Garbage Can?** (`/modules/garbage-can/can-explainer/`)
  - **03.04 Explore** (`/modules/garbage-can/explorer/`)
  - **03.05 Assess** (`/modules/garbage-can/assess/`)

## Built With

- Plain HTML, CSS, and JavaScript — no framework runtime
- D3.js (v7) for visualizations
- Hosted on GitHub Pages
- Notes content is authored in Markdown and compiled to static pages with `node scripts/build-notes.js`

## Notes CMS (Markdown + Obsidian)

- Markdown source lives in `content/notes/published/` (and optional drafts in `content/notes/drafts/`)
- Each note uses YAML frontmatter (`title`, `slug`, `date`, `summary`, `tags`, `status`)
- Build notes + tags pages:
  - `node scripts/build-notes.js`
- Generated output:
  - `notes/index.html`
  - `notes/<slug>/index.html`
  - `tags/index.html`
  - `tags/<tag>/index.html`

## Testing

- Canonical full suite:
  - `node tests/run-all.js`
- `run-all` includes navigation link checks and notes build checks.
- Optional real-browser smoke test:
  - `tests/test-browser-smoke-optional.js` (auto-skips unless Playwright is installed)

## Themes

- Styling tokens are defined in [`css/tokens.css`](css/tokens.css)
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
