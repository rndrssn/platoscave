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

An agent can read the project instructions and still miss a requirement in the files it changes. Put requirements with stable, observable consequences in tests.

A repository can check that required API-key placeholders remain in place, route documentation matches navigation, and release scripts preserve the expected gates. These checks belong to familiar practices such as policy as code, contract testing, and executable specification.

A passing test establishes only what it checks. It cannot tell you whether the agent understood the instruction or chose a sensible design. "Prefer existing patterns" still requires someone to judge whether those patterns suit the change.

Keep that judgment in prose. Give durable repository requirements a test with a failure message that explains what needs fixing. A route omitted from the documentation then produces a failure before release, even if nobody remembers to check it manually.

The longer version is in [Making Instructions Executable](../../articles/making-instructions-executable/).
