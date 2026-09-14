// Interdependence cost model: a two-activity rework-propagation model with a symmetric Design Structure Matrix dependency structure.
'use strict';

(function initInterdependenceCostModel(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.InterdependenceCostModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildInterdependenceCostModel() {
  var BASELINE_WORK = 100;
  var FIT_DECISION_LATENCY = 1;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function buildReworkSeed(dependence, retraction, releaseRate, latency) {
    return dependence * retraction * Math.min(BASELINE_WORK, releaseRate * latency);
  }

  function multiplyMatrixVector(matrix, vector) {
    return [
      (matrix[0][0] * vector[0]) + (matrix[0][1] * vector[1]),
      (matrix[1][0] * vector[0]) + (matrix[1][1] * vector[1])
    ];
  }

  function cumulativeRework(seed, feedbackGain, rounds) {
    var matrix = [[0, feedbackGain], [feedbackGain, 0]];
    var propagated = [seed / 2, seed / 2];
    var total = [0, 0];

    for (var round = 0; round < rounds; round += 1) {
      total[0] += propagated[0];
      total[1] += propagated[1];
      propagated = multiplyMatrixVector(matrix, propagated);
    }

    return total[0] + total[1];
  }

  function buildScenario(input) {
    var dependence = clamp(input.dependence, 0, 100) / 100;
    var retraction = clamp(input.retraction, 0, 70) / 100;
    var latency = clamp(input.latency, 1, 8);
    var releaseRate = clamp(input.releaseRate, 5, 30);
    var feedbackGain = clamp(input.feedbackGain, 0, 90) / 100;
    var exchanges = Math.round(clamp(input.exchanges, 2, 10));
    var coordinationCost = clamp(input.coordinationCost, 0, 15);
    var mismatchSeed = buildReworkSeed(dependence, retraction, releaseRate, latency);
    var fitSeed = buildReworkSeed(dependence, retraction, releaseRate, FIT_DECISION_LATENCY);
    var series = [{ exchange: 0, planned: BASELINE_WORK, fit: BASELINE_WORK, mismatch: BASELINE_WORK }];

    for (var exchange = 1; exchange <= exchanges; exchange += 1) {
      series.push({
        exchange: exchange,
        planned: BASELINE_WORK,
        fit: BASELINE_WORK + cumulativeRework(fitSeed, feedbackGain, exchange) + (coordinationCost * exchange),
        mismatch: BASELINE_WORK + cumulativeRework(mismatchSeed, feedbackGain, exchange)
      });
    }

    return {
      input: {
        dependence: dependence,
        retraction: retraction,
        latency: latency,
        releaseRate: releaseRate,
        feedbackGain: feedbackGain,
        exchanges: exchanges,
        coordinationCost: coordinationCost
      },
      baselineWork: BASELINE_WORK,
      fitDecisionLatency: FIT_DECISION_LATENCY,
      mismatchSeed: mismatchSeed,
      fitSeed: fitSeed,
      matrix: [[0, feedbackGain], [feedbackGain, 0]],
      spectralRadius: feedbackGain,
      series: series,
      totals: series[series.length - 1]
    };
  }

  return { buildScenario: buildScenario, buildReworkSeed: buildReworkSeed, cumulativeRework: cumulativeRework };
}));
