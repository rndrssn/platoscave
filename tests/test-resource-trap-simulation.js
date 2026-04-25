'use strict';

const assert = require('assert');
const path = require('path');

const {
  buildConfig,
  DEFAULT_CONFIG,
  simulateResourceTrap,
} = require(path.join(__dirname, '..', 'modules', 'queue-machine', 'animation', 'resource-trap-simulation.js'));

function nearlyEqual(actual, expected, epsilon, label) {
  assert(
    Math.abs(actual - expected) <= epsilon,
    label + ': expected ' + expected + ', received ' + actual
  );
}

function run() {
  const result = simulateResourceTrap();
  const busy = result.lanes.find((lane) => lane.key === 'busy');
  const flow = result.lanes.find((lane) => lane.key === 'flow');

  assert(busy, 'busy policy should be simulated');
  assert(flow, 'flow policy should be simulated');
  assert.strictEqual(busy.snapshots.length, DEFAULT_CONFIG.ticks, 'busy snapshot count should match ticks');
  assert.strictEqual(flow.snapshots.length, DEFAULT_CONFIG.ticks, 'flow snapshot count should match ticks');

  nearlyEqual(
    busy.finalMetrics.arrivalRate,
    flow.finalMetrics.arrivalRate,
    1e-12,
    'both policies should receive the same average arrival rate'
  );
  assert(
    busy.policy.wipLimit > flow.policy.wipLimit,
    'busy policy should allow more WIP than flow policy'
  );
  assert(
    busy.policy.congestionPenalty > flow.policy.congestionPenalty,
    'busy policy should pay a larger congestion penalty when handoff queues build'
  );
  assert(
    flow.finalMetrics.throughput > busy.finalMetrics.throughput,
    'flow policy should produce higher throughput in the configured showcase'
  );
  assert(
    flow.finalMetrics.averageLeadTime < busy.finalMetrics.averageLeadTime,
    'flow policy should produce lower average lead time in the configured showcase'
  );
  assert(
    busy.finalMetrics.utilization > flow.finalMetrics.utilization,
    'busy policy should look more utilized while producing worse flow'
  );
  assert(
    busy.finalMetrics.waiting >= flow.finalMetrics.waiting,
    'busy policy should leave at least as many items waiting at the final snapshot'
  );

  const midpoint = result.snapshotsAt(0.5);
  assert(midpoint.busy.metrics.arrivals === midpoint.flow.metrics.arrivals, 'snapshot arrivals should match across policies');
  assert(midpoint.busy.metrics.wip >= 0 && midpoint.flow.metrics.wip >= 0, 'snapshot WIP should be non-negative');

  const lowDemand = buildConfig({ demand: 0, burstiness: 1, taskVariation: 1, flowWipLimit: 3 });
  const highDemand = buildConfig({ demand: 1, burstiness: 1, taskVariation: 1, flowWipLimit: 3 });
  assert(
    highDemand.arrivals.length > lowDemand.arrivals.length,
    'Higher demand control should create more arriving items'
  );

  const smooth = buildConfig({ demand: 1, burstiness: 0, taskVariation: 1, flowWipLimit: 3 });
  const bursty = buildConfig({ demand: 1, burstiness: 1, taskVariation: 1, flowWipLimit: 3 });
  const smoothGap = smooth.arrivals[2].arrivalTick - smooth.arrivals[0].arrivalTick;
  const burstyGap = bursty.arrivals[2].arrivalTick - bursty.arrivals[0].arrivalTick;
  assert(
    burstyGap < smoothGap,
    'Higher burstiness control should compress arrival clusters'
  );

  const evenTasks = buildConfig({ demand: 1, burstiness: 1, taskVariation: 0, flowWipLimit: 3 });
  const variedTasks = buildConfig({ demand: 1, burstiness: 1, taskVariation: 1, flowWipLimit: 3 });
  assert.deepStrictEqual(
    evenTasks.arrivals[0].work,
    [8, 8, 8],
    'Zero task variation should normalize task sizes around the mean'
  );
  assert.notDeepStrictEqual(
    variedTasks.arrivals[0].work,
    evenTasks.arrivals[0].work,
    'Higher task variation should alter station work sizes'
  );

  const customWip = simulateResourceTrap({ demand: 1, burstiness: 1, taskVariation: 1, flowWipLimit: 5 });
  const customFlow = customWip.lanes.find((lane) => lane.key === 'flow');
  assert.strictEqual(customFlow.policy.wipLimit, 5, 'Flow WIP control should update the flow policy WIP limit');

  console.log('PASS: tests/test-resource-trap-simulation.js');
}

run();
