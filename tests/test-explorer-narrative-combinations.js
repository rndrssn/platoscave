'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument, FakeElement, buildWindow } = require('./helpers/fake-dom');

function buildHarness() {
  const document = new FakeDocument();
  const windowObj = buildWindow(document);

  document.register(new FakeElement('button', { className: 'nav-mobile-toggle' }));
  document.register(new FakeElement('div', { className: 'nav-links' }));

  [
    'panel-a-load', 'panel-a-inflow', 'panel-a-decision', 'panel-a-access',
    'explorer-diagnosis', 'explorer-sim-trigger', 'explorer-diagnosis-title', 'explorer-diagnosis-body',
    'explorer-pressure-block', 'explorer-problem-pressure', 'explorer-coordination-pressure', 'explorer-combo-narrative',
    'viz-svg', 'sim-summary', 'run-sim-btn', 'replay-btn', 'stochastic-note', 'viz-area'
  ].forEach((id) => document.register(new FakeElement(id === 'run-sim-btn' || id === 'replay-btn' ? 'button' : 'div', { id })));

  document.getElementById('explorer-diagnosis').hidden = true;
  document.getElementById('explorer-sim-trigger').hidden = true;
  document.getElementById('explorer-pressure-block').hidden = true;

  const context = {
    window: windowObj,
    document,
    history: { scrollRestoration: 'auto' },
    drawEmptyState: function() {},
    drawViz: function() {},
    getDiagnosis: function() { return { title: 'Diag', body: 'Body. In organisations like yours, roughly 20% of problems remain unresolved.' }; },
    runGarbageCanSimulationAsync: function() { return Promise.resolve({ ticks: [] }); },
    setTimeout: function(fn) { fn(); return 0; },
    clearTimeout: function() {},
    console,
  };

  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'garbage-can', 'explorer', 'explorer.js'), 'utf8');
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'explorer.js' });

  return document;
}

function triggerChange(el) {
  el.dispatchEvent({ type: 'change', preventDefault: function() {} });
}

function run() {
  const doc = buildHarness();
  const intensityEl = doc.getElementById('panel-a-load');
  const inflowEl = doc.getElementById('panel-a-inflow');
  const decisionEl = doc.getElementById('panel-a-decision');
  const accessEl = doc.getElementById('panel-a-access');

  const intensities = ['light', 'moderate', 'heavy'];
  const inflows = ['light', 'moderate', 'heavy'];
  const decisions = ['unsegmented', 'hierarchical', 'specialized'];
  const accesses = ['unsegmented', 'hierarchical', 'specialized'];

  var checked = 0;
  intensities.forEach(function(intensity) {
    inflows.forEach(function(inflow) {
      decisions.forEach(function(decision) {
        accesses.forEach(function(access) {
          intensityEl.value = intensity;
          inflowEl.value = inflow;
          decisionEl.value = decision;
          accessEl.value = access;
          triggerChange(accessEl);

          const problem = doc.getElementById('explorer-problem-pressure').textContent;
          const coord = doc.getElementById('explorer-coordination-pressure').textContent;
          const combo = doc.getElementById('explorer-combo-narrative').textContent;

          assert(problem.length > 0, 'problem pressure missing for ' + [intensity, inflow, decision, access].join('/'));
          assert(coord.length > 0, 'coordination pressure missing for ' + [intensity, inflow, decision, access].join('/'));
          assert(combo.length > 0, 'combo narrative missing for ' + [intensity, inflow, decision, access].join('/'));
          checked++;
        });
      });
    });
  });

  assert.strictEqual(checked, 81, 'expected 81 combinations checked');
  console.log('PASS: tests/test-explorer-narrative-combinations.js');
}

run();
