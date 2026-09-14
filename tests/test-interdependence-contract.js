// Tests the interdependence classifier and explanatory cost model at their semantic boundaries.
'use strict';

const assert = require('assert');
const path = require('path');

const diagnostic = require(path.join(__dirname, '..', 'modules', 'interdependence', 'interdependence-diagnostic.js'));
const costModel = require(path.join(__dirname, '..', 'modules', 'interdependence', 'interdependence-cost-model.js'));

function scores(overrides) {
  return Object.assign({
    pooled: 0,
    sequential: 0,
    mutual: 0,
    unknown: 0,
    retraction: 0,
    contention: 0,
    rework: 0,
    cadence: 0,
    authority: 0,
    context: 0,
    record: 0,
    integration: 0,
  }, overrides);
}

function run() {
  assert.strictEqual(
    diagnostic.classify(scores({ pooled: 2 })).kind,
    'pooled',
    'independent contributions should classify as pooled work'
  );
  assert.strictEqual(
    diagnostic.classify(scores({ sequential: 2 })).kind,
    'sequential',
    'a stable one-way handoff should classify as sequential work'
  );
  assert.strictEqual(
    diagnostic.classify(scores({ mutual: 2, unknown: 2 })).kind,
    'reciprocalAdditive',
    'reciprocal exchange without invalidation should remain additive'
  );
  assert.strictEqual(
    diagnostic.classify(scores({ retraction: 2, contention: 2, rework: 2 })).kind,
    'sequentialRetractive',
    'retractive feedback without a mutual loop should remain a sequential feedback-boundary case'
  );

  const reciprocalRetractive = diagnostic.classify(scores({
    mutual: 2,
    unknown: 2,
    retraction: 2,
    contention: 2,
    rework: 2,
    cadence: 0,
    authority: 0,
    context: 0,
    record: 0,
    integration: 0,
  }));
  assert.strictEqual(reciprocalRetractive.kind, 'reciprocalRetractive', 'mutual and retractive work should classify as reciprocal-retractive');
  assert.strictEqual(diagnostic.boundaryLabel(reciprocalRetractive), 'Exposed', 'absent boundary capacity should be marked exposed');
  assert.strictEqual(
    diagnostic.boundaryLabel(diagnostic.classify(scores({ cadence: 2, authority: 2, context: 2, record: 2, integration: 2 }))),
    'Strong',
    'reliable adjustment capacity should be marked strong'
  );

  const noRetraction = costModel.buildScenario({ dependence: 80, retraction: 0, latency: 4, releaseRate: 20, feedbackGain: 70, exchanges: 6, coordinationCost: 3 });
  assert.strictEqual(costModel.buildReworkSeed(0.8, 0.5, 20, 10), 40, 'the seed should apply coupling and retraction shares to capped accumulated work');
  assert.strictEqual(costModel.cumulativeRework(20, 0.5, 3), 35, 'the symmetric matrix recurrence should total seed, first propagation, and second propagation');
  assert.strictEqual(noRetraction.totals.planned, 100, 'the planned baseline must remain indexed to 100');
  assert.strictEqual(noRetraction.totals.mismatch, 100, 'without retraction, delayed adjustment must not invent rework');
  assert(noRetraction.totals.fit > 100, 'short-loop governance should make its explicit coordination cost visible');

  const shorterLatency = costModel.buildScenario({ dependence: 80, retraction: 45, latency: 1, releaseRate: 20, feedbackGain: 70, exchanges: 6, coordinationCost: 3 });
  const longerLatency = costModel.buildScenario({ dependence: 80, retraction: 45, latency: 6, releaseRate: 20, feedbackGain: 70, exchanges: 6, coordinationCost: 3 });
  assert(longerLatency.totals.mismatch > shorterLatency.totals.mismatch, 'longer decision latency should increase delayed-adjustment effort');
  assert(longerLatency.totals.mismatch > longerLatency.totals.fit, 'short-loop governance should remain cheaper than delayed adjustment in a retractive scenario');
  assert.strictEqual(longerLatency.series.length, 7, 'the scenario should include discovery plus one cumulative point per revision exchange');
  assert.deepStrictEqual(longerLatency.series[0], { exchange: 0, planned: 100, fit: 100, mismatch: 100 }, 'the chart should start from the direct-work baseline at discovery');
  assert.strictEqual(longerLatency.matrix[0][1], 0.7, 'the off-diagonal DSM entry should equal the stated reciprocal feedback gain');

  const lowGain = costModel.buildScenario({ dependence: 80, retraction: 45, latency: 6, releaseRate: 20, feedbackGain: 20, exchanges: 6, coordinationCost: 3 });
  assert(longerLatency.totals.mismatch > lowGain.totals.mismatch, 'stronger reciprocal feedback should amplify rework across exchanges');

  console.log('PASS: tests/test-interdependence-contract.js');
}

run();
