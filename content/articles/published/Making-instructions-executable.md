---
title: Making Instructions Executable
slug: making-instructions-executable
date: 2026-06-03
status: published
summary: Project instructions become stronger when their observable consequences are encoded as tests. The pattern turns agent guidance into executable contracts without pretending that judgment itself can be fully automated.
tags:
  - ai-agents
  - testing
  - governance
related_modules: []
---

## Core claim

A useful way to work with AI agents is to treat instructions not only as prose, but as contracts that can be tested.

Most project instructions begin as human-readable guidance: follow this workflow, keep these files aligned, never commit secrets, preserve this naming convention, update documentation when behavior changes. That prose matters. It gives the agent intent, context, and a local operating culture. But prose alone depends on memory and interpretation. An agent may read it, summarize it, agree with it, and still miss one of its observable consequences.

A stronger pattern is to turn the most important instructions into executable checks.

This is often called **policy as code**, **contract testing**, **compliance testing**, or **executable specification**. The names differ by community, but the shared idea is simple: if a rule matters, and its outcome can be observed in the repository, write a test for it.

## From instruction to invariant

An instruction says how people and agents should behave. An invariant says what must remain true after they have behaved.

For example:

- "Do not commit real API keys" becomes a test that scans source files for key-like values and verifies that required placeholders remain in place.
- "Keep documentation aligned with routes" becomes a test that compares README entries, route metadata, and generated navigation.
- "New JavaScript files need a purpose comment" becomes a test that checks leading comments in non-vendor source files.
- "Agent contract files must stay synchronized" becomes a test that compares their bytes.
- "Release through the expected branch flow" becomes a test that confirms the release script documents and performs the expected gates.

The test does not prove that the agent understood the instruction. It proves something more practical: the repository state still satisfies the contract.

That distinction matters. We are not trying to inspect the agent's private reasoning. We are constraining the public artifact it leaves behind.

## Why this matters for agentic work

AI agents are good at reading instructions, but they are also operating under shifting context, partial recall, tool constraints, and long chains of local decisions. The longer the task, the easier it is for an instruction to become background noise. Even careful agents drift.

Executable checks change the feedback loop.

Instead of relying only on the agent to remember that a route table, an index page, and a README section must move together, the repository can say so directly. Instead of hoping that no one replaces a placeholder with a real key, the test suite can fail when it happens. Instead of treating generated documentation conventions as tribal knowledge, the conventions can be validated before release.

This makes the repository less dependent on perfect obedience and more dependent on shared constraints.

The benefit is not only technical. It changes the culture of collaboration. Instructions stop being passive documentation and become part of the project's operating system. A future human, a future agent, or the same agent under time pressure gets fast feedback when the work drifts outside the intended boundaries.

## What can be tested

The best candidates are instructions whose effects are visible in files, commands, metadata, links, generated artifacts, or runtime behavior.

Good candidates include:

- Secrets and placeholder conventions.
- Required metadata in source files.
- Navigation and route consistency.
- Generated artifact reproducibility.
- Documentation alignment with code.
- Release script behavior.
- Dependency sourcing rules.
- Accessibility or security guardrails.
- Naming conventions that other tooling depends on.

These rules are valuable because they are concrete. They can fail in a way that tells the next contributor exactly what to fix.

Poor candidates are instructions that require broad human judgment: be careful, write elegant code, avoid unnecessary abstractions, keep the user experience coherent, or understand the domain before changing behavior. Those instructions are still important, but they cannot be fully reduced to a test without becoming brittle or misleading.

The useful division is:

> Put judgment in prose. Put invariants in tests.

## The limits of executable instruction

There is a temptation to overreach and turn every instruction into a rule. That usually makes the system worse.

Some instructions describe intent rather than outcome. "Use good judgment" cannot be tested directly. "Prefer existing patterns" cannot be tested without embedding a shallow imitation of taste into the test suite. "Plan before acting" is a process expectation that may be visible in conversation, but not in the repository artifact itself.

For these rules, prose remains the right tool. It gives agents and humans a shared orientation without pretending that the repository can mechanically decide every case.

Other instructions should be encoded because the outcome is non-negotiable. A secret should not appear in source. Two contract files should not diverge. A generated index should not depend on undocumented conventions. A route should not exist in one place but not another.

The art is to separate principles from invariants.

Principles guide reasoning. Invariants guard the boundary.

## A practical pattern

A simple workflow works well:

1. Write the instruction in prose first.
2. Ask what observable repository state would prove that the instruction was followed.
3. If that state is stable and important, write a focused test for it.
4. Make the failure message explain the contract, not just the mismatch.
5. Keep the test narrow enough that a contributor can fix it without reverse-engineering the whole project.

This creates a layered contract. The agent instruction file explains how to work. The README explains the public workflow. The tests enforce the parts that can be observed.

The result is not a fully automated substitute for judgment. It is a better collaboration surface. Humans and agents can move faster because the repository itself catches more of the avoidable drift.

## The real goal

The goal is not to make agents obedient in some abstract sense. The goal is to make important project expectations durable.

When a rule lives only in prose, every contributor has to remember it. When the rule's observable consequence lives in a test, the repository remembers it too.

That is the quiet power of executable instructions: they turn local working agreements into feedback loops.

The instruction still matters. The agent still has to read, reason, and decide. But the project no longer depends entirely on the agent carrying every constraint in working memory.

It gives the work a floor.
