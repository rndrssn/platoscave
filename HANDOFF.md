# Session Handoff

## 1. Session Summary

This session migrated platoscave's deployment target off GitHub Pages, so
the site can be reached at `platoscave.bedrockrebel.app` on the same
Cloudflare zone/account as the `ioths-public-site` product site.

**Correction mid-session:** the plan originally assumed classic Cloudflare
Pages (a dashboard build-command/output-directory wizard). Cloudflare
deprecated Pages for new projects in April 2025 — the dashboard's Git-connect
"Create an app" flow now creates a **Worker with static assets** instead,
configured by `wrangler.jsonc` + `.assetsignore` in the repo rather than
dashboard fields. All repo-side docs (`README.md`, `CLAUDE.md`/`AGENTS.md`,
`docs/10-guides/GUIDE-architecture.md`) have been corrected to say "Cloudflare
Workers (static assets)", not "Cloudflare Pages". If you find a stray "Pages"
reference to this deploy target, it's a miss from this correction — fix it.

The repo-side work is otherwise complete: build entrypoint, migration commit,
code review + fixes, all released through `sandbox` → `develop` → `main`.
The site is path-relative with no `/platoscave/` subpath assumptions, so no
page content changed — only build/deploy plumbing and its documentation.

**The Cloudflare/DNS/dashboard side of the migration is in progress, live,
in this same session** (the user is following along in the Cloudflare
dashboard in real time). The live site today is still
`https://rndrssn.github.io/platoscave/`, served by GitHub Pages from whatever
the last `deploy.yml` run published — frozen there, receiving no further
automatic deploys, because an earlier part of this session deleted
`.github/workflows/deploy.yml`. Nothing is broken: GitHub Pages does not take
a site down just because its deploy workflow disappears; it simply stops
publishing new builds.

## 2. Repository + Branch State

- Repository: `/Users/robertandersson/dev/platoscave`
- Branch at handoff time: `sandbox`
- `sandbox`, `develop`, and `main` are in sync with their remotes as of the
  last release, at `5603032` / `22861d8` / `d632f57` respectively — **but
  see Files Changed below: there are new uncommitted changes on top of
  that**, not yet released.
- Working tree: **dirty** — see section 4.

## 3. Commits From This Session

Already released (`sandbox` → `develop` → `main`), from earlier in this
session:

1. `10bfc2a` — "Move deployment from GitHub Pages to Cloudflare Pages" (the
   original migration commit — written before the Pages→Workers correction,
   so its own message and content are Pages-flavored; see below for the
   correction that supersedes parts of it)
2. `0c79db2` — "Update all changes" (`scripts/release-all.sh` bug fix —
   generic message; the user was told and chose to leave it as-is rather
   than rewrite pushed history)
3. `5603032` — "Update HANDOFF.md with the Cloudflare Pages migration status
   and remaining plan" (superseded by this rewrite)

**Not yet committed** — see section 4.

## 4. Files Changed

Uncommitted, on `sandbox`, staged for the Pages→Workers correction:

- `wrangler.jsonc` *(new)* — Worker config. `name: "platoscave"`, no `main`
  (assets-only Worker, no custom script needed), `assets.directory: "."`,
  `assets.not_found_handling: "none"` (this is a real multi-page site with
  97 internally-checked paths, not an SPA — a missing path must 404, never
  silently fall back to `index.html`).
- `.assetsignore` *(new)* — keeps `node_modules/`, `.git/`, `.github/`,
  `tests/`, `scripts/`, `content/` out of what gets served publicly.
  `data/*.json` is deliberately **not** excluded —
  `js/notes-search.js`/`js/articles-search.js` fetch it client-side.
- `README.md` — Deployment section rewritten for Workers static assets:
  build command unchanged (`npm run build`), deploy command is now
  `npx wrangler deploy` reading `wrangler.jsonc`, and the `WORKER_API_KEY`
  env var now lives under **Settings → Build → Build variables and
  secrets** (explicitly build-time-only, not accessible at runtime — matches
  how `cf-build.sh` uses it, baked into static JS before upload rather than
  read at request time). Dropped `NPM_FLAGS=--omit=dev` — that was a Pages
  concept; not yet confirmed whether/how Workers Builds handles
  devDependency install (see Open Decisions).
- `CLAUDE.md` / `AGENTS.md` (kept byte-identical) — "Cloudflare Pages" →
  "Cloudflare Workers static assets"; `WORKER_API_KEY` injection description
  → Workers build variable.
- `docs/10-guides/GUIDE-architecture.md` — same terminology correction in
  the Satellite Index Worker-integration section and its request-flow
  diagram.

`node tests/run-all.js` passes with these changes (this doesn't exercise
`wrangler.jsonc` itself — nothing in this repo's test suite parses or
validates it; only real value is proving Cloudflare's build/deploy step
actually works).

## 5. Validation Run Result

`node tests/run-all.js` — all tests pass, run after these edits.

`wrangler.jsonc` has **not** been validated against a real `wrangler deploy`
yet — the dashboard project isn't created. First real signal comes from the
user clicking Deploy after this commit lands on `main`.

## 6. Open Decisions / WIP

- **Not yet committed.** Waiting on the user to say `commit` /
  `commit and release to main` for the `wrangler.jsonc`/`.assetsignore`/doc
  changes in section 4. Do this before the user retries Deploy in the
  Cloudflare dashboard, or `npx wrangler deploy` will still fail (no config
  on `main` yet).
- Whether Workers Builds needs an `NPM_FLAGS`-equivalent to skip installing
  the `playwright` devDependency during build, or whether it's a non-issue
  on this platform. Unconfirmed — check the first real build log once the
  project exists.
- Whether the `.assetsignore` list is complete. It's a first pass covering
  the obviously-internal directories (dev tooling, tests, raw Markdown
  source); `docs/`, `design-system/`, and a few others were deliberately
  left alone because their public-facing status wasn't confirmed this
  session — revisit if it matters.
- The commit-message quality issue on `0c79db2` (see section 3) — resolved
  in an earlier part of this session: user chose to leave it.
- CSP `_headers`/`_redirects` — still deferred (unrelated to the Pages vs.
  Workers question; `_headers`/`_redirects` are Pages-era static-file
  conventions and would need a Workers-static-assets equivalent researched
  if ever revisited).

## 7. Suggested Next Actions — Remaining Migration Plan

Steps 0 is repo-side (mine to do on request); 1–6 are dashboard/external,
each gating the next. **Step 1 is already in progress in this session** —
the user has the Cloudflare "Create an app" → Connect GitHub screen open.

0. **Commit and release** the `wrangler.jsonc`/`.assetsignore`/doc changes
   in section 4 to `main`, before the user clicks Deploy — otherwise the
   very first `npx wrangler deploy` has no config to read.

1. **Finish creating the Cloudflare Worker project.** Dashboard → Create an
   app → Connect GitHub → select `rndrssn/platoscave`. On the "Set up your
   application" screen: Project name `platoscave` (already prefilled), Build
   command `npm run build` (already prefilled), Deploy command leave as the
   default `npx wrangler deploy` placeholder. Click Deploy — it should now
   succeed once step 0 has landed on `main`.

2. **Add the build variable.** Project → Settings → Build → Build variables
   and secrets → add `WORKER_API_KEY` = the real Satellite Index Worker key.
   Retry the deployment afterward so the build picks it up (Deployments tab
   → ⋯ on the latest → Retry deployment).

3. **Verify the `*.workers.dev` (or whatever default URL it assigns) build**
   before touching DNS: home page, a module, a generated notes/tags page,
   and — the fragile surface — the Satellite Index Explorer
   (`/modules/satellite-index/three/`). Expect its *live* data fetch to
   still fail here (steps 5–6 below haven't happened); the page, fixture
   fallback, and basemap should still render.

4. **Attach the custom domain.** Project → Settings → Domains (wording may
   vary) → add `platoscave.bedrockrebel.app`. Same Cloudflare account/zone
   as `ioths-public-site`, so DNS + certificate are auto-managed. Re-check
   the same pages as step 3 on the real domain.

5. **MapTiler dashboard.** `MAPTILER_API_KEY` (used in
   `modules/satellite-index/demo/satellite-index.js` and
   `.../three/satellite-index-three.js`) is currently restricted to
   `rndrssn.github.io` + `localhost`. Add
   `https://platoscave.bedrockrebel.app`. Re-verify the Explorer's
   Terrain/basemap context switches.

6. **satellite-worker repo** (separate, outside this workspace). Add the
   new origin to its CORS allow-list, redeploy the Worker. Re-verify
   `runAnalysis()` — the live "Load indices" fetch — actually returns data
   instead of failing CORS preflight.

7. **Retire GitHub Pages**, only once 1–6 are all verified: GitHub repo →
   Settings → Pages → Source: **None**. This is the one moment
   `rndrssn.github.io/platoscave/` actually goes dark — deliberately last.

8. Optional cleanup, not required for parity: revisit `.assetsignore`
   completeness (Open Decisions), the deferred CSP treatment, and whether
   `notes-nightly-deploy.yml.disabled` needs the same GitHub→Cloudflare
   correction if it's ever reactivated.

## 8. Session Start Checklist

For the next agent (or the next session with this user):

1. Read `AGENTS.md` first. It requires plan before acting.
2. Read this `HANDOFF.md`.
3. Check `git status --short --branch` — if it shows the section 4 files
   still uncommitted, that work never landed; don't assume it did.
4. **Ask the user which of the 8 numbered steps above have already been
   done** — none of that state is visible from git, and this session ended
   mid-flow on step 1.
5. Do not describe this deploy target as "Cloudflare Pages" — it's a Worker
   with static assets. If you see that phrase describing platoscave's own
   hosting anywhere, it's stale; fix it.
6. If asked to touch `scripts/release-all.sh` or run a release, run
   `git status`/`git diff` first — a prior session learned the hard way that
   a "just verifying" re-run of that script is not a no-op if the script
   file itself has uncommitted changes.
7. Do not re-add `.github/workflows/deploy.yml` or otherwise re-enable a
   GitHub Pages deploy without the user explicitly asking.
