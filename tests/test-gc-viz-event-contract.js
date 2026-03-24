'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const vizPath = path.join(__dirname, '..', 'gc-viz.js');
const source = fs.readFileSync(vizPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadContracts() {
  const helperStub = {
    readCssVar: function(_name, fallback) { return fallback; },
    readCssNumber: function(_name, fallback) { return fallback; },
    formatChoiceOpportunityLabel: function(idx) { return 'CO' + (idx + 1); },
    formatChoiceOpportunityList: function(ids) {
      return ids.map(function(id) { return 'CO' + (id + 1); }).join(', ');
    },
    setMultilineLegendText: function() {},
    resolveVizDimensions: function(simResult) {
      var meta = (simResult && simResult.meta) || {};
      return {
        choices: meta.choices || 10,
        problems: meta.problems || 20,
        periods: meta.periods || 20,
        textScale: meta.textScale || 'default',
      };
    },
    resolveTextScale: function() { return 1; },
    getVizSizing: function() { return { problemRadius: 3, legendMarkerRadius: 3 }; },
    resolveVizLayout: function(_mode, _sizing, layout) { return layout.live || layout.empty; },
    resolveChoiceFieldBox: function(layout) {
      return { left: layout.padH || 35, top: layout.squareTop || 108, width: 600, height: 240 };
    },
    buildChoiceCenters: function(fieldBox, _choiceRadius, choiceCount) {
      return Array.from({ length: choiceCount }, function(_, i) {
        return { x: fieldBox.left + i * 10, y: fieldBox.top + 20 };
      });
    },
  };

  const context = {
    module: { exports: {} },
    exports: {},
    window: { GcVizHelpers: helperStub },
    document: {},
    d3: {},
    require,
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(context);
  vm.runInContext(
    source + '\nmodule.exports = { collectChoiceDeltaForTick, choiceEventTextFromDelta };',
    context,
    { filename: 'gc-viz.contracts.js' }
  );
  return context.module.exports;
}

function makeTick(choiceStates) {
  return {
    choices: choiceStates.map(function(state) { return { state: state }; }),
    problems: [],
  };
}

function run() {
  const { collectChoiceDeltaForTick, choiceEventTextFromDelta } = loadContracts();

  var prev = makeTick(['inactive', 'inactive', 'inactive']);
  var curr = makeTick(['inactive', 'active', 'inactive']);
  var delta = collectChoiceDeltaForTick(prev, curr, 3);
  assert(delta.openedIds.length === 1 && delta.openedIds[0] === 1, 'Expected CO2 to be marked opened');
  assert(choiceEventTextFromDelta(delta) === 'CO2 opened', 'Expected single-open event wording');

  prev = makeTick(['inactive', 'inactive', 'inactive']);
  curr = makeTick(['inactive', 'closed', 'inactive']);
  delta = collectChoiceDeltaForTick(prev, curr, 3);
  assert(delta.openedAndClosedIds.length === 1 && delta.openedAndClosedIds[0] === 1, 'Expected CO2 opened-and-closed');
  assert(choiceEventTextFromDelta(delta) === 'CO2 opened and closed', 'Expected direct-close event wording');

  prev = makeTick(['active', 'active', 'inactive']);
  curr = makeTick(['closed', 'closed', 'inactive']);
  delta = collectChoiceDeltaForTick(prev, curr, 3);
  assert(delta.resolvedIds.has(0) && delta.resolvedIds.has(1), 'Expected CO1 and CO2 resolved');
  assert(choiceEventTextFromDelta(delta) === 'CO1, CO2 closed', 'Expected multi-close wording');

  prev = makeTick(['inactive', 'inactive', 'inactive']);
  curr = makeTick(['inactive', 'inactive', 'inactive']);
  delta = collectChoiceDeltaForTick(prev, curr, 3);
  assert(choiceEventTextFromDelta(delta) === 'No CO open/close event', 'Expected explicit no-event wording');

  console.log('PASS: tests/test-gc-viz-event-contract.js');
}

run();
