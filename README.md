# platoscave

# To the Bedrock

A portfolio of interactive tools and visualizations about complexity, emergence, and the friction between how organizations describe their work and how that work actually behaves.

**Live site:** https://rndrssn.github.io/platoscave/

## Modules

- **03 · The Garbage Can Model** — An interactive implementation of Cohen, March & Olsen's 1972 model of organizational decision-making. Includes a narrative essay, taxonomy of organization types, simulation explorer, and self-assessment questionnaire.

## Built With

- Plain HTML, CSS, and JavaScript — no frameworks, no build step
- D3.js (v7) for visualizations
- Hosted on GitHub Pages

## Themes

- Styling tokens are defined in [`css/tokens.css`](css/tokens.css)
- Theme overrides live in [`css/themes.css`](css/themes.css)
- Active site-wide theme is set in [`theme.config.js`](theme.config.js)
- Edit only `window.PLATOSCAVE_THEME = '...'` in `theme.config.js` to switch all pages
  - Examples: `'default'`, `'urban-grid1'`, `'decision-collision-cold'`, `'new-yorker'`
- CSS architecture guide: [`docs/20-reference/CSS-ARCHITECTURE.md`](docs/20-reference/CSS-ARCHITECTURE.md)

## Credits

- Simulation based on Cohen, M. D., March, J. G., & Olsen, J. P. (1972). A Garbage Can Model of Organizational Choice. *Administrative Science Quarterly*, 17(1), 1–25.
- JavaScript implementation translated from [Mac13kW/Garbage_Can_Model](https://github.com/Mac13kW/Garbage_Can_Model) (MIT License)
- Self-hosted font families and licenses: [`THIRD_PARTY_FONTS.md`](THIRD_PARTY_FONTS.md)

## License

© 2026 Robert Andersson. All rights reserved.
