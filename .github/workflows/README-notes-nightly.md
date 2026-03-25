# Notes Nightly Deploy (Prepared, Not Active)

This repository includes a prepared workflow template:

- `.github/workflows/notes-nightly-deploy.yml.disabled`

It is intentionally **disabled** and will not run until you activate it.

## What It Does

When active, the workflow:

1. Runs nightly around **23:00 Europe/Amsterdam**.
2. Builds notes output (`node scripts/build-notes.js`).
3. Runs notes-specific release checks.
4. Detects generated file deltas in `notes/` and `tags/`.
5. Writes a per-run log entry (timestamp + created/updated/deleted paths).
6. Commits/pushes generated output and log updates to `main` when applicable.

## Logging

The workflow produces two logs:

1. **Repository run log** (persistent):
   - `logs/notes-deploy-runs.log`
   - Appended with run time and created/updated/deleted files
2. **Run artifact** (per run in Actions UI):
   - `notes-nightly-run-<run_id>`
   - Contains `notes-nightly-run-entry.md`

## Ad-hoc Single Run Switch

`workflow_dispatch` includes these inputs:

- `ad_hoc_run` (boolean): must be true to proceed
- `record_run_without_changes` (boolean): append repository log even if no notes/tags changes
- `reason` (string): optional reason included in the run log entry

This gives you a manual one-off deployment mode without enabling nightly schedule.

## Activation Steps

1. Ensure GitHub Pages serves from `main` (root).
2. Ensure Actions permission is set to allow writing repository contents:
   - Repository Settings -> Actions -> Workflow permissions -> `Read and write permissions`
3. Rename workflow file:
   - from: `.github/workflows/notes-nightly-deploy.yml.disabled`
   - to: `.github/workflows/notes-nightly-deploy.yml`
4. In the file, uncomment the `schedule:` block.
5. Commit and push to `main`.
6. Run once manually via `workflow_dispatch` in Actions tab to validate.

## Why Two Cron Entries?

GitHub cron is UTC-only. The template includes two UTC schedule entries (21:00 and 22:00 UTC) and a guard step:

- It only proceeds when local `Europe/Amsterdam` hour is `23`.
- This handles CET/CEST transitions without external tooling.

## Disable Again

To disable automation later:

1. Rename back to `.yml.disabled`, or
2. Comment out the `schedule:` block.

Then commit and push.
