---
title: Making Instructions Executable
slug: making-instructions-executable
date: 2026-06-03
status: published
summary: Tests can enforce the observable consequences of project instructions, leaving judgment to contributors.
tags:
  - ai-agents
  - testing
  - governance
related_modules: []
---


Project instructions often ask contributors to keep route documentation aligned, preserve naming conventions, avoid committing secrets, and follow a release workflow. They also explain the project's intent and how people expect to work together. An agent can read and agree with all of this, then miss a consequence in the files it changes.

The longer the task, the more likely that becomes. Context shifts, recall is partial, tools impose constraints, and local decisions accumulate. Executable checks give both agents and human contributors feedback when an important rule has been missed, without relying on someone remembering every instruction.

Several communities use names such as **policy as code**, **contract testing**, **compliance testing**, or **executable specification** for this approach. The practical starting point is a rule whose effect can be observed in the repository.

## From instruction to invariant

An instruction describes how contributors should behave. An invariant describes what must remain true in their work. Some translations are straightforward:

- "Do not commit real API keys" becomes a scan for key-like values and a check that required placeholders remain in place.
- "Keep documentation aligned with routes" becomes a comparison of README entries, route metadata, and generated navigation.
- "New JavaScript files need a purpose comment" becomes a check of leading comments in non-vendor source files.
- "Agent contract files must stay synchronized" becomes a byte comparison.
- "Release through the expected branch flow" becomes a check that the release script documents and performs the required gates.

These tests check the resulting repository state. They cannot establish whether an agent understood the instruction or inspect its private reasoning. They can catch a route added in one place but omitted elsewhere, or a placeholder replaced with a real key, before release. Generated documentation conventions become checks that the next contributor can run, instead of knowledge they have to pick up from someone else.

## Where tests help, and where they overreach

Look for effects in files, commands, metadata, links, generated artifacts, or runtime behavior. Alongside the examples above, useful candidates include reproducible generated output, dependency sourcing, required source metadata, accessibility and security guardrails, and naming conventions that other tools depend on. A failure should identify a concrete repair.

Judgment is harder to encode. Instructions to write elegant code, avoid unnecessary abstractions, keep the user experience coherent, or understand the domain before changing behavior still matter. Reducing them to mechanical rules can produce brittle tests that reward a shallow imitation of good work. "Prefer existing patterns" depends on whether those patterns suit the change. "Plan before acting" is visible in a conversation, but cannot be established from the resulting repository alone.

Keep those principles in prose. The instruction file can explain how to approach the work, and the README can describe the public workflow. Tests can enforce the observable requirements, such as keeping contract files identical or generating an index through documented conventions. They should not claim to decide every case.

## Writing a useful check

Write the instruction first, then identify the repository state that would demonstrate compliance. If that state is stable and important, give it a focused test. The failure message should explain the requirement and enough of the mismatch that a contributor can fix it without reverse-engineering the project.

This makes working agreements less dependent on any one contributor's memory. Future humans and agents get the same feedback, including under time pressure. They still have to read, reason, and decide what good work requires, but the repository can catch more of the avoidable drift.
