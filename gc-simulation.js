'use strict';

/**
 * gc-simulation.js
 *
 * JavaScript port of the Garbage Can Model simulation.
 * Original: Cohen, March & Olsen (1972). "A Garbage Can Model of Organizational Choice."
 * Python reference: github.com/Mac13kW/Garbage_Can_Model (Workiewicz, 2014)
 *
 * Exposes one function:
 *   runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure })
 *
 * Returns:
 *   { resolution, oversight, flight, ticks }
 *
 * No external dependencies. Plain JavaScript only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS    = 20;   // simulation time ticks
const V          = 10;   // number of decision makers
const M          = 10;   // number of choice opportunities
const W          = 20;   // number of problems
const SOL_COEFF  = 0.6;  // energy scaling coefficient
const ITERATIONS = 100;  // Monte Carlo iterations per run

// Net energy load per problem per tick (Light / Moderate / Heavy)
const NET_ENERGY_LOADS = {
  light:    1.1,
  moderate: 2.2,
  heavy:    3.3,
};

// State sentinels
const STATE_INACTIVE = -2;  // not yet entered
const STATE_ACTIVE   = -1;  // entered, open
const STATE_RESOLVED = -3;  // decision made / choice closed
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
  const E1 = new Array(V).fill(0.55 * SOL_COEFF);
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
 * @param {number}     nel - net energy load per problem per tick
 * @param {number[]}   entryM - shuffled array of choice indices (entry order)
 * @param {number[]}   entryW - shuffled array of problem indices (entry order)
 * @returns object with state arrays
 */
function garbageCan(A, D, E, nel, entryM, entryW) {
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

    // ── New entrants (ticks 0–9: one choice, two problems per tick) ───────────
    if (t < 10) {
      Choices[entryM[t]][t + 1]          = STATE_ACTIVE;
      Problems[entryW[2 * t]][t + 1]     = STATE_ACTIVE;
      Problems[entryW[2 * t + 1]][t + 1] = STATE_ACTIVE;
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
          let minIdx = 0;
          for (let k = 1; k < values.length; k++) {
            if (values[k] < values[minIdx]) minIdx = k;
          }
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
        let minIdx = 0;
        for (let k = 1; k < values.length; k++) {
          if (values[k] < values[minIdx]) minIdx = k;
        }
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


// ─── Tick snapshot builder ────────────────────────────────────────────────────

/**
 * Convert raw state arrays into a d3-consumable ticks array.
 * Each tick records the state of every choice and problem.
 *
 * Choice states: 'inactive' | 'active' | 'resolved'
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
        state:           raw === STATE_INACTIVE ? 'inactive' : raw === STATE_RESOLVED ? 'resolved' : 'active',
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

const [A0, A1, A2]   = buildAccessMatrices();
const [D0, D1, D2]   = buildDecisionMatrices();
const [, E1]         = buildEnergyVectors(); // uniform energy distribution (fixed)

const A_MATRIX = [A0, A1, A2];
const D_MATRIX = [D0, D1, D2];
const STRUCTURES = ['unsegmented', 'hierarchical', 'specialized'];

/**
 * Run the Garbage Can Model simulation.
 *
 * @param {object} params
 * @param {string} params.energyLoad        - 'light' | 'moderate' | 'heavy'
 * @param {string} params.decisionStructure - 'unsegmented' | 'hierarchical' | 'specialized'
 * @param {string} params.accessStructure   - 'unsegmented' | 'hierarchical' | 'specialized'
 *
 * @returns {object}
 *   resolution {number} - proportion of decisions made by resolution
 *   oversight  {number} - proportion made by oversight (incl. quickies)
 *   flight     {number} - proportion made by flight
 *   ticks      {Array}  - tick-by-tick state from the last iteration (for d3)
 */
function runGarbageCanSimulation({ energyLoad, decisionStructure, accessStructure }) {
  const nel = NET_ENERGY_LOADS[energyLoad];
  if (nel === undefined) throw new Error(`Unknown energyLoad: "${energyLoad}". Use 'light', 'moderate', or 'heavy'.`);

  const aIdx = STRUCTURES.indexOf(accessStructure);
  if (aIdx === -1) throw new Error(`Unknown accessStructure: "${accessStructure}". Use 'unsegmented', 'hierarchical', or 'specialized'.`);

  const dIdx = STRUCTURES.indexOf(decisionStructure);
  if (dIdx === -1) throw new Error(`Unknown decisionStructure: "${decisionStructure}". Use 'unsegmented', 'hierarchical', or 'specialized'.`);

  const A = A_MATRIX[aIdx];
  const D = D_MATRIX[dIdx];
  const E = E1; // uniform energy distribution

  let totalResolutions = 0;
  let totalOversights  = 0;
  let totalFlights     = 0;
  let totalQuickies    = 0;
  let lastResult       = null;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const entryM = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const entryW = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

    const result = garbageCan(A, D, E, nel, entryM, entryW);
    const counts = countDecisionTypes(result.Choices, result.Problems, result.ChoicesEnergyRequired);

    totalResolutions += counts.resolutions;
    totalOversights  += counts.oversights;
    totalFlights     += counts.flights;
    totalQuickies    += counts.quickies;

    if (iter === ITERATIONS - 1) lastResult = result;
  }

  const meanResolutions = totalResolutions / ITERATIONS;
  const meanOversights  = totalOversights  / ITERATIONS;
  const meanFlights     = totalFlights     / ITERATIONS;
  const meanQuickies    = totalQuickies    / ITERATIONS;

  // Quickies fold into oversight for proportion calculation.
  // resolution + oversight + flight = 1.0
  const total = meanResolutions + meanOversights + meanFlights + meanQuickies;

  const ticks = buildTickSnapshots(
    lastResult.Choices,
    lastResult.Problems,
    lastResult.ChoicesEnergyRequired,
    lastResult.ChoicesEnergySpent
  );

  return {
    resolution: total > 0 ? meanResolutions / total : 0,
    oversight:  total > 0 ? (meanOversights + meanQuickies) / total : 0,
    flight:     total > 0 ? meanFlights / total : 0,
    ticks,
  };
}


// ─── Validation (runs when executed directly in browser console or Node) ──────

/**
 * Validate qualitative findings of Cohen, March & Olsen (1972).
 *
 * Expected patterns:
 *  1. Heavy load → more flight and oversight than light load
 *  2. Hierarchical structures → different resolution rate than unsegmented
 *  3. resolution + oversight + flight = 1.0 for every combination
 */
function validateSimulation() {
  const loads      = ['light', 'moderate', 'heavy'];
  const structures = ['unsegmented', 'hierarchical', 'specialized'];
  const results    = {};

  console.log('Running validation across 9 parameter combinations...\n');

  for (const load of loads) {
    for (const structure of structures) {
      const key = `${load} / ${structure}`;
      const r   = runGarbageCanSimulation({
        energyLoad:        load,
        decisionStructure: structure,
        accessStructure:   structure,
      });
      results[key] = r;

      const sum = r.resolution + r.oversight + r.flight;
      console.log(
        `${key.padEnd(30)} resolution=${r.resolution.toFixed(3)}  oversight=${r.oversight.toFixed(3)}  flight=${r.flight.toFixed(3)}  sum=${sum.toFixed(3)}`
      );
    }
  }

  console.log('\n── Qualitative checks ──');

  // Check 1: Heavy load → more flight than light load.
  // Applies to unsegmented and hierarchical only — specialized produces no flight
  // by design (problems are locked to a single choice and cannot flee).
  const flightStructures = ['unsegmented', 'hierarchical'];
  let flightIncreasesWithLoad = true;
  for (const structure of flightStructures) {
    const light  = results[`light / ${structure}`].flight;
    const heavy  = results[`heavy / ${structure}`].flight;
    if (heavy < light) {
      console.log(`  FAIL: flight did not increase from light to heavy for "${structure}" (light=${light.toFixed(3)}, heavy=${heavy.toFixed(3)})`);
      flightIncreasesWithLoad = false;
    }
  }
  if (flightIncreasesWithLoad) console.log('  PASS: heavy load produces more flight than light load (unsegmented + hierarchical)');

  // Check 2: Hierarchical resolution differs from unsegmented
  let hierarchicalDiffers = false;
  for (const load of loads) {
    const unseg = results[`${load} / unsegmented`].resolution;
    const hier  = results[`${load} / hierarchical`].resolution;
    if (Math.abs(unseg - hier) > 0.02) {
      hierarchicalDiffers = true;
      break;
    }
  }
  console.log(hierarchicalDiffers
    ? '  PASS: hierarchical structure produces different resolution rate than unsegmented'
    : '  FAIL: no meaningful difference between hierarchical and unsegmented resolution rates'
  );

  // Check 3: Proportions sum to 1.0
  let allSumToOne = true;
  for (const key of Object.keys(results)) {
    const r   = results[key];
    const sum = r.resolution + r.oversight + r.flight;
    if (Math.abs(sum - 1.0) > 0.001) {
      console.log(`  FAIL: proportions do not sum to 1.0 for "${key}" (sum=${sum.toFixed(6)})`);
      allSumToOne = false;
    }
  }
  if (allSumToOne) console.log('  PASS: proportions sum to 1.0 for all combinations');

  console.log('\nValidation complete.');
  return results;
}

// Run validation automatically when loaded outside a browser module context
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  // Node.js environment
  validateSimulation();
  module.exports = { runGarbageCanSimulation, validateSimulation };
}
