#!/usr/bin/env bash
set -euo pipefail

MSG="${1:-Update all changes}"

git checkout sandbox
git add -A
git commit -m "$MSG" || true
git push origin sandbox

git checkout develop
git pull --ff-only origin develop
git merge --no-ff sandbox -m "Merge branch 'sandbox' into develop"
git push origin develop

git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "Merge branch 'develop' into main"
git push origin main

git checkout sandbox
