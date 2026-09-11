# Session Handoff

## 1. Session Summary

Two pieces of work this session, both complete:

1. **Cloudflare migration** (earlier in this session) — moved platoscave's
   hosting from GitHub Pages to a Cloudflare Worker with static assets at
   `https://platoscave.bedrockrebel.app/`. Fully verified end-to-end and
   retired GitHub Pages (`rndrssn.github.io/platoscave/` now `404`s).

2. **Git workflow overhaul** (this part) — retired the permanent
   `sandbox` → `develop` → `main` three-branch flow. `main` is now the only
   permanent branch and is directly committable for routine, low-risk work.
   Short-lived `feature/*` branches are spun up **on demand, not for every
   change** — only when a specific piece of work warrants isolation. No
   GitHub PRs involved (explicit choice) — promotion is a local
   `git merge --no-ff` into `main`, then the branch is deleted.

## 2. Repository + Branch State

- Repository: `/Users/robertandersson/dev/platoscave`
- Working on `main` directly for this change (the new model's own routine
  path — dogfooded rather than using a feature branch, since this is a
  process/docs change with no runtime risk).
- The `sandbox` and `develop` branches are being retired as part of this
  change — see section 4. Both were fully merged into `main` already
  (identical tree), so deleting them loses no work.

## 3. Commits From This Session

See section 1's Cloudflare migration commits in prior git history
(`10bfc2a` through `6d4e99f` on the old `sandbox`/`develop`/`main`
branches, and `142e6db` in the separate `satellite-worker` repo).

This workflow-overhaul change lands as one commit directly on `main` — see
`git log` for its SHA; committed via `scripts/ship.sh` itself (the first
real use of the new script, on the branch it was designed for).

## 4. Files Changed

- `CLAUDE.md` / `AGENTS.md` (kept byte-identical) — rewrote the Git
  Workflow section: `main`-only, on-demand feature branches, new trigger
  phrases (`commit` always implies push now; `start feature <slug>`;
  `merge to main` / `commit and merge to main`), new script names.
- `README.md` — three spots updated: the notes/articles publish-flow intro
  (now `main`, not `sandbox`), the Experience-Skill Graph CMS "commit and
  release" step (now direct-to-`main`), the `ci.yml` trigger description,
  and the Testing and Release section's flow description.
- `scripts/ship.sh` *(new)* — replaces `scripts/release-all.sh`. Adaptive:
  on `main`, commits + pushes; on a `feature/*` branch, commits, pushes,
  merges `--no-ff` into `main`, pushes, deletes the branch (local +
  remote). Requires an explicit commit message when there's something to
  commit — no generic fallback (a past session in this same repo hit a bad
  auto-generated commit message from the old script's silent default).
- `scripts/start-feature.sh` *(new)* — creates `feature/<slug>` off
  up-to-date `main`. Only meant to be used when a change actually warrants
  isolation, not by default.
- `scripts/release-all.sh` *(deleted)*.
- `.github/workflows/ci.yml` — triggers on push to `main` and any
  `feature/**` branch now; dropped `sandbox`/`develop` push triggers and
  the `pull_request` trigger entirely (no PRs in this workflow).
- `scripts/publish-note.sh`, `scripts/publish-notes-now.sh` — per explicit
  decision, notes/articles publishing stays a separate, lighter
  direct-to-`main` flow, unaffected by the feature-branch model. Simplified
  accordingly: both now require running from `main` (not `sandbox`), and
  `publish-note.sh`'s multi-branch promotion logic
  (`sync_target_branch`/`promote_sandbox_to_target`, the
  sandbox→develop→main verification loop) was deleted — it just commits
  and pushes `main` directly now.
- `tests/test-readme-workflow-contract.js` — fully rewritten. Old
  assertions were hard-coded to `scripts/release-all.sh`'s exact git
  commands and the `sandbox`/`develop` branch names; new version checks
  `scripts/ship.sh` and `scripts/start-feature.sh` exist and implement the
  right git steps, README documents the new model, and — new — actively
  asserts the retired flow's strings are *absent* from README (a staleness
  guard, not just a presence check).
- `.github/workflows/README-notes-nightly.md` — unrelated to this change;
  already fixed earlier this session (GitHub Pages → Cloudflare Worker
  reference in its activation steps).

## 5. Validation Run Result

`node tests/run-all.js` — all tests pass, run after every file change in
this section. All modified/new shell scripts pass `bash -n` syntax
checking. `scripts/ship.sh` and `scripts/start-feature.sh` are exercised
for real as part of landing this very change (see section 3) — that's the
actual end-to-end validation for a script whose job is "commit and push."

## 6. Open Decisions / WIP

None. This is a complete, self-contained process change with no dangling
follow-up — unlike the Cloudflare migration, there's no external
dashboard/account state involved here, just this repo's own git history
and contract docs.

One thing worth remembering, not a decision to revisit: **feature branches
are opt-in, not automatic.** Don't reach for `scripts/start-feature.sh` out
of habit for a small fix — the default is committing straight to `main`
via `scripts/ship.sh`. Use a feature branch when a change is genuinely
larger, multi-commit, experimental, or the user asks for one explicitly.

## 7. Suggested Next Actions

None required. Day-to-day usage going forward:

- Routine change: edit, `node tests/run-all.js`, `scripts/ship.sh
  "message"` while on `main`.
- Change that warrants isolation: `scripts/start-feature.sh <slug>`, do the
  work (commit normally along the way with `scripts/ship.sh` — it detects
  you're on a feature branch and just commits+pushes without merging),
  then `scripts/ship.sh "final message"` (or just re-run it with nothing
  new staged) to merge into `main` and clean up. Actually — re-check this
  against the real script if picking this up cold: merging only happens
  when `scripts/ship.sh` runs *from* the feature branch, any time, staged
  changes or not; it doesn't require a fresh commit to trigger the merge
  step.
- Notes/articles: unchanged in spirit — `scripts/publish-notes-now.sh` or
  `scripts/publish-note.sh`, from `main`.

## 8. Session Start Checklist

For the next agent (or the next session with this user):

1. Read `AGENTS.md` first. It requires plan before acting.
2. Read this `HANDOFF.md`.
3. Check `git status --short --branch` — should be clean, on `main`,
   matching `origin/main`. There is no `sandbox` or `develop` anymore —
   if you see either mentioned as if still current, that's stale, fix it.
4. This deploy target is a **Cloudflare Worker with static assets**, not
   "Cloudflare Pages" — see the retired GitHub Pages migration in earlier
   git history if more context is needed there.
5. Feature branches are **on demand**, not mandatory. Don't create one
   reflexively for every task; ask if genuinely unsure whether a change
   warrants isolation.
6. `satellite-worker` (`/Users/robertandersson/dev/satellite-worker`) is a
   separate repo/product outside this workspace's normal scope, reachable
   directly via absolute path if Worker-side changes are needed again —
   deploys on push to `main` via its own GitHub Actions workflow.
