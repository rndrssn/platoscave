'use strict';

(function(factory) {
  var core = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  }
  if (typeof window !== 'undefined') {
    window.GcSimulationCore = core;
  }
})(function createGcSimulationCore() {

/**
 * gc-simulation.js
 *
 * JavaScript port of the Garbage Can Model simulation.
 * Original: Cohen, March & Olsen (1972). "A Garbage Can Model of Organizational Choice."
 * Python reference: github.com/Mac13kW/Garbage_Can_Model (Workiewicz, 2014)
 *
 * Exposes one function:
 *   runGarbageCanSimulation({
 *     problemIntensity,   // preferred
 *     problemInflow,      // preferred
 *     energyLoad,         // legacy alias for both dimensions
 *     decisionStructure,
 *     accessStructure
 *   })
 *
 * Returns:
 *   { resolution, oversight, flight, ticks }
 *
 * No external dependencies. Plain JavaScript only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
function resolveCoreConfig() {
  if (typeof window !== 'undefined' && window.GcSimulationConfig) {
    return window.GcSimulationConfig;
  }

  if (typeof require === 'function') {
    if (typeof __dirname !== 'undefined') {
      try {
        return require(__dirname + '/gc-simulation-config.js');
      } catch (_err) {
        // Continue to fallbacks for VM-eval test contexts.
      }
    }

    try {
      return require('./gc-simulation-config.js');
    } catch (_err2) {
      // Continue.
    }

    try {
      var path = require('path');
      var proc = (typeof process !== 'undefined' && process && typeof process.cwd === 'function')
        ? process
        : require('process');
      try {
        return require(path.join(proc.cwd(), 'modules', 'garbage-can', 'runtime', 'gc-simulation-config.js'));
      } catch (_err4) {
        return require(path.join(proc.cwd(), 'gc-simulation-config.js'));
      }
    } catch (_err3) {
      // Continue.
    }
  }

  return null;
}

const CORE_CONFIG = resolveCoreConfig();

if (!CORE_CONFIG) {
  throw new Error('GcSimulationConfig not available. Load gc-simulation-config.js before gc-simulation-core.js.');
}

const PERIODS = CORE_CONFIG.PERIODS;
const V = CORE_CONFIG.V;
const M = CORE_CONFIG.M;
const W = CORE_CONFIG.W;
const SOL_COEFF = CORE_CONFIG.SOL_COEFF;
const ITERATIONS = CORE_CONFIG.ITERATIONS;
const NET_ENERGY_LOADS = CORE_CONFIG.NET_ENERGY_LOADS;
const PROBLEM_INFLOW_SCHEDULES = CORE_CONFIG.PROBLEM_INFLOW_SCHEDULES;

// State sentinels
const STATE_INACTIVE = CORE_CONFIG.STATE_INACTIVE;  // not yet entered
const STATE_ACTIVE   = CORE_CONFIG.STATE_ACTIVE;    // entered, open
const STATE_RESOLVED = CORE_CONFIG.STATE_RESOLVED;  // decision made / choice closed
// Problems: >= 90 means resolved (value = original_choice_index + 100)


// ─── Matrix builders ──────────────────────────────────────────────────────────

/**
 * Access matrices A[w×m] — which problems can access which choice opportunities.
 *   A[0] Unsegmented:  all problems access all choices
 *   A[1] Hierarchical: lower-indexed problems access more choices
 *   A[2] Specialized:  each problem accesses exactly one choice
 */
function buildAccessMatrices() {
  const A0 = Array.from({ length: W }, () => new Array(M).fill(1));
  const A1 = Array.from({ length: W }, () => new Array(M).fill(0));
  const A2 = Array.from({ length: W }, () => new Array(M).fill(0));

  let col = -1;
  for (let row = 0; row < W; row++) {
    if (row % 2 === 0) col++;          // same column for pairs: 0,0,1,1,...,9,9
    for (let c = col; c < M; c++) A1[row][c] = 1;
    A2[row][col] = 1;
  }

  return [A0, A1, A2];
}

/**
 * Decision matrices D[v×m] — which decision makers can attend which choices.
 *   D[0] Unsegmented:  all DMs attend all choices
 *   D[1] Hierarchical: DM i attends choices i..9
 *   D[2] Specialized:  DM i attends only choice i
 */
function buildDecisionMatrices() {
  const D0 = Array.from({ length: V }, () => new Array(M).fill(1));
  const D1 = Array.from({ length: V }, () => new Array(M).fill(0));
  const D2 = Array.from({ length: V }, () => new Array(M).fill(0));

  for (let i = 0; i < V; i++) {
    for (let c = i; c < M; c++) D1[i][c] = 1;
    D2[i][i] = 1;
  }

  return [D0, D1, D2];
}

/**
 * Energy vectors E[v] — energy each DM contributes per tick.
 *   E[0] Rising:    DM 0 contributes least (0.06), DM 9 most (0.60)
 *   E[1] Uniform:   all DMs contribute equally (0.33)
 *   E[2] Declining: DM 0 contributes most (0.60), DM 9 least (0.06)
 *
 * Note: the JS API fixes this to E[1] (uniform). The energy distribution
 * is not exposed as a parameter — this matches the spike spec.
 */
function buildEnergyVectors() {
  const E0 = Array.from({ length: V }, (_, i) => parseFloat(((i + 1) * 0.1 * SOL_COEFF).toFixed(10)));
  const E1 = new Array(V).fill(0.65 * SOL_COEFF);
  const E2 = Array.from({ length: V }, (_, i) => parseFloat(((1 - i * 0.1) * SOL_COEFF).toFixed(10)));
  return [E0, E1, E2];
}


// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomMinIndex(values) {
  let min = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
  }

  const eps = 1e-12;
  const minIndices = [];
  for (let i = 0; i < values.length; i++) {
    if (Math.abs(values[i] - min) <= eps) minIndices.push(i);
  }

  return minIndices[Math.floor(Math.random() * minIndices.length)];
}


// ─── Core simulation ──────────────────────────────────────────────────────────

/**
 * Run one iteration of the Garbage Can Model.
 *
 * Faithfully ported from The_Garbage_Can_Model_v40.py (Workiewicz, 2014).
 * Variable names preserved from the original where practical.
 *
 * @param {number[][]} A  - access matrix [W×M]
 * @param {number[][]} D  - decision matrix [V×M]
 * @param {number[]}   E  - energy vector [V]
 * @param {number}     nel - problem intensity (net energy load per attached problem per tick)
 * @param {number[]}   inflowSchedule - problems entering per tick (length PERIODS, sum W)
 * @param {number[]}   entryM - shuffled array of choice indices (entry order)
 * @param {number[]}   entryW - shuffled array of problem indices (entry order)
 * @returns object with state arrays
 */
function garbageCan(A, D, E, nel, inflowSchedule, entryM, entryW) {
  // State arrays indexed [entity][tick], filled with sentinel values
  const Problems              = Array.from({ length: W }, () => new Array(PERIODS + 1).fill(STATE_INACTIVE));
  const Choices               = Array.from({ length: M }, () => new Array(PERIODS + 1).fill(STATE_INACTIVE));
  const Members               = Array.from({ length: V }, () => new Array(PERIODS + 1).fill(STATE_ACTIVE));
  const ChoicesEnergyRequired = Array.from({ length: M }, () => new Array(PERIODS + 1).fill(0));
  const ChoicesEnergySpent    = Array.from({ length: M }, () => new Array(PERIODS + 1).fill(0));

  for (let t = 0; t < PERIODS; t++) {

    // ── Carry forward previous state ──────────────────────────────────────────
    for (let i = 0; i < M; i++) Choices[i][t + 1]  = Choices[i][t];
    for (let i = 0; i < W; i++) Problems[i][t + 1] = Problems[i][t];
    for (let i = 0; i < V; i++) Members[i][t + 1]  = Members[i][t];

    // ── New entrants: one choice per tick in first 10 ticks + configurable
    // problem inflow schedule across all ticks ──────────────────────────────────
    if (t < 10) {
      Choices[entryM[t]][t + 1] = STATE_ACTIVE;
    }

    let enteredSoFar = 0;
    for (let k = 0; k < t; k++) enteredSoFar += inflowSchedule[k];
    const entrantsThisTick = inflowSchedule[t];
    for (let k = 0; k < entrantsThisTick; k++) {
      const idx = enteredSoFar + k;
      if (idx < W) Problems[entryW[idx]][t + 1] = STATE_ACTIVE;
    }

    // ── Problems attach to choice with minimum energy deficit ─────────────────
    const energyRequiredCalc = new Array(M).fill(0);

    for (let b1 = 0; b1 < W; b1++) {
      if (Problems[b1][t + 1] > STATE_INACTIVE && Problems[b1][t + 1] < 90) {
        const indexes = [];
        const values  = [];

        for (let b2 = 0; b2 < M; b2++) {
          if (A[b1][b2] === 1 && Choices[b2][t + 1] > STATE_INACTIVE) {
            indexes.push(b2);
            values.push(ChoicesEnergyRequired[b2][t] - ChoicesEnergySpent[b2][t]);
          }
        }

        if (values.length > 0) {
          const minIdx = pickRandomMinIndex(values);
          const best = indexes[minIdx];
          Problems[b1][t + 1]    = best;
          energyRequiredCalc[best] += nel;
        } else {
          Problems[b1][t + 1] = STATE_ACTIVE; // no accessible choice — floats
        }
      }
    }

    for (let i = 0; i < M; i++) ChoicesEnergyRequired[i][t + 1] = energyRequiredCalc[i];

    // ── Decision makers allocate energy to choice with minimum deficit ────────
    // energySpentCalc starts as a copy of cumulative spent-so-far
    const energySpentCalc = ChoicesEnergySpent.map(row => row[t]);

    for (let c1 = 0; c1 < V; c1++) {
      const indexes = [];
      const values  = [];

      for (let c2 = 0; c2 < M; c2++) {
        if (D[c1][c2] === 1 && Choices[c2][t + 1] > STATE_INACTIVE) {
          indexes.push(c2);
          values.push(ChoicesEnergyRequired[c2][t] - ChoicesEnergySpent[c2][t]);
        }
      }

      if (values.length > 0) {
        const minIdx = pickRandomMinIndex(values);
        const best = indexes[minIdx];
        Members[c1][t + 1]      = best;
        energySpentCalc[best]  += E[c1];
      } else {
        Members[c1][t + 1] = STATE_ACTIVE; // no accessible choice
      }
    }

    for (let i = 0; i < M; i++) ChoicesEnergySpent[i][t + 1] = energySpentCalc[i];

    // ── Resolve choices where cumulative energy meets or exceeds requirement ──
    for (let d1 = 0; d1 < M; d1++) {
      const net = energyRequiredCalc[d1] - energySpentCalc[d1];
      if (net <= 0 && Choices[d1][t + 1] !== STATE_INACTIVE) {
        Choices[d1][t + 1] = STATE_RESOLVED;
        // Mark attached problems as resolved at this choice
        for (let d2 = 0; d2 < W; d2++) {
          if (Problems[d2][t + 1] === d1) {
            Problems[d2][t + 1] += 100; // encodes resolved-at-choice-d1
          }
        }
      }
    }
  }

  return { Choices, Problems, Members, ChoicesEnergyRequired, ChoicesEnergySpent };
}


// ─── Count decision types ─────────────────────────────────────────────────────

/**
 * Classify resolved choices into the three GCM decision types.
 *
 * Resolution: choice was active for ≥ 2 ticks before resolving
 *   (pattern: active → active → resolved, indicating deliberate problem-solving)
 *
 * Oversight: choice resolved at end with no problem marked as resolved there
 *   (decision made while problems were elsewhere)
 *
 * Flight: choice resolved but energy_required dropped at moment of resolution
 *   (problems fled the choice opportunity before it closed)
 *
 * Quickies: choice resolved in the same tick it entered
 *   (folded into oversight for proportion calculation)
 *
 * All four categories come from the Python reference implementation.
 */
function countDecisionTypes(Choices, Problems, ChoicesEnergyRequired) {
  let resolutions = 0;
  let oversights  = 0;
  let flights     = 0;
  let quickies    = 0;

  // Resolutions: [-1, -1, -3] pattern
  for (let e1 = 0; e1 < M; e1++) {
    for (let e2 = 2; e2 <= PERIODS; e2++) {
      if (
        Choices[e1][e2]     === STATE_RESOLVED &&
        Choices[e1][e2 - 1] === STATE_ACTIVE   &&
        Choices[e1][e2 - 2] === STATE_ACTIVE
      ) {
        resolutions++;
      }
    }
  }

  // Oversights: choice resolved at end, no problem marked resolved there
  // probChoice[i] = the choice index at which problem i was resolved (or negative)
  const probChoice = Problems.map(row => row[PERIODS] - 100);
  for (let e4 = 0; e4 < M; e4++) {
    if (Choices[e4][PERIODS] === STATE_RESOLVED && !probChoice.includes(e4)) {
      oversights++;
    }
  }

  // Flights: choice resolves and energy_required dropped (problems fled)
  for (let e11 = 0; e11 < M; e11++) {
    for (let e12 = 1; e12 <= PERIODS; e12++) {
      if (
        Choices[e11][e12]     === STATE_RESOLVED &&
        Choices[e11][e12 - 1] === STATE_ACTIVE
      ) {
        if (ChoicesEnergyRequired[e11][e12] < ChoicesEnergyRequired[e11][e12 - 1]) {
          flights++;
        }
      }
    }
  }

  // Quickies: resolved in same tick as entry ([-2, -3] pattern)
  for (let e13 = 0; e13 < M; e13++) {
    for (let e14 = 1; e14 <= PERIODS; e14++) {
      if (
        Choices[e13][e14]     === STATE_RESOLVED &&
        Choices[e13][e14 - 1] === STATE_INACTIVE
      ) {
        quickies++;
      }
    }
  }

  return { resolutions, oversights, flights, quickies };
}


// ─── Count problem outcomes ───────────────────────────────────────────────────

/**
 * Classify the final fate of each problem from one iteration.
 * NOTE: This is an interpretive extension — the original GCM (1972)
 * tracks decision styles at the choice level, not problem fates.
 * This function serves the visualization summary.
 *
 * @param {number[][]} Problems - Problems state array [W][PERIODS+1]
 * @param {number[][]} Choices  - Choices state array [M][PERIODS+1]
 * @returns {{ resolved: number, displaced: number, adrift: number, inForum: number, neverEntered: number }}
 */
function countProblemOutcomes(Problems, Choices) {
  let resolved     = 0;
  let displaced    = 0;
  let adrift       = 0;
  let inForum      = 0;
  let neverEntered = 0;

  for (let i = 0; i < W; i++) {
    const endState = Problems[i][PERIODS];

    if (endState >= 90) {
      resolved++;
    } else if (endState === STATE_INACTIVE) {
      neverEntered++;
    } else if (endState >= 0 && endState < M) {
      inForum++;
    } else if (endState === STATE_ACTIVE) {
      // Floating at end — scan backwards for the last attached→floating transition
      let wasDisplaced = false;
      for (let t = PERIODS; t >= 1; t--) {
        const prev = Problems[i][t - 1];
        const curr = Problems[i][t];
        if (prev >= 0 && prev < M && curr === STATE_ACTIVE) {
          if (Choices[prev][t] === STATE_RESOLVED) {
            wasDisplaced = true;
          }
          break;
        }
      }
      if (wasDisplaced) {
        displaced++;
      } else {
        adrift++;
      }
    }
  }

  return { resolved, displaced, adrift, inForum, neverEntered };
}

function countResolvedByChoice(Problems) {
  const resolvedByChoice = new Array(M).fill(0);
  for (let i = 0; i < W; i++) {
    const endState = Problems[i][PERIODS];
    if (endState >= 90) {
      const choiceId = endState - 100;
      if (choiceId >= 0 && choiceId < M) resolvedByChoice[choiceId]++;
    }
  }
  return resolvedByChoice;
}


// ─── Tick snapshot builder ────────────────────────────────────────────────────

/**
 * Convert raw state arrays into a d3-consumable ticks array.
 * Each tick records the state of every choice and problem.
 *
 * Choice states: 'inactive' | 'active' | 'closed'
 * Problem states: 'inactive' | 'floating' | 'attached' | 'resolved'
 */
function buildTickSnapshots(Choices, Problems, ChoicesEnergyRequired, ChoicesEnergySpent) {
  const ticks = [];

  for (let t = 0; t <= PERIODS; t++) {
    const choices = [];
    for (let i = 0; i < M; i++) {
      const raw = Choices[i][t];
      choices.push({
        id:              i,
        state:           raw === STATE_INACTIVE ? 'inactive' : raw === STATE_RESOLVED ? 'closed' : 'active',
        energyRequired:  ChoicesEnergyRequired[i][t],
        energySpent:     ChoicesEnergySpent[i][t],
      });
    }

    const problems = [];
    for (let i = 0; i < W; i++) {
      const raw = Problems[i][t];
      let state, attachedTo;
      if (raw === STATE_INACTIVE) {
        state = 'inactive'; attachedTo = null;
      } else if (raw === STATE_ACTIVE) {
        state = 'floating'; attachedTo = null;
      } else if (raw >= 90) {
        state = 'resolved'; attachedTo = raw - 100;
      } else {
        state = 'attached'; attachedTo = raw; // raw = choice index
      }
      problems.push({ id: i, state, attachedTo });
    }

    ticks.push({ tick: t, choices, problems });
  }

  return ticks;
}


// ─── Public API ───────────────────────────────────────────────────────────────

const A_MATRIX       = buildAccessMatrices();
const D_MATRIX       = buildDecisionMatrices();
const [, E1]         = buildEnergyVectors(); // uniform energy distribution (fixed)
const STRUCTURES = ['unsegmented', 'hierarchical', 'specialized'];

/**
 * Run the Garbage Can Model simulation.
 *
 * @param {object} params
 * @param {string} [params.problemIntensity] - 'light' | 'moderate' | 'heavy'
 * @param {string} [params.problemInflow]    - 'light' | 'moderate' | 'heavy'
 * @param {string} [params.energyLoad]       - legacy alias for both intensity and inflow
 * @param {string} params.decisionStructure - 'unsegmented' | 'hierarchical' | 'specialized'
 * @param {string} params.accessStructure   - 'unsegmented' | 'hierarchical' | 'specialized'
 *
 * @returns {object}
 *   resolution {number} - proportion of decisions made by resolution
 *   oversight  {number} - proportion made by oversight (incl. quickies)
 *   flight     {number} - proportion made by flight
 *   ticks      {Array}  - tick-by-tick state from the last iteration (for d3)
 */
function buildSimulationContext({
  problemIntensity,
  problemInflow,
  energyLoad,
  decisionStructure,
  accessStructure
}) {
  const intensityKey = problemIntensity || energyLoad;
  const inflowKey    = problemInflow || problemIntensity || energyLoad;

  if (intensityKey === undefined) {
    throw new Error('Missing problemIntensity (or legacy energyLoad). Use "light", "moderate", or "heavy".');
  }
  if (inflowKey === undefined) {
    throw new Error('Missing problemInflow (or problemIntensity/energyLoad fallback). Use "light", "moderate", or "heavy".');
  }

  const nel = NET_ENERGY_LOADS[intensityKey];
  if (nel === undefined) throw new Error(`Unknown problemIntensity: "${intensityKey}". Use 'light', 'moderate', or 'heavy'.`);

  const inflowSchedule = PROBLEM_INFLOW_SCHEDULES[inflowKey];
  if (inflowSchedule === undefined) throw new Error(`Unknown problemInflow: "${inflowKey}". Use 'light', 'moderate', or 'heavy'.`);

  const aIdx = STRUCTURES.indexOf(accessStructure);
  if (aIdx === -1) throw new Error(`Unknown accessStructure: "${accessStructure}". Use 'unsegmented', 'hierarchical', or 'specialized'.`);

  const dIdx = STRUCTURES.indexOf(decisionStructure);
  if (dIdx === -1) throw new Error(`Unknown decisionStructure: "${decisionStructure}". Use 'unsegmented', 'hierarchical', or 'specialized'.`);

  const A = A_MATRIX[aIdx];
  const D = D_MATRIX[dIdx];
  const E = E1; // uniform energy distribution

  return { A, D, E, nel, inflowSchedule };
}

function finalizeSimulationResult(agg, lastResult) {
  const meanResolutions = agg.totalResolutions / agg.iterations;
  const meanOversights  = agg.totalOversights  / agg.iterations;
  const meanFlights     = agg.totalFlights     / agg.iterations;
  const meanQuickies    = agg.totalQuickies    / agg.iterations;

  // Quickies fold into oversight for choice-level proportion calculation.
  // resolution + oversight + flight ≈ 1.0
  // NOTE: these categories are overlapping descriptors (faithful to the original
  // 1972 paper), not exclusive bins. The sum equals 1.0 because total is their sum.
  const total = meanResolutions + meanOversights + meanFlights + meanQuickies;

  // Problem-level means (out of W) — interpretive extension, not canonical GCM
  const meanProbResolved     = agg.totalProbResolved     / agg.iterations;
  const meanProbDisplaced    = agg.totalProbDisplaced    / agg.iterations;
  const meanProbAdrift       = agg.totalProbAdrift       / agg.iterations;
  const meanProbInForum      = agg.totalProbInForum      / agg.iterations;
  const meanProbNeverEntered = agg.totalProbNeverEntered / agg.iterations;
  const meanResolvedByChoice = agg.totalResolvedByChoice.map(function(sum) {
    return sum / agg.iterations;
  });

  const ticks = buildTickSnapshots(
    lastResult.Choices,
    lastResult.Problems,
    lastResult.ChoicesEnergyRequired,
    lastResult.ChoicesEnergySpent
  );

  return {
    // Choice-level proportions (canonical GCM — used by diagnosis text)
    resolution: total > 0 ? meanResolutions / total : 0,
    oversight:  total > 0 ? (meanOversights + meanQuickies) / total : 0,
    flight:     total > 0 ? meanFlights / total : 0,

    // Choice-level mean counts (out of M=10, canonical GCM)
    choiceResolution: meanResolutions,
    choiceOversight:  meanOversights + meanQuickies,
    choiceFlight:     meanFlights,
    choiceResolvedPerCoMean: meanResolvedByChoice,

    // Problem-level mean counts (out of W=20, interpretive extension)
    problemResolved:     meanProbResolved,
    problemDisplaced:    meanProbDisplaced,
    problemAdrift:       meanProbAdrift,
    problemInForum:      meanProbInForum,
    problemNeverEntered: meanProbNeverEntered,

    // Metadata for renderers (avoid coupling on module internals)
    meta: {
      choices: M,
      problems: W,
      periods: PERIODS,
      textScale: 'default',
    },

    ticks,
  };
}

function getGarbageCanDefaults() {
  return {
    choices: M,
    problems: W,
    periods: PERIODS,
  };
}

function createSimulationAccumulator(iterations) {
  return {
    iterations: iterations,
    totalResolutions: 0,
    totalOversights: 0,
    totalFlights: 0,
    totalQuickies: 0,
    totalProbResolved: 0,
    totalProbDisplaced: 0,
    totalProbAdrift: 0,
    totalProbInForum: 0,
    totalProbNeverEntered: 0,
    totalResolvedByChoice: new Array(M).fill(0)
  };
}

function runOneSimulationIteration(ctx, agg) {
  const entryM = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const entryW = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

  const result = garbageCan(ctx.A, ctx.D, ctx.E, ctx.nel, ctx.inflowSchedule, entryM, entryW);
  const counts = countDecisionTypes(result.Choices, result.Problems, result.ChoicesEnergyRequired);

  agg.totalResolutions += counts.resolutions;
  agg.totalOversights  += counts.oversights;
  agg.totalFlights     += counts.flights;
  agg.totalQuickies    += counts.quickies;

  const probCounts = countProblemOutcomes(result.Problems, result.Choices);
  agg.totalProbResolved     += probCounts.resolved;
  agg.totalProbDisplaced    += probCounts.displaced;
  agg.totalProbAdrift       += probCounts.adrift;
  agg.totalProbInForum      += probCounts.inForum;
  agg.totalProbNeverEntered += probCounts.neverEntered;
  const resolvedByChoice = countResolvedByChoice(result.Problems);
  for (let i = 0; i < M; i++) {
    agg.totalResolvedByChoice[i] += resolvedByChoice[i];
  }

  return result;
}


  return {
    PERIODS,
    V,
    M,
    W,
    SOL_COEFF,
    ITERATIONS,
    NET_ENERGY_LOADS,
    PROBLEM_INFLOW_SCHEDULES,
    STATE_INACTIVE,
    STATE_ACTIVE,
    STATE_RESOLVED,
    buildAccessMatrices,
    buildDecisionMatrices,
    buildEnergyVectors,
    shuffle,
    pickRandomMinIndex,
    garbageCan,
    countDecisionTypes,
    countProblemOutcomes,
    countResolvedByChoice,
    buildTickSnapshots,
    buildSimulationContext,
    finalizeSimulationResult,
    getGarbageCanDefaults,
    createSimulationAccumulator,
    runOneSimulationIteration,
  };
});
