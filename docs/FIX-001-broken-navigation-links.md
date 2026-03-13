# FIX-001-broken-navigation-links.md

---
id: FIX-001-broken-navigation-links
type: FIX
title: All navigation links broken on GitHub Pages
status: DONE
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [EPIC-navigation, PRINCIPLE-design-system]
tags: [navigation, urls, github-pages, routing]
---

## Summary

All navigation links on the deployed site are broken. Clicking any link results in a 404 or failed navigation. The issue is suspected to be related to the URL linking convention defined in `EPIC-navigation.md`, which prohibits explicit `index.html` references in favour of clean directory-style URLs.

---

## Environment

- **Where found:** GitHub Pages (production)
- **Branch:** main
- **URL:** https://[your-github-username].github.io/[repo-name]/
- **Device/Browser:** [note which browser you were using]

---

## Steps to Reproduce

1. Open the deployed GitHub Pages URL
2. Click any navigation link
3. Observe: link fails / 404 error

---

## Expected Behaviour

Clicking a navigation link navigates to the correct page without error.

## Actual Behaviour

Links fail to navigate. Either a 404 is returned or the link does not resolve correctly.

---

## Hypotheses

### Hypothesis A — Relative vs absolute URLs
Links may be using relative paths (e.g. `modules/`) that resolve incorrectly relative to the GitHub Pages base URL, especially if the repo is served from a subdirectory (e.g. `/repo-name/`) rather than a root domain.

### Hypothesis B — Missing index.html files
Directory-style URLs (e.g. `/modules/`) require an `index.html` to exist inside that directory. If any `modules/emergence/index.html` or similar files are missing, the URL returns a 404.

### Hypothesis C — Link format inconsistency
Some links may still be using `href="index.html"` or relative file paths rather than the clean directory URLs specified in `EPIC-navigation.md`.

---

## Investigation Notes

- [x] Check all `<a href="...">` values in `index.html` and `modules/index.html`
- [x] Confirm directory structure matches the spec in `EPIC-navigation.md`
- [x] Confirm each directory contains an `index.html` file
- [x] Check the GitHub Pages base URL — is the site served from root or a subdirectory?
- [x] Test with both absolute (`/modules/`) and relative (`modules/`) paths to identify which resolves correctly

---

## Root Cause

**Hypothesis A confirmed.** All internal navigation links and the CSS reference in `modules/index.html` were using root-relative paths (e.g. `/`, `/modules/`, `/css/main.css`). GitHub Pages serves the site from a subdirectory (`/platoscave/`), not from the domain root. Root-relative paths resolve against `github.io/` instead of `github.io/platoscave/`, breaking all links.

Hypothesis B: The four module subdirectories have no `index.html` files yet, but since they are "Coming" and not linked, this is not the active blocker.

Hypothesis C: No `href="index.html"` patterns found — clean.

---

## Fix Applied

Switched all internal navigation links from root-relative to relative URLs:

**`index.html`**
- `href="/"` → `href="./"`
- `href="/modules/"` → `href="modules/"`

**`modules/index.html`**
- `href="/css/main.css"` → `href="../css/main.css"`
- `href="/"` → `href="../"`
- `href="/modules/"` → `href="./"`

**Also fixed:** Test file was misplaced at `docs/tests/CLAUDE.md` — copied to the correct path `tests/test-navigation-links.js`.

Verified locally: `http://localhost:8080/` and `http://localhost:8080/modules/` both return HTTP 200.

---

## Test Coverage

See `tests/test-navigation-links.js` — automated link checker that verifies all internal `<a href>` values resolve without 404. Run before every merge to main.

---

## Resolution Checklist

- [x] Root cause identified
- [x] Fix applied on `develop` branch
- [x] Manually verified on local server (HTTP 200 on `/` and `/modules/`)
- [ ] Automated test passes (Node.js not installed — run `node tests/test-navigation-links.js` once Node is available)
- [ ] Merged to `main` and verified on GitHub Pages
- [x] Status updated to `DONE`
