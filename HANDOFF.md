# Session Handoff

## 1. Session Summary

This session migrated platoscave's deployment target from GitHub Pages to
Cloudflare Pages, so the site can be reached at `platoscave.bedrockrebel.app`
on the same Cloudflare zone/account as the `ioths-public-site` product site.

The repo-side work is complete, reviewed (`/code-review`), fixed, tested, and
released through `sandbox` → `develop` → `main`. The site is path-relative
with no `/platoscave/` subpath assumptions, so no page content changed — only
the build/deploy plumbing and its documentation.

**The Cloudflare/DNS/dashboard side of the migration has not started.** The
live site today is still `https://rndrssn.github.io/platoscave/`, served by
GitHub Pages from whatever the last `deploy.yml` run published — it is frozen
there and will not receive further automatic deploys, because this session
deleted `.github/workflows/deploy.yml`. Nothing is broken: GitHub Pages does
not take a site down just because its deploy workflow disappears; it simply
stops publishing new builds.

## 2. Repository + Branch State

- Repository: `/Users/robertandersson/dev/platoscave`
- Branch at handoff time: `sandbox`
- `sandbox`, `develop`, and `main` are all in sync with their remotes, at the
  same commit:
  - `sandbox`: `0c79db2` (== `origin/sandbox`)
  - `develop`: `558f361` (== `origin/develop`)
  - `main`: `f944670` (== `origin/main`)
- Working tree: clean, nothing staged or uncommitted.
- No unrelated pre-existing dirty files were present at session start or end.

## 3. Commits From This Session

1. `10bfc2a` — "Move deployment from GitHub Pages to Cloudflare Pages"
   (the migration itself; merged into `develop` as `c2a7200`, into `main`
   as `d6ff965`)
2. `0c79db2` — "Update all changes" (`scripts/release-all.sh` bug fix; merged
   into `develop` as `558f361`, into `main` as `f944670`)

Commit 2's message is the generic fallback from `scripts/release-all.sh`
(no `-m` argument was passed) rather than something descriptive — this
happened because a verification re-run of the script picked up the script's
own uncommitted edit and released it end-to-end before I noticed. **The user
was told and chose to leave the message as-is rather than rewrite pushed
history on `main`.** The content of that commit is correct and small (see
Files Changed below).

## 4. Files Changed

**Commit `10bfc2a`** — the migration:

- `scripts/cf-build.sh` *(new)* — Cloudflare Pages build entrypoint. Runs
  `node tests/run-all.js` first (restoring the test gate the old
  `deploy: needs: test` enforced, since `ci.yml` now runs independently of
  the Pages build), then `node scripts/build-notes.js`, then injects
  `WORKER_API_KEY` over the committed `__WORKER_API_KEY__` placeholder in
  the two Satellite Index sources.
- `scripts/lib/satellite-worker-targets.sh` *(new)* — single source of truth
  for those two file paths, sourced by both `cf-build.sh` and the existing
  `scripts/dev-satellite.sh` so they can't silently diverge.
- `package.json` — added `"build": "bash scripts/cf-build.sh"`.
- `.node-version` *(new)* — pins Node 20.
- `.github/workflows/deploy.yml` *(deleted)* — the GitHub Pages deploy
  workflow. Its test job was already duplicated by the pre-existing
  `ci.yml` (runs `node tests/run-all.js` on `sandbox`/`develop`/`main` +
  PRs), which was left untouched.
- `README.md`, `docs/10-guides/GUIDE-architecture.md`, `CLAUDE.md`/`AGENTS.md`
  — updated the deploy description, the `MAPTILER_API_KEY` domain
  restriction (`rndrssn.github.io` → `platoscave.bedrockrebel.app`), and the
  Worker key rotation/injection instructions to describe Cloudflare Pages
  instead of GitHub Actions/Pages.
- `tests/test-security-hardening-contract.js` — dropped the `deploy.yml`
  action-pinning assertions (file no longer exists); kept the `ci.yml` ones.
- `tests/test-satellite-index-contract.js` — repointed the target-path
  assertions at `scripts/lib/satellite-worker-targets.sh` and added
  assertions that both `cf-build.sh` and `dev-satellite.sh` actually source
  it (guards against the two drifting again).
- `scripts/dev-satellite.sh` — now sources the shared target list instead of
  its own copy.

**Commit `0c79db2`** — `scripts/release-all.sh` only: `git push origin
sandbox` was nested inside the "there was something to commit this run"
branch, so a release run with nothing newly staged (sandbox already carrying
an earlier separate `commit`) merged/pushed `develop` and `main` but silently
left `sandbox` unpushed. The push is now unconditional, after the
commit-or-skip step.

## 5. Validation Run Result

`node tests/run-all.js` — **all tests passed**, run multiple times across
this session (after the migration edits, after the code-review fixes, before
each commit, and after the `release-all.sh` fix). Last full run: passed
with no failures.

`npm run build` was exercised end-to-end manually: with `WORKER_API_KEY`
unset (builds notes/articles/tags, warns, does not touch the satellite
files) and with a dummy key set (injects into both satellite files; verified
the placeholder was restored afterward via `git checkout --`). No stray
secret was left in the working tree at any point.

## 6. Open Decisions / WIP

None blocking. This was a complete, self-contained infrastructure change.

- The commit-message quality issue on `0c79db2` (see above) — resolved:
  user chose to leave it.
- CSP `_headers` / `_redirects` treatment (matching `ioths-public-site`) was
  explicitly deferred by the user during planning — not part of this
  migration, worth a separate future pass.
- `.github/workflows/notes-nightly-deploy.yml.disabled` and
  `README-notes-nightly.md` — a separate, already-disabled nightly-deploy
  mechanism that also targeted GitHub Pages. Noticed but intentionally left
  untouched; may need the same GitHub Pages → Cloudflare Pages treatment
  later if it's ever re-enabled.

## 7. Suggested Next Actions — Remaining Migration Plan

Everything below happens **outside this repository**, in dashboards the
agent does not have access to. Do these in order; each step's verification
gates the next.

1. **Create the Cloudflare Pages project.**
   Cloudflare dashboard → Workers & Pages → Create → Pages → connect the
   `rndrssn/platoscave` GitHub repo.
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `/` (repository root — `build-notes.js` writes
     `notes/`, `articles/`, `tags/`, `data/` in place; there is no separate
     `dist/`)
   - Environment variables (set for **both** Production and Preview):
     - `WORKER_API_KEY` = the real Satellite Index Worker key
     - `NPM_FLAGS=--omit=dev` (skips installing the `playwright`
       devDependency during the Pages build; `test-browser-smoke-optional.js`
       auto-skips without it, same as local CI)
   - `.node-version` (committed, value `20`) should be picked up
     automatically; if not, set `NODE_VERSION=20` explicitly.

2. **Verify the first build on its `*.pages.dev` URL** before touching DNS.
   Check: home page, at least one module (e.g. `/modules/garbage-can/`), a
   generated notes/tags page, and — the most fragile surface — the
   **Satellite Index Explorer** (`/modules/satellite-index/three/`). Expect
   the Explorer's live analysis to still fail at this point (steps 4–5 below
   haven't happened yet) but the page itself, the fixture fallback, and the
   basemap should render.

3. **Attach the custom domain.**
   Cloudflare Pages project → Custom domains → add
   `platoscave.bedrockrebel.app`. Because `bedrockrebel.app` is already a
   Cloudflare zone on this account (same one `ioths-public-site` uses),
   Cloudflare manages the CNAME and certificate automatically — no manual
   DNS record needed. Wait for the domain to show Active, then re-verify the
   same pages as step 2 on the real domain.

4. **MapTiler dashboard.** Find the key used as `MAPTILER_API_KEY` in
   `modules/satellite-index/demo/satellite-index.js` and
   `modules/satellite-index/three/satellite-index-three.js`. Its allowed
   origins currently list `rndrssn.github.io` + `localhost` (per
   `CLAUDE.md`/`AGENTS.md`). Add `https://platoscave.bedrockrebel.app`.
   Re-verify the Explorer's Terrain/basemap context switches.

5. **satellite-worker repo** (separate repo, outside this workspace — not
   editable from here). Add `https://platoscave.bedrockrebel.app` to its
   CORS allow-list and redeploy the Worker
   (`https://satellite-worker.platoscave.workers.dev`). Re-verify
   `runAnalysis()` — a live "Load indices" request from the new domain —
   actually returns data instead of failing CORS preflight.

6. **Retire GitHub Pages**, only once steps 1–5 are all verified working on
   `platoscave.bedrockrebel.app`: GitHub repo → Settings → Pages → Source:
   **None**. This is the point where `rndrssn.github.io/platoscave/` actually
   stops serving; everything up to here has left it untouched and live.

7. Optional, not required for functional parity: revisit the deferred CSP
   `_headers` / `_redirects` treatment (see Open Decisions above), and decide
   whether `notes-nightly-deploy.yml.disabled` needs the same GitHub Pages →
   Cloudflare Pages update if it's ever reactivated.

## 8. Session Start Checklist

For the next agent (or the next session with this user):

1. Read `AGENTS.md` first. It requires plan before acting.
2. Read this `HANDOFF.md`.
3. Check branch/status with `git status --short --branch` — should be clean,
   on `sandbox`, matching `origin/sandbox`.
4. **Ask the user which of the 7 dashboard steps above have already been
   done** — none of that state is visible from git. Do not assume step order
   was followed outside a session if the user reports otherwise.
5. If asked to touch `scripts/release-all.sh` or run a release, run
   `git status`/`git diff` first — a prior session learned the hard way that
   a "just verifying" re-run of that script is not a no-op if the script
   file itself has uncommitted changes.
6. Do not re-add `.github/workflows/deploy.yml` or otherwise re-enable a
   GitHub Pages deploy without the user explicitly asking — the whole point
   of this migration was to move off of it.
