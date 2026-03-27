---
id: GUIDE-10-security-review
type: GUIDE
title: Security Review Playbook
status: ACTIVE
created: 2026-03-25
updated: 2026-03-25
owner: Robert Andersson
relates_to: [GUIDE-llm-review-playbooks-index, CORE-quality-gates]
tags: [llm, review, playbook]
load_when: [when-running-reviews]
do_not_load_when: []
token_cost_estimate: low
---

# Security Review Playbook

## Scope

Client-side and pipeline security posture relevant to the repo.

## Check

- XSS/unsafe DOM insertion and sanitization gaps.
- Secrets exposure in source/config/scripts.
- Dependency/supply-chain risks.
- Security headers/CSP assumptions for static hosting.
- Runtime dependency sourcing consistency (avoid mixed CDN/local imports for same library).

## Report

- Exploitable vectors (Must).
- High-probability exposure risks (Must/Should by impact).
- Defense-in-depth improvements (Could).

## Verify

- Reproduce exploit path or show exact reachable sink.
- Provide remediation and re-test steps.
