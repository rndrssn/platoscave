'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument, FakeElement, buildWindow } = require('./helpers/fake-dom');
const { getDiagnosisPreview } = require('../modules/garbage-can/runtime/gc-diagnosis.js');
const { buildGcPressureNarrative } = require('../modules/garbage-can/runtime/gc-pressure-narrative.js');

function loadExplorerWithHarness(harness) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'garbage-can', 'explorer', 'explorer.js'), 'utf8');
  const context = {
    window: harness.window,
    document: harness.document,
    history: { scrollRestoration: 'auto' },
    drawEmptyState: harness.drawEmptyState,
    drawViz: harness.drawViz,
    getDiagnosis: harness.getDiagnosis,
    getDiagnosisPreview: getDiagnosisPreview,
    runGarbageCanSimulationAsync: harness.runGarbageCanSimulationAsync,
    setTimeout: function(fn) { fn(); return 0; },
    clearTimeout: function() {},
    console,
  };

  vm.createContext(context);
  const uiUtilsSrc = fs.readFileSync(path.join(__dirname, '..', 'modules', 'garbage-can', 'gc-ui-utils.js'), 'utf8');
  vm.runInContext(uiUtilsSrc, context, { filename: 'gc-ui-utils.js' });
  vm.runInContext(source, context, { filename: 'explorer.js' });
}

function makeExplorerHarness() {
  const document = new FakeDocument();
  const windowObj = buildWindow(document);
  windowObj.buildGcPressureNarrative = buildGcPressureNarrative;

  const navToggle = document.register(new FakeElement('button', { className: 'nav-mobile-toggle' }));
  const navLinks = document.register(new FakeElement('div', { className: 'nav-links' }));
  navToggle.setAttribute('aria-expanded', 'false');

  const ids = [
    'panel-a-load', 'panel-a-inflow', 'panel-a-decision', 'panel-a-access',
    'explorer-diagnosis', 'explorer-sim-trigger', 'explorer-diagnosis-title', 'explorer-diagnosis-body',
    'explorer-pressure-block', 'explorer-problem-pressure', 'explorer-coordination-pressure', 'explorer-combo-narrative',
    'viz-svg', 'sim-summary', 'run-sim-btn', 'replay-btn', 'stochastic-note', 'viz-area'
  ];
  ids.forEach((id) => document.register(new FakeElement(id === 'run-sim-btn' || id === 'replay-btn' ? 'button' : 'div', { id })));

  document.getElementById('explorer-diagnosis').hidden = true;
  document.getElementById('explorer-sim-trigger').hidden = true;
  document.getElementById('explorer-pressure-block').hidden = true;
  document.getElementById('viz-area').hidden = true;
  document.getElementById('sim-summary').hidden = true;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;
  document.getElementById('run-sim-btn').textContent = 'See how decisions play out';
  document.getElementById('replay-btn').textContent = 'Run simulation again';

  let emptyStateCalls = 0;
  let drawVizCalls = 0;

  let runImpl = function() {
    return Promise.resolve({ ticks: [], resolution: 0, oversight: 0, flight: 0, problemResolved: 0, problemDisplaced: 0, problemAdrift: 0, problemInForum: 0 });
  };

  const harness = {
    document,
    window: windowObj,
    setRunImpl: function(fn) { runImpl = fn; },
    get drawVizCalls() { return drawVizCalls; },
    get emptyStateCalls() { return emptyStateCalls; },
    drawEmptyState: function() { emptyStateCalls++; },
    drawViz: function() { drawVizCalls++; },
    getDiagnosis: function() {
      return {
        title: 'Diag',
        body: 'Body. In organisations like yours, roughly 40% of problems remain unresolved.'
      };
    },
    runGarbageCanSimulationAsync: function(params) {
      return runImpl(params);
    }
  };

  return harness;
}

async function run() {
  const h = makeExplorerHarness();
  loadExplorerWithHarness(h);

  const load = h.document.getElementById('panel-a-load');
  const inflow = h.document.getElementById('panel-a-inflow');
  const decision = h.document.getElementById('panel-a-decision');
  const access = h.document.getElementById('panel-a-access');
  const diagnosis = h.document.getElementById('explorer-diagnosis');
  const trigger = h.document.getElementById('explorer-sim-trigger');
  const vizArea = h.document.getElementById('viz-area');

  load.value = 'moderate';
  load.dispatchEvent({ type: 'change', preventDefault: function() {} });
  assert.strictEqual(diagnosis.hidden, true, 'diagnosis must remain hidden until all dropdowns selected');
  assert.strictEqual(trigger.hidden, true, 'sim trigger must remain hidden until all dropdowns selected');

  inflow.value = 'moderate';
  inflow.dispatchEvent({ type: 'change', preventDefault: function() {} });
  decision.value = 'hierarchical';
  decision.dispatchEvent({ type: 'change', preventDefault: function() {} });
  access.value = 'hierarchical';
  access.dispatchEvent({ type: 'change', preventDefault: function() {} });

  assert.strictEqual(diagnosis.hidden, false, 'diagnosis should become visible when all dropdowns selected');
  assert.strictEqual(trigger.hidden, false, 'sim trigger should become visible when all dropdowns selected');
  assert.strictEqual(vizArea.hidden, false, 'viz area should become visible when all dropdowns selected');
  assert.strictEqual(h.document.getElementById('explorer-pressure-block').hidden, false, 'pressure block should become visible');
  assert(h.document.getElementById('explorer-problem-pressure').textContent.length > 0, 'problem pressure text should be populated');
  assert(h.document.getElementById('explorer-coordination-pressure').textContent.length > 0, 'coordination pressure text should be populated');
  assert(h.document.getElementById('explorer-combo-narrative').textContent.length > 0, 'combo narrative text should be populated');
  assert(h.emptyStateCalls > 0, 'drawEmptyState should be called after parameter selection');

  const runBtn = h.document.getElementById('run-sim-btn');
  h.setRunImpl(function() {
    return Promise.resolve({ ticks: [], resolution: 0.2, oversight: 0.5, flight: 0.3, problemResolved: 4, problemDisplaced: 2, problemAdrift: 6, problemInForum: 8 });
  });

  await runBtn.listeners.click[0].call(runBtn, { type: 'click', preventDefault: function() {} });
  assert.strictEqual(runBtn.disabled, false, 'run button must re-enable after success');
  assert.strictEqual(runBtn.hidden, true, 'run button should hide after successful run');
  assert.strictEqual(runBtn.textContent, 'See how decisions play out', 'run button label must restore after success');
  assert.strictEqual(h.drawVizCalls, 1, 'drawViz should run once on successful simulation');

  runBtn.hidden = false;
  h.setRunImpl(function() {
    return Promise.reject(new Error('sim failed'));
  });

  await assert.rejects(
    runBtn.listeners.click[0].call(runBtn, { type: 'click', preventDefault: function() {} }),
    /sim failed/
  );

  assert.strictEqual(runBtn.disabled, false, 'run button must re-enable after failure');
  assert.strictEqual(runBtn.textContent, 'See how decisions play out', 'run button label must restore after failure');

  console.log('PASS: tests/test-explorer-integration.js');
}

run().catch((err) => {
  console.error('FAIL: tests/test-explorer-integration.js');
  console.error(err);
  process.exit(1);
});
