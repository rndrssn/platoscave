'use strict';

/**
 * gc-simulation.js
 * Public API wrapper around gc-simulation-core.js.
 */

function resolveSimulationCore() {
  if (typeof window !== 'undefined' && window.GcSimulationCore) {
    return window.GcSimulationCore;
  }

  if (typeof require === 'function') {
    if (typeof __dirname !== 'undefined') {
      try {
        return require(__dirname + '/gc-simulation-core.js');
      } catch (_err) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('gc-simulation.js: __dirname-based require failed, trying fallbacks.', _err && _err.message);
        }
      }
    }

    try {
      return require('./gc-simulation-core.js');
    } catch (_err2) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('gc-simulation.js: relative require failed, trying cwd fallback.', _err2 && _err2.message);
      }
    }

    try {
      var path = require('path');
      var proc = (typeof process !== 'undefined' && process && typeof process.cwd === 'function')
        ? process
        : require('process');
      try {
        return require(path.join(proc.cwd(), 'modules', 'garbage-can', 'runtime', 'gc-simulation-core.js'));
      } catch (_err4) {
        return require(path.join(proc.cwd(), 'gc-simulation-core.js'));
      }
    } catch (_err3) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('gc-simulation.js: cwd-based require failed.', _err3 && _err3.message);
      }
    }
  }

  throw new Error('GcSimulationCore not available. Load gc-simulation-core.js before gc-simulation.js.');
}

const CORE = resolveSimulationCore();

const PERIODS = CORE.PERIODS;
const V = CORE.V;
const M = CORE.M;
const W = CORE.W;
const ITERATIONS = CORE.ITERATIONS;

const NET_ENERGY_LOADS = CORE.NET_ENERGY_LOADS;
const PROBLEM_INFLOW_SCHEDULES = CORE.PROBLEM_INFLOW_SCHEDULES;

const buildAccessMatrices = CORE.buildAccessMatrices;
const buildDecisionMatrices = CORE.buildDecisionMatrices;
const buildEnergyVectors = CORE.buildEnergyVectors;
const countDecisionTypes = CORE.countDecisionTypes;
const buildTickSnapshots = CORE.buildTickSnapshots;
const runOneSimulationIteration = CORE.runOneSimulationIteration;
const createSimulationAccumulator = CORE.createSimulationAccumulator;

const [A0, A1, A2] = buildAccessMatrices();
const [D0, D1, D2] = buildDecisionMatrices();
const [, E1] = buildEnergyVectors();

const A_MATRIX = [A0, A1, A2];
const D_MATRIX = [D0, D1, D2];
const STRUCTURES = ['unsegmented', 'hierarchical', 'specialized'];

function buildSimulationContext({
  problemIntensity,
  problemInflow,
  energyLoad,
  decisionStructure,
  accessStructure,
}) {
  const intensityKey = problemIntensity || energyLoad;
  const inflowKey = problemInflow || problemIntensity || energyLoad;

  if (intensityKey === undefined) {
    throw new Error('Missing problemIntensity (or legacy energyLoad). Use "light", "moderate", or "heavy".');
  }
  if (inflowKey === undefined) {
    throw new Error('Missing problemInflow (or problemIntensity/energyLoad fallback). Use "light", "moderate", or "heavy".');
  }

  const nel = NET_ENERGY_LOADS[intensityKey];
  if (nel === undefined) throw new Error('Unknown problemIntensity: "' + intensityKey + '". Use \'light\', \'moderate\', or \'heavy\'.');

  const inflowSchedule = PROBLEM_INFLOW_SCHEDULES[inflowKey];
  if (inflowSchedule === undefined) throw new Error('Unknown problemInflow: "' + inflowKey + '". Use \'light\', \'moderate\', or \'heavy\'.');

  const aIdx = STRUCTURES.indexOf(accessStructure);
  if (aIdx === -1) throw new Error('Unknown accessStructure: "' + accessStructure + '". Use \'unsegmented\', \'hierarchical\', or \'specialized\'.');

  const dIdx = STRUCTURES.indexOf(decisionStructure);
  if (dIdx === -1) throw new Error('Unknown decisionStructure: "' + decisionStructure + '". Use \'unsegmented\', \'hierarchical\', or \'specialized\'.');

  return { A: A_MATRIX[aIdx], D: D_MATRIX[dIdx], E: E1, nel: nel, inflowSchedule: inflowSchedule };
}

function finalizeSimulationResult(agg, lastResult) {
  const meanResolutions = agg.totalResolutions / agg.iterations;
  const meanOversights = agg.totalOversights / agg.iterations;
  const meanFlights = agg.totalFlights / agg.iterations;
  const meanQuickies = agg.totalQuickies / agg.iterations;
  const total = meanResolutions + meanOversights + meanFlights + meanQuickies;

  const meanProbResolved = agg.totalProbResolved / agg.iterations;
  const meanProbDisplaced = agg.totalProbDisplaced / agg.iterations;
  const meanProbAdrift = agg.totalProbAdrift / agg.iterations;
  const meanProbInForum = agg.totalProbInForum / agg.iterations;
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
    resolution: total > 0 ? meanResolutions / total : 0,
    oversight: total > 0 ? (meanOversights + meanQuickies) / total : 0,
    flight: total > 0 ? meanFlights / total : 0,

    choiceResolution: meanResolutions,
    choiceOversight: meanOversights + meanQuickies,
    choiceFlight: meanFlights,
    choiceResolvedPerCoMean: meanResolvedByChoice,

    problemResolved: meanProbResolved,
    problemDisplaced: meanProbDisplaced,
    problemAdrift: meanProbAdrift,
    problemInForum: meanProbInForum,
    problemNeverEntered: meanProbNeverEntered,

    meta: {
      choices: M,
      problems: W,
      periods: PERIODS,
      textScale: 'default',
    },

    ticks: ticks,
  };
}

function getGarbageCanDefaults() {
  return {
    choices: M,
    problems: W,
    periods: PERIODS,
  };
}

function runGarbageCanSimulation({
  problemIntensity,
  problemInflow,
  energyLoad,
  decisionStructure,
  accessStructure,
}) {
  const ctx = buildSimulationContext({
    problemIntensity,
    problemInflow,
    energyLoad,
    decisionStructure,
    accessStructure,
  });

  const agg = createSimulationAccumulator(ITERATIONS);
  let lastResult = null;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    lastResult = runOneSimulationIteration(ctx, agg);
  }

  return finalizeSimulationResult(agg, lastResult);
}

function runGarbageCanSimulationAsync(params, options) {
  var opts = options || {};
  var chunkSize = Math.max(1, opts.chunkSize || 10);
  var ctx = buildSimulationContext(params);
  var agg = createSimulationAccumulator(ITERATIONS);
  var iter = 0;
  var lastResult = null;

  return new Promise(function(resolve) {
    function processChunk() {
      var end = Math.min(iter + chunkSize, ITERATIONS);
      while (iter < end) {
        lastResult = runOneSimulationIteration(ctx, agg);
        iter++;
      }
      if (iter < ITERATIONS) {
        setTimeout(processChunk, 0);
        return;
      }
      resolve(finalizeSimulationResult(agg, lastResult));
    }
    processChunk();
  });
}

function validateSimulation() {
  const loads = ['light', 'moderate', 'heavy'];
  const structures = ['unsegmented', 'hierarchical', 'specialized'];
  const results = {};

  console.log('Running validation across 9 parameter combinations...\n');

  for (const load of loads) {
    for (const structure of structures) {
      const key = load + ' / ' + structure;
      const r = runGarbageCanSimulation({
        energyLoad: load,
        decisionStructure: structure,
        accessStructure: structure,
      });
      results[key] = r;

      const sum = r.resolution + r.oversight + r.flight;
      console.log(
        key.padEnd(30) +
        ' resolution=' + r.resolution.toFixed(3) +
        '  oversight=' + r.oversight.toFixed(3) +
        '  flight=' + r.flight.toFixed(3) +
        '  sum=' + sum.toFixed(3)
      );
    }
  }

  console.log('\n── Qualitative checks ──');

  const flightStructures = ['unsegmented', 'hierarchical'];
  let flightIncreasesWithLoad = true;
  for (const structure of flightStructures) {
    const light = results['light / ' + structure].flight;
    const heavy = results['heavy / ' + structure].flight;
    if (heavy < light) {
      console.log('  FAIL: flight did not increase from light to heavy for "' + structure + '" (light=' + light.toFixed(3) + ', heavy=' + heavy.toFixed(3) + ')');
      flightIncreasesWithLoad = false;
    }
  }
  if (flightIncreasesWithLoad) console.log('  PASS: heavy load produces more flight than light load (unsegmented + hierarchical)');

  let hierarchicalDiffers = false;
  for (const load of loads) {
    const unseg = results[load + ' / unsegmented'].resolution;
    const hier = results[load + ' / hierarchical'].resolution;
    if (Math.abs(unseg - hier) > 0.02) {
      hierarchicalDiffers = true;
      break;
    }
  }
  console.log(hierarchicalDiffers
    ? '  PASS: hierarchical structure produces different resolution rate than unsegmented'
    : '  FAIL: no meaningful difference between hierarchical and unsegmented resolution rates');

  let allSumToOne = true;
  for (const key of Object.keys(results)) {
    const r = results[key];
    const sum = r.resolution + r.oversight + r.flight;
    if (Math.abs(sum - 1.0) > 0.001) {
      console.log('  FAIL: proportions do not sum to 1.0 for "' + key + '" (sum=' + sum.toFixed(6) + ')');
      allSumToOne = false;
    }
  }
  if (allSumToOne) console.log('  PASS: proportions sum to 1.0 for all combinations');

  console.log('\nValidation complete.');
  return results;
}

if (typeof module !== 'undefined') {
  module.exports = {
    runGarbageCanSimulation,
    runGarbageCanSimulationAsync,
    validateSimulation,
    getGarbageCanDefaults,
  };
}

if (
  typeof window === 'undefined' &&
  typeof module !== 'undefined' &&
  typeof require !== 'undefined' &&
  require.main === module
) {
  validateSimulation();
}

if (typeof window !== 'undefined') {
  window.runGarbageCanSimulation = runGarbageCanSimulation;
  window.runGarbageCanSimulationAsync = runGarbageCanSimulationAsync;
  window.validateSimulation = validateSimulation;
  window.getGarbageCanDefaults = getGarbageCanDefaults;
}
