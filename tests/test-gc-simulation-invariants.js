// Tests GC simulation statistical invariants across a parameter sweep.
'use strict';

const assert = require('assert');
const { loadSimulationModule } = require('./helpers/load-simulation');

const { runGarbageCanSimulation, runGarbageCanSimulationAsync } = loadSimulationModule();

const LEVELS = ['light', 'moderate', 'heavy'];
const STRUCTURES = ['unsegmented', 'hierarchical', 'specialized'];
const EPS = 1e-9;

function inRange(n, min, max) {
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
}

function assertThrowsUnknownParam() {
  assert.throws(() => runGarbageCanSimulation({
    problemIntensity: 'extreme',
    problemInflow: 'moderate',
    decisionStructure: 'hierarchical',
    accessStructure: 'hierarchical'
  }), /Unknown problemIntensity/);

  assert.throws(() => runGarbageCanSimulation({
    problemIntensity: 'moderate',
    problemInflow: 'moderate',
    decisionStructure: 'flat',
    accessStructure: 'hierarchical'
  }), /Unknown decisionStructure/);

  assert.throws(() => runGarbageCanSimulation({
    problemIntensity: 'moderate',
    problemInflow: 'moderate',
    decisionStructure: 'hierarchical',
    accessStructure: 'matrixed'
  }), /Unknown accessStructure/);
}

async function assertAllCombosInvariant() {
  let checked = 0;

  for (const intensity of LEVELS) {
    for (const inflow of LEVELS) {
      for (const decision of STRUCTURES) {
        for (const access of STRUCTURES) {
          const result = runGarbageCanSimulation({
            problemIntensity: intensity,
            problemInflow: inflow,
            decisionStructure: decision,
            accessStructure: access,
          });

          assert(inRange(result.resolution, 0, 1), 'resolution out of [0,1]');
          assert(inRange(result.oversight, 0, 1), 'oversight out of [0,1]');
          assert(inRange(result.flight, 0, 1), 'flight out of [0,1]');
          assert(Math.abs((result.resolution + result.oversight + result.flight) - 1) < 1e-6, 'choice shares must sum to 1');

          assert(inRange(result.problemResolved, 0, 20), 'problemResolved out of range');
          assert(inRange(result.problemDisplaced, 0, 20), 'problemDisplaced out of range');
          assert(inRange(result.problemAdrift, 0, 20), 'problemAdrift out of range');
          assert(inRange(result.problemInForum, 0, 20), 'problemInForum out of range');
          assert(inRange(result.problemNeverEntered, 0, 20), 'problemNeverEntered out of range');

          const problemTotal = result.problemResolved + result.problemDisplaced + result.problemAdrift + result.problemInForum + result.problemNeverEntered;
          assert(Math.abs(problemTotal - 20) < 1e-6, 'problem outcomes must sum to 20');

          assert(Array.isArray(result.ticks), 'ticks missing');
          assert.strictEqual(result.ticks.length, 21, 'expected 21 ticks (0..20)');
          const lastTick = result.ticks[result.ticks.length - 1];
          assert.strictEqual(lastTick.choices.length, 10, 'expected 10 choices in last tick');
          assert.strictEqual(lastTick.problems.length, 20, 'expected 20 problems in last tick');
          assert.strictEqual(result.stageTicks.length, 80, 'expected four stages per iteration');
          assert(Math.abs(result.choiceClosedWithProblems + result.choiceClosedWithoutProblems + result.choiceStillOpen - 10) < EPS, 'exclusive choice outcomes must total ten');
          for (let t = 1; t <= 20; t++) {
            const stages = result.stageTicks.slice((t - 1) * 4, t * 4);
            assert.deepStrictEqual(Array.from(stages, s => s.stage), ['arrival', 'movement', 'attention', 'closure']);
            const closure = stages[3];
            assert.strictEqual(JSON.stringify(closure.problems), JSON.stringify(result.ticks[t].problems), 'closure must match the original problem snapshot');
            closure.choices.forEach((choice, id) => {
              const original = result.ticks[t].choices[id];
              assert.strictEqual(choice.state, original.state);
              assert.strictEqual(choice.energySpent, original.energySpent);
              assert.strictEqual(choice.energyRequired, original.energyRequired);
            });
            stages[2].choices.forEach((choice, id) => {
              if (stages[1].choices[id].state === 'active') {
                assert(Math.abs(choice.energySpent - stages[1].choices[id].energySpent - choice.participants * 0.39) < EPS, 'attention must expose actual participant contributions');
              }
            });
          }

          const finalResolved = lastTick.problems.filter((p) => p.state === 'resolved').length;
          const finalAttached = lastTick.problems.filter((p) => p.state === 'attached').length;
          const finalFloating = lastTick.problems.filter((p) => p.state === 'floating').length;
          const finalInactive = lastTick.problems.filter((p) => p.state === 'inactive').length;

          assert.strictEqual(finalResolved + finalAttached + finalFloating + finalInactive, 20, 'last tick problem states must partition to 20');

          if (inflow === 'heavy') {
            assert(result.problemNeverEntered < EPS, 'heavy inflow should enter all problems by period 20');
          }

          checked++;
        }
      }
    }
  }

  console.log('PASS: checked invariants across', checked, 'parameter combinations');
}

async function assertAsyncApiContract() {
  const result = await runGarbageCanSimulationAsync({
    problemIntensity: 'moderate',
    problemInflow: 'moderate',
    decisionStructure: 'hierarchical',
    accessStructure: 'hierarchical'
  }, { chunkSize: 5 });

  assert(inRange(result.resolution, 0, 1));
  assert(inRange(result.oversight, 0, 1));
  assert(inRange(result.flight, 0, 1));
  assert.strictEqual(result.ticks.length, 21);

  assert.throws(
    () => runGarbageCanSimulationAsync({
      problemIntensity: 'moderate',
      problemInflow: 'invalid',
      decisionStructure: 'hierarchical',
      accessStructure: 'hierarchical'
    }),
    /Unknown problemInflow/
  );

  console.log('PASS: async API contract and error propagation');
}

(async function run() {
  assertThrowsUnknownParam();
  await assertAllCombosInvariant();
  await assertAsyncApiContract();
  console.log('PASS: tests/test-gc-simulation-invariants.js');
})().catch((err) => {
  console.error('FAIL: tests/test-gc-simulation-invariants.js');
  console.error(err);
  process.exit(1);
});
