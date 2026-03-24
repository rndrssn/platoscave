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
    source + '\nmodule.exports = { CHOICE_RADIUS, VIZ_LAYOUT, GC_VIZ_DEFAULTS };',
    context,
    { filename: 'gc-viz.contracts.js' }
  );
  return context.module.exports;
}

function run() {
  const { CHOICE_RADIUS, VIZ_LAYOUT } = loadContracts();

  assert(CHOICE_RADIUS === 34, 'Expected CHOICE_RADIUS to remain 34');
  assert(VIZ_LAYOUT && VIZ_LAYOUT.empty && VIZ_LAYOUT.live, 'Expected VIZ_LAYOUT empty/live config');
  assert(VIZ_LAYOUT.empty.choiceRadius === CHOICE_RADIUS, 'Expected empty layout to source choice radius from CHOICE_RADIUS');
  assert(VIZ_LAYOUT.live.choiceRadius === CHOICE_RADIUS, 'Expected live layout to source choice radius from CHOICE_RADIUS');

  console.log('PASS: tests/test-gc-viz-contract.js');
}

run();
