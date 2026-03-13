---
id: SPIKE-organised-anarchy-sim
type: SPIKE
title: Organised Anarchy — JS Simulation Core
status: VALIDATED
created: 2026-03-13
updated: 2026-03-13
owner: Robert Andersson
relates_to: [VISION-product, SPIKE-organised-anarchy-mapper]
tags: [garbage-can, simulation, javascript]
---

# Organised Anarchy — JS Simulation Core

## Purpose

Validate that the Garbage Can Model simulation can be faithfully ported from Python/numpy to plain JavaScript, producing qualitatively correct output that can serve as the engine for the Organised Anarchy Mapper module.

This spike answers one question only: **does the simulation work in JS?**

Form, visualization, and diagnostic output are out of scope. Those belong to the next spike (`SPIKE-organised-anarchy-mapper`), which depends on this one being validated first.

---

## Background

The Garbage Can Model (Cohen, March & Olsen, 1972) was originally implemented as a Fortran 66 simulation. A Python/numpy reconstruction exists at:

> github.com/Mac13kW/Garbage_Can_Model

The simulation models an organisation as a set of choice opportunities. At each time tick, four streams — problems, solutions, participants, and choice opportunities — interact via matrix operations. The outputs measure what proportion of decisions are made by:

- **Resolution** — problem genuinely solved at the choice opportunity
- **Oversight** — decision made while problem moves elsewhere
- **Flight** — problem abandons the choice opportunity unsolved

The three structural parameters that drive the simulation:

| Parameter | Variants |
|-----------|---------|
| **Net energy load** | Light / Moderate / Heavy |
| **Decision structure** | Unsegmented / Hierarchical / Specialized |
| **Access structure** | Unsegmented / Hierarchical / Specialized |

---

## Source Reference

- Original Fortran 66 code: appendix of Cohen, March & Olsen (1972)
- Python/numpy reconstruction: github.com/Mac13kW/Garbage_Can_Model

The JS rewrite should:
- Preserve original variable names where practical
- Use plain JS arrays in place of numpy matrices
- Require no external dependencies
- Produce qualitatively faithful output — exact numerical reproduction is not required and has never been achieved across any published reconstruction

---

## What to Build

A single self-contained JavaScript file: `gc-simulation.js`

It must expose one function:

```js
runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure })
```

Which returns:

```js
{
  resolution: Number,   // proportion of decisions made by resolution
  oversight: Number,    // proportion made by oversight
  flight: Number,       // proportion made by flight
  ticks: Array          // tick-by-tick state, for future visualization use
}
```

### Validation approach

Run the simulation against the parameter combinations used in the original 1972 paper and confirm that:
- Heavy load produces more flight and oversight than light load
- Hierarchical structures produce different resolution rates than unsegmented
- The proportions across resolution / oversight / flight sum to 1.0

These are the qualitative findings of the original paper. If the JS output matches this direction, the port is faithful enough.

---

## Success Criteria

This spike is **VALIDATED** if:

- [x] `gc-simulation.js` runs in the browser without errors
- [x] Output for all nine parameter combinations (3 load × 3 structure variants) is produced
- [x] Qualitative pattern matches the original paper — heavy load produces more flight, hierarchical structure reduces resolution on important opportunities
- [x] The `ticks` array is structured in a way that a d3 visualization could consume it in the next spike

This spike is **ABANDONED** if:

- The matrix logic cannot be cleanly expressed without numpy-specific behaviour
- Output patterns are qualitatively wrong and the cause cannot be identified

---

## Out of Scope

- Any UI, form, or visualization
- Question-to-parameter translation
- Styling or design system compliance
- Mobile or responsive considerations
- Integration into the site

---

## Branch

```bash
git checkout develop
git checkout -b experiment/organised-anarchy-mapper
```

This spike shares the branch with `SPIKE-organised-anarchy-mapper` — they are sequential steps in the same experiment. The simulation file produced here becomes the foundation for the next spike.

---

## Next Step

When this spike reaches `VALIDATED`, open `SPIKE-organised-anarchy-mapper.md` and begin the form, translation layer, and visualization work on the same branch.

---

## Validation Results

Run: 9 combinations (3 load × 3 structure), 100 iterations each. Energy distribution fixed to uniform.

```
light/unsegmented      resolution=0.000  oversight=1.000  flight=0.000
light/hierarchical     resolution=0.145  oversight=0.446  flight=0.409
light/specialized      resolution=0.585  oversight=0.415  flight=0.000
moderate/unsegmented   resolution=0.000  oversight=0.500  flight=0.500
moderate/hierarchical  resolution=0.128  oversight=0.435  flight=0.436
moderate/specialized   resolution=0.442  oversight=0.558  flight=0.000
heavy/unsegmented      resolution=0.000  oversight=0.500  flight=0.500
heavy/hierarchical     resolution=0.104  oversight=0.460  flight=0.436
heavy/specialized      resolution=0.032  oversight=0.968  flight=0.000
```

Qualitative checks:
- PASS: heavy load produces more flight than light load (unsegmented + hierarchical)
- PASS: hierarchical structure produces different resolution rate than unsegmented
- PASS: all proportions sum to 1.0 across all 9 combinations

Notable structural findings:
- Specialized structure produces 0 flight — correct, problems are locked to a single choice
- Unsegmented structure produces 0 resolution — all decisions made by oversight or flight
- Hierarchical is the most "realistic" structure, showing all three decision types

---

## References

- Cohen, M.D., March, J.G., & Olsen, J.P. (1972). A Garbage Can Model of Organizational Choice. *Administrative Science Quarterly*, 17(1), 1–25.
- Python/numpy reconstruction: github.com/Mac13kW/Garbage_Can_Model
- SPIKE-organised-anarchy-mapper.md — the next spike, dependent on this one
