'use strict';

/**
 * explorer.js
 * Simulation Explorer page — parameter selection and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── Nav toggle ──────────────────────────────────────────────────────────────
document.querySelector('.nav-mobile-toggle').addEventListener('click', function() {
  document.querySelector('.nav-links').classList.toggle('is-open');
});

// ─── Dropdown helpers ─────────────────────────────────────────────────────────
function allDropdownsSelected() {
  var load     = document.getElementById('panel-a-load').value;
  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;
  return load !== '' && decision !== '' && access !== '';
}

// ─── Diagnosis helper — updates title/body when all dropdowns have a value ────
function updateDiagnosis() {
  if (!allDropdownsSelected()) {
    document.getElementById('explorer-diagnosis').hidden = true;
    document.getElementById('explorer-sim-trigger').hidden = true;
    return;
  }

  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;

  var diagnosis = getDiagnosis(decision, access, 0);

  // Strip the flight-percentage sentence — no simulation result yet
  var bodyText = diagnosis.body;
  bodyText = bodyText.replace(/In organisations like yours, roughly.*$/, '').trim();

  document.getElementById('explorer-diagnosis-title').textContent = diagnosis.title;
  document.getElementById('explorer-diagnosis-body').textContent  = bodyText;
  document.getElementById('explorer-diagnosis').hidden = false;
  document.getElementById('explorer-sim-trigger').hidden = false;
}

// ─── Simulation reset ─────────────────────────────────────────────────────────
function resetSimulation() {
  var svg = document.getElementById('viz-svg');
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  document.getElementById('sim-summary').hidden = true;
  document.getElementById('run-sim-btn').hidden = false;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;

  if (allDropdownsSelected()) {
    document.getElementById('viz-area').hidden = false;
    drawEmptyState();
  } else {
    document.getElementById('viz-area').hidden = true;
  }
}

// ─── Dropdown change — update diagnosis and reset simulation ──────────────────
['panel-a-load', 'panel-a-decision', 'panel-a-access'].forEach(function(id) {
  document.getElementById(id).addEventListener('change', function() {
    updateDiagnosis();
    resetSimulation();
  });
});

// ─── Run simulation button ────────────────────────────────────────────────────
document.getElementById('run-sim-btn').addEventListener('click', function() {
  var load     = document.getElementById('panel-a-load').value;
  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;

  var simResult = runGarbageCanSimulation({
    energyLoad: load,
    decisionStructure: decision,
    accessStructure: access
  });

  document.getElementById('run-sim-btn').hidden = true;
  drawViz(simResult, load, decision, access);
});

// ─── Replay button ────────────────────────────────────────────────────────────
document.getElementById('replay-btn').addEventListener('click', function() {
  var load     = document.getElementById('panel-a-load').value;
  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;

  var newSim = runGarbageCanSimulation({
    energyLoad: load,
    decisionStructure: decision,
    accessStructure: access
  });

  drawViz(newSim, load, decision, access);
});
