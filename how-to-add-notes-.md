# How To Add Notes (Simple CMS)

This site uses Markdown files as a lightweight CMS for notes.

## 1) Write a new note

Create a new file in:

`content/notes/published/`

Example filename:

`content/notes/published/my-new-note.md`

Use this frontmatter template:

```md
---
title: "My new note"
slug: "my-new-note"
date: "2026-03-23"
status: "published"
summary: "One-sentence summary shown on notes index."
tags: ["tag one", "tag two"]
---

Your note content here.
```

Rules:
- `slug` must be unique.
- `date` format is `YYYY-MM-DD`.
- `tags` can be any list of strings.

## 2) Build notes pages

Run:

```bash
node scripts/build-notes.js
```

This generates:
- `notes/index.html`
- `notes/<slug>/index.html`
- `tags/index.html`
- `tags/<tag>/index.html`
- `data/notes-index.json`
- `data/tags-index.json`

## 3) Preview locally

Run local server:

```bash
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/notes/`
- `http://localhost:8080/notes/<slug>/`

## 4) Publish to site

Commit and push your branch, then merge/deploy as usual.

Typical flow:

```bash
git add content/notes/published notes tags data
git commit -m "Add note: <title>"
git push origin <branch>
```

After merge to the deployed branch, the note is live at:

`/notes/<slug>/`

### Fast path (one command)

From `sandbox`, use:

```bash
scripts/publish-note.sh -m "Publish note: <slug>"
```

Optional quicker mode (notes-focused checks):

```bash
scripts/publish-note.sh -m "Publish note: <slug>" --quick
```

What it does:
- builds notes (`node scripts/build-notes.js`)
- runs tests (full suite by default, quick subset with `--quick`)
- commits note artifacts
- pushes `sandbox`
- merges and pushes into `develop` and `main`

## 5) How to update tags

Tags are generated, not edited directly in `tags/`.

Where to edit tags:
- Note tags: each note frontmatter in `content/notes/published/*.md`
  - Example: `tags: ["garbage can model", "organised anarchy"]`
- Module tags: `content/meta/modules.json`
  - Example: `"tags": ["garbage can model", "organised anarchy", "decision-making"]`

Rebuild after any tag change:

```bash
node scripts/build-notes.js
```

This regenerates:
- `tags/index.html`
- `tags/<tag>/index.html`
- `data/tags-index.json`
- and note pages/index that show tag chips

Publish tag changes:

```bash
git add content/notes/published content/meta/modules.json notes tags data scripts/build-notes.js
git commit -m "Update note/module tags"
git push origin <branch>
```

Important:
- Do not manually edit files under `tags/`; they are generated.
- A tag appears on the live site only after rebuild + commit + deploy.
