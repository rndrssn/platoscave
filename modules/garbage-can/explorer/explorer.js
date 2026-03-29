'use strict';

/**
 * explorer.js
 * Explore page — parameter selection and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Results mini-nav ────────────────────────────────────────────────────────
var resultsNav = document.getElementById('explorer-results-nav');
var resultsNavLinks = Array.from(document.querySelectorAll('.results-nav-link'));
var hasAutoNavigatedToResults = false;

function setSimError(message) {
  var simError = document.getElementById('explorer-sim-error');
  if (!simError) return;
  if (!message) {
    simError.hidden = true;
    simError.textContent = '';
    return;
  }
  simError.textContent = message;
  simError.hidden = false;
}
function buildExplorerNarrative(intensity, inflow, decision, access) {
  if (typeof window !== 'undefined' && typeof window.buildGcPressureNarrative === 'function') {
    return window.buildGcPressureNarrative(intensity, inflow, decision, access);
  }
  var decisionLabel = decision === 'unsegmented' ? 'Open participation' : titleCase(decision);
  var accessLabel = access === 'unsegmented' ? 'Open' : titleCase(access);
  return {
    problemSummary: titleCase(intensity) + ' difficulty + ' + titleCase(inflow) + ' arrival rate',
    coordinationSummary: decisionLabel + ' decision + ' + accessLabel + ' access',
    synthesis: 'Combination selected. Run the simulation to see how this pressure profile shapes resolution, oversight, and flight.'
  };
}

function titleCase(token) {
  if (!token) return '';
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function centerSimulationCanvasInViewport() {
  var canvas = document.getElementById('viz-svg');
  if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return;
  var rect = canvas.getBoundingClientRect();
  var canvasCenterY = rect.top + window.pageYOffset + (rect.height / 2);
  var viewportCenterY = (window.innerHeight || document.documentElement.clientHeight || 0) / 2;
  var targetY = Math.max(0, canvasCenterY - viewportCenterY);
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}

function setActiveResultsNav(targetId) {
  resultsNavLinks.forEach(function(link) {
    var isActive = link.getAttribute('data-section') === targetId;
    link.classList.toggle('results-nav-link--active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

resultsNavLinks.forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var targetId = this.getAttribute('data-section');
    var target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveResultsNav(targetId);
  });
});

// ─── Dropdown helpers ─────────────────────────────────────────────────────────
function allDropdownsSelected() {
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  return intensity !== '' && inflow !== '' && decision !== '' && access !== '';
}

// ─── Diagnosis helper — updates title/body when all dropdowns have a value ────
function updateDiagnosis() {
  var pressureBlock = document.getElementById('explorer-pressure-block');
  if (!allDropdownsSelected()) {
    document.getElementById('explorer-diagnosis').hidden = true;
    document.getElementById('explorer-sim-trigger').hidden = true;
    if (pressureBlock) pressureBlock.hidden = true;
    if (resultsNav) resultsNav.hidden = true;
    hasAutoNavigatedToResults = false;
    return;
  }

  var intensity = document.getElementById('panel-a-load').value;
  var inflow   = document.getElementById('panel-a-inflow').value;
  var decision = document.getElementById('panel-a-decision').value;
  var access   = document.getElementById('panel-a-access').value;

  var diagnosis = getDiagnosis(decision, access, 0);
  var narrative = buildExplorerNarrative(intensity, inflow, decision, access);

  // Strip the trailing percentage sentence — no simulation result yet
  var bodyText = diagnosis.body;
  bodyText = bodyText.replace(/In organisations like yours, roughly.*$/, '').trim();

  document.getElementById('explorer-diagnosis-title').textContent = diagnosis.title;
  document.getElementById('explorer-diagnosis-body').textContent  = bodyText;
  var problemPressureEl = document.getElementById('explorer-problem-pressure');
  var coordinationPressureEl = document.getElementById('explorer-coordination-pressure');
  var comboNarrativeEl = document.getElementById('explorer-combo-narrative');
  if (problemPressureEl) problemPressureEl.textContent = narrative.problemSummary;
  if (coordinationPressureEl) coordinationPressureEl.textContent = narrative.coordinationSummary;
  if (comboNarrativeEl) comboNarrativeEl.textContent = narrative.synthesis;
  if (pressureBlock) pressureBlock.hidden = false;
  document.getElementById('explorer-diagnosis').hidden = false;
  document.getElementById('explorer-sim-trigger').hidden = false;
  if (resultsNav) resultsNav.hidden = false;
  setActiveResultsNav('explorer-diagnosis');

  if (!hasAutoNavigatedToResults) {
    document.getElementById('explorer-diagnosis').scrollIntoView({ behavior: 'smooth', block: 'start' });
    hasAutoNavigatedToResults = true;
  }
}

// ─── Simulation reset ─────────────────────────────────────────────────────────
function resetSimulation() {
  var svg = document.getElementById('viz-svg');
  if (svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }
  setSimError('');

  document.getElementById('sim-summary').hidden = true;
  document.getElementById('run-sim-btn').hidden = false;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;

  if (allDropdownsSelected()) {
    document.getElementById('viz-area').hidden = false;
    drawEmptyState();
    setActiveResultsNav('explorer-diagnosis');
  } else {
    document.getElementById('viz-area').hidden = true;
  }
}

// ─── Dropdown change — update diagnosis and reset simulation ──────────────────
['panel-a-load', 'panel-a-inflow', 'panel-a-decision', 'panel-a-access'].forEach(function(id) {
  var select = document.getElementById(id);
  if (!select) return;
  select.addEventListener('change', function() {
    updateDiagnosis();
    resetSimulation();
    setSimError('');
  });
});

// ─── Run simulation button ────────────────────────────────────────────────────
var runSimBtn = document.getElementById('run-sim-btn');
if (runSimBtn) runSimBtn.addEventListener('click', async function() {
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  var runBtn = document.getElementById('run-sim-btn');
  var originalText = runBtn.textContent;

  runBtn.disabled = true;
  runBtn.textContent = 'Running simulation...';
  try {
    var simResult = await runGarbageCanSimulationAsync({
      problemIntensity: intensity,
      problemInflow: inflow,
      decisionStructure: decision,
      accessStructure: access
    });
    runBtn.hidden = true;
    drawViz(simResult);
    setTimeout(centerSimulationCanvasInViewport, 80);
    setActiveResultsNav('viz-area');
    setSimError('');
  } catch (error) {
    setSimError('Simulation failed. Please try again.');
    throw error;
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = originalText;
  }
});

// ─── Replay button ────────────────────────────────────────────────────────────
var replayBtnEl = document.getElementById('replay-btn');
if (replayBtnEl) replayBtnEl.addEventListener('click', async function() {
  var intensity = document.getElementById('panel-a-load').value;
  var inflow    = document.getElementById('panel-a-inflow').value;
  var decision  = document.getElementById('panel-a-decision').value;
  var access    = document.getElementById('panel-a-access').value;
  var replayBtn = document.getElementById('replay-btn');
  var originalText = replayBtn.textContent;

  replayBtn.disabled = true;
  replayBtn.textContent = 'Running simulation...';
  try {
    var newSim = await runGarbageCanSimulationAsync({
      problemIntensity: intensity,
      problemInflow: inflow,
      decisionStructure: decision,
      accessStructure: access
    });
    drawViz(newSim);
    setTimeout(centerSimulationCanvasInViewport, 80);
    setSimError('');
  } catch (error) {
    setSimError('Simulation failed. Please try again.');
    throw error;
  } finally {
    replayBtn.disabled = false;
    replayBtn.textContent = originalText;
  }
});
