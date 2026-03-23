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
related_modules: ["03-garbage-can"]
---

Your note content here.
```

Rules:
- `slug` must be unique.
- `date` format is `YYYY-MM-DD`.
- `tags` can be any list of strings.
- `related_modules` is optional.

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
