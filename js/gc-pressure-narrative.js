'use strict';

(function(factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.buildGcPressureNarrative = api.buildGcPressureNarrative;
  }
})(function createPressureNarrativeApi() {
  var PRESSURE_SCORE = { light: 1, moderate: 2, heavy: 3 };
  var STRUCTURE_SCORE = { unsegmented: 1, hierarchical: 2, specialized: 3 };

  function titleCase(token) {
    if (!token) return '';
    return token.charAt(0).toUpperCase() + token.slice(1);
  }

  function pressureBand(score) {
    if (score <= 3) return 'Low';
    if (score <= 5) return 'Moderate';
    return 'High';
  }

  function buildGcPressureNarrative(intensity, inflow, decision, access) {
    var problemScore = (PRESSURE_SCORE[intensity] || 0) + (PRESSURE_SCORE[inflow] || 0);
    var coordinationScore = (STRUCTURE_SCORE[decision] || 0) + (STRUCTURE_SCORE[access] || 0);
    var problemBand = pressureBand(problemScore);
    var coordinationBand = pressureBand(coordinationScore);

    var problemSummary = problemBand + ' (' + titleCase(intensity) + ' intensity + ' + titleCase(inflow) + ' inflow)';
    var coordinationSummary = coordinationBand + ' (' + titleCase(decision) + ' decision + ' + titleCase(access) + ' access)';

    var synthesis = '';
    if (problemBand === 'High' && coordinationBand === 'High') {
      synthesis = 'High incoming demand meets tight channels. Expect congestion around specific choice opportunities, visible searching, and increased closure by oversight or flight.';
    } else if (problemBand === 'High' && coordinationBand === 'Low') {
      synthesis = 'High incoming demand meets open participation. Expect broad movement and rapid coupling/decoupling as problems circulate across many choice opportunities.';
    } else if (problemBand === 'Low' && coordinationBand === 'High') {
      synthesis = 'Lower incoming demand meets tight channels. Expect slower, more local processing with clearer ownership and fewer cross-forum transitions.';
    } else if (problemBand === 'Low' && coordinationBand === 'Low') {
      synthesis = 'Lower incoming demand meets open participation. Expect comparatively smooth circulation with less visible overload and fewer forced closures.';
    } else {
      synthesis = 'Mixed pressure profile: some iterations absorb demand, while others show spillover. Expect alternating periods of local resolution and searching.';
    }

    return {
      problemSummary: problemSummary,
      coordinationSummary: coordinationSummary,
      synthesis: synthesis
    };
  }

  return {
    buildGcPressureNarrative: buildGcPressureNarrative
  };
});
