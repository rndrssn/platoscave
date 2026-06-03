---
title: Put invariants in tests
slug: put-invariants-in-tests
date: 2026-06-03
status: published
summary: Agent instructions are strongest when their observable consequences become automated checks. Keep judgment in prose, but put durable project invariants in tests.
tags:
  - ai-agents
  - testing
  - governance
related_modules: []
---

## Abstract

AI agent instructions should not only describe how an agent ought to work. Where possible, they should identify which outcomes can be validated automatically.

The pattern is simple: keep judgment in prose, but put durable invariants in tests.

This is a form of policy as code, contract testing, or executable specification. A repository can test that secrets remain placeholders, generated maps still follow source conventions, documentation stays aligned with route data, and workflow scripts preserve the expected release gates. These tests do not prove that an agent reasoned correctly. They prove that the resulting repository state still satisfies the contract.

That distinction is useful. Many instructions remain irreducibly judgment-based: be careful, follow the local design system, prefer existing patterns, avoid unnecessary abstractions. But many consequences of good behavior are visible in files, metadata, commands, links, and generated artifacts. Those consequences can be guarded.

The result is a better collaboration surface between humans, agents, and the repository itself. Instructions stop being passive documentation and become feedback loops.

The longer version is in [Making Instructions Executable](../../articles/making-instructions-executable/).
