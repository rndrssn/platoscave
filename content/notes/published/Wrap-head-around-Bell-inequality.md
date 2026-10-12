---
title: Wrap a head around Bell's inequality
slug: bellsinequality
date: 2026-05-28
status: published
summary:
tags:
  - physics
related_modules: []
---

## Wrap a head around Bell's inequality

I find Bell’s inequality difficult because small differences in the assumptions change what the conclusion means. The game version helps me keep track of what is being tested.

A local hidden-variable account explains measurement outcomes through information carried by the particles, without a measurement choice at one location affecting the outcome at the other. Bell inequalities place limits on the correlations such an account can produce, assuming the measurement choices are independent of the hidden variables.

In the CHSH game, Bob and Claire each receive an independently chosen random bit, 0 or 1, and each return a bit. They cannot communicate after receiving their inputs. They win if their answers match, except when both inputs are 1, when their answers must differ.

They can agree on a strategy beforehand. Always answering 0 wins three of the four equally likely input combinations. No strategy based on shared classical information can do better than 75% on average. With shared entangled particles and suitable measurements, they can reach about 85.4%, or (2 + √2) / 4. [Scott Aaronson’s quantum computing lecture notes](https://www.scottaaronson.com/qclec.pdf) work through the game and its quantum strategy.

Correlations exceeding the classical bound rule out that local hidden-variable account under those assumptions. They do not let Bob send Claire a message through entanglement.

The interpretations of quantum mechanics offer different accounts of what produces these outcomes.

In a Copenhagen-style account, the measurement is not simply reading a spin value fixed in advance. That leaves me with the measurement problem: how should we understand the transition from a quantum description of possible outcomes to the single outcome we observe?

Bohmian mechanics keeps definite particle positions and uses a nonlocal guiding structure, the pilot wave. A particle’s motion can depend on the configuration of the whole system. I find its explicit account of particles attractive, though accepting nonlocality is a substantial commitment.

Everett’s many-worlds interpretation retains the quantum evolution and treats the outcomes as occurring in different branches of the universal wavefunction. I find this less attractive, but Bell’s inequality does not settle that preference for me.

For the experiment described here, these interpretations reproduce the same quantum predictions. The measured correlations constrain an account of reality; they do not select one interpretation.
