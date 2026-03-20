'use strict';

/**
 * assess.js
 * Self-Assessment page — questionnaire flow and wiring
 *
 * Dependencies: d3.js, gc-simulation.js, gc-scoring.js, gc-diagnosis.js, gc-viz.js
 */

// ─── Scroll restoration ──────────────────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── Nav toggle ──────────────────────────────────────────────────────────────
var navToggle = document.querySelector('.nav-mobile-toggle');
var navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// ─── Questionnaire collapse/expand ───────────────────────────────────────────
document.getElementById('questionnaire-toggle').addEventListener('click', function () {
  var content = document.getElementById('questionnaire-content');
  content.hidden = !content.hidden;
  this.textContent = content.hidden ? 'Retake assessment' : 'Hide questionnaire';
  if (!content.hidden) {
    document.getElementById('stage-1').classList.remove('stage-collapsed');
    document.getElementById('results-area').classList.remove('is-visible');
    document.getElementById('diagnosis-title').textContent = '';
    document.getElementById('diagnosis-body').textContent = '';
    document.getElementById('diagnosis-links').hidden = true;
    var positioningSvg = document.getElementById('positioning-svg');
    if (positioningSvg) { while (positioningSvg.firstChild) positioningSvg.removeChild(positioningSvg.firstChild); }
    var vizSvg = document.getElementById('viz-svg');
    if (vizSvg) { while (vizSvg.firstChild) vizSvg.removeChild(vizSvg.firstChild); }
    document.getElementById('viz-area').hidden = true;
    document.getElementById('sim-summary').hidden = true;
    document.getElementById('run-sim-btn').hidden = false;
  }
});

// ─── Results mini-nav ────────────────────────────────────────────────────────
var resultsNavLinks = Array.from(document.querySelectorAll('.results-nav-link'));

function setActiveResultsNav(targetId) {
  resultsNavLinks.forEach(function(l) {
    var isActive = l.getAttribute('data-section') === targetId;
    l.classList.toggle('results-nav-link--active', isActive);
    if (isActive) {
      l.setAttribute('aria-current', 'page');
    } else {
      l.removeAttribute('aria-current');
    }
  });
}

resultsNavLinks.forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var targetId = this.getAttribute('data-section');
    document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveResultsNav(targetId);
  });
});

var resultsSections = Array.from(document.querySelectorAll('.results-section'));
if (resultsSections.length > 0 && 'IntersectionObserver' in window) {
  var sectionObserver = new IntersectionObserver(function(entries) {
    var visible = entries
      .filter(function(entry) { return entry.isIntersecting; })
      .sort(function(a, b) { return b.intersectionRatio - a.intersectionRatio; });
    if (visible.length === 0) return;
    setActiveResultsNav(visible[0].target.id);
  }, {
    root: null,
    rootMargin: '-88px 0px -50% 0px',
    threshold: [0.15, 0.35, 0.6]
  });

  resultsSections.forEach(function(section) {
    sectionObserver.observe(section);
  });
}

// ─── Questionnaire step navigation ───────────────────────────────────────────
const Q_GROUPS = [
  { id: 'q-group-1', questions: ['q0', 'q1', 'q2', 'q3', 'q4'], errorId: 'form-error-1', continueId: 'q-continue-1' },
  { id: 'q-group-2', questions: ['q5', 'q6', 'q7'],             errorId: 'form-error-2', continueId: 'q-continue-2' },
  { id: 'q-group-3', questions: ['q8', 'q9', 'q10', 'q11'],     errorId: null,           continueId: null },
];

let currentGroup = 0;

function validateGroup(groupIdx) {
  const group = Q_GROUPS[groupIdx];
  for (let i = 0; i < group.questions.length; i++) {
    if (!document.querySelector(`input[name="${group.questions[i]}"]:checked`)) {
      return false;
    }
  }
  return true;
}

function advanceGroup(fromIdx) {
  const group = Q_GROUPS[fromIdx];
  if (!validateGroup(fromIdx)) {
    if (group.errorId) document.getElementById(group.errorId).hidden = false;
    return;
  }
  if (group.errorId) document.getElementById(group.errorId).hidden = true;

  // Hide current group
  document.getElementById(group.id).hidden = true;

  // Show next group
  currentGroup = fromIdx + 1;
  document.getElementById(Q_GROUPS[currentGroup].id).hidden = false;
  document.getElementById('q-step').textContent = `${currentGroup + 1} of 3`;

  // Scroll to top of next card — offset for fixed nav
  setTimeout(function() {
    var el = document.getElementById(Q_GROUPS[currentGroup].id);
    var navHeight = 72; // 4rem nav bar
    var y = el.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, 50);
}

document.getElementById('q-continue-1').addEventListener('click', function () {
  advanceGroup(0);
});

document.getElementById('q-continue-2').addEventListener('click', function () {
  advanceGroup(1);
});

// Enable submit button when all group 3 questions are answered
Q_GROUPS[2].questions.forEach(function(qName) {
  document.querySelectorAll('input[name="' + qName + '"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      if (validateGroup(2)) {
        document.getElementById('submit-btn').disabled = false;
      }
    });
  });
});

// Enable Continue buttons when their group's questions are answered
[0, 1].forEach(function(groupIdx) {
  Q_GROUPS[groupIdx].questions.forEach(function(qName) {
    document.querySelectorAll('input[name="' + qName + '"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        if (validateGroup(groupIdx)) {
          document.getElementById(Q_GROUPS[groupIdx].continueId).disabled = false;
        }
      });
    });
  });
});

// ─── Stage reveal ─────────────────────────────────────────────────────────────
function showStage(id, delay) {
  setTimeout(() => {
    const el = document.getElementById(id);
    el.classList.add('is-visible');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, delay);
}

function focusSimulationCanvas() {
  var svg = document.getElementById('viz-svg');
  if (!svg) return;
  var navHeight = 72; // 4rem nav bar
  if (typeof svg.getBoundingClientRect === 'function') {
    var y = svg.getBoundingClientRect().top + window.pageYOffset - navHeight - 6;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

// ─── Form submission ──────────────────────────────────────────────────────────
document.getElementById('questionnaire').addEventListener('submit', function (e) {
  e.preventDefault();

  const responses = [];
  for (let i = 0; i < 12; i++) {
    const checked = this.querySelector(`input[name="q${i}"]:checked`);
    if (!checked) {
      document.getElementById('form-error').hidden = false;
      return;
    }
    responses.push(parseInt(checked.value, 10));
  }
  document.getElementById('form-error').hidden = true;

  const scoring = scoreResponses(responses);
  const { energyLoad, decisionStructure, accessStructure, raw } = scoring;
  const problemIntensity = energyLoad;
  const problemInflow = 'moderate';

  const diagnosis = getDiagnosis(decisionStructure, accessStructure, 0);
  var diagnosisBodyPreview = diagnosis.body.replace(/In organisations like yours, roughly.*$/, '').trim();

  // Reveal results area
  showStage('results-area', 100);

  // Collapse questionnaire but preserve responses for review/edit
  currentGroup = 0;
  document.getElementById('q-group-1').hidden = false;
  document.getElementById('q-group-2').hidden = true;
  document.getElementById('q-group-3').hidden = true;
  document.getElementById('q-step').textContent = '1 of 3';
  document.getElementById('q-continue-1').disabled = !validateGroup(0);
  document.getElementById('q-continue-2').disabled = !validateGroup(1);
  document.getElementById('submit-btn').disabled = !validateGroup(2);
  document.getElementById('form-error-1').hidden = true;
  document.getElementById('form-error-2').hidden = true;
  document.getElementById('form-error').hidden = true;
  document.getElementById('questionnaire-content').hidden = true;
  document.getElementById('questionnaire-toggle').hidden = false;
  document.getElementById('questionnaire-toggle').textContent = 'Retake assessment';
  document.getElementById('stage-1').classList.add('stage-collapsed');

  // Reset simulation area
  document.getElementById('viz-area').hidden = true;
  document.getElementById('run-sim-btn').hidden = false;
  document.getElementById('sim-summary').hidden = true;
  document.getElementById('replay-btn').hidden = true;
  document.getElementById('stochastic-note').hidden = true;

  // Diagnosis
  setTimeout(() => {
    document.getElementById('diagnosis-title').textContent = diagnosis.title;
    document.getElementById('diagnosis-body').textContent  = diagnosisBodyPreview;
    document.getElementById('diagnosis-links').hidden = false;
  }, 300);

  // Positioning
  setTimeout(() => {
    drawPositioning(raw);
    document.getElementById('positioning-caption').textContent =
      `Intensity: ${problemIntensity}; Inflow: ${problemInflow}; Decision structure: ${decisionStructure}; Access structure: ${accessStructure}`;
  }, 500);

  // Show simulation area with empty state immediately
  document.getElementById('viz-area').hidden = false;
  drawEmptyState();

  // Simulation trigger — runs on button click
  document.getElementById('run-sim-btn').onclick = async function () {
    var runBtn = document.getElementById('run-sim-btn');
    var originalText = runBtn.textContent;
    runBtn.disabled = true;
    runBtn.textContent = 'Running simulation...';
    try {
      const simResult = await runGarbageCanSimulationAsync({
        problemIntensity,
        problemInflow,
        decisionStructure,
        accessStructure
      });

      const TOTAL_PROBLEMS = 20;
      const resolvedProblemShare = Math.max(0, Math.min(1, simResult.problemResolved / TOTAL_PROBLEMS));
      const unresolvedShare = 1 - resolvedProblemShare;
      const diagnosisWithShare = getDiagnosis(decisionStructure, accessStructure, unresolvedShare);
      document.getElementById('diagnosis-body').textContent = diagnosisWithShare.body;

      runBtn.hidden = true;
      drawViz(simResult);
      setTimeout(focusSimulationCanvas, 100);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = originalText;
    }
  };

  // Replay button — closure over scoring params
  document.getElementById('replay-btn').onclick = async function () {
    var replayBtn = document.getElementById('replay-btn');
    var originalText = replayBtn.textContent;
    replayBtn.disabled = true;
    replayBtn.textContent = 'Running simulation...';
    try {
      const newSim = await runGarbageCanSimulationAsync({
        problemIntensity,
        problemInflow,
        decisionStructure,
        accessStructure
      });
      drawViz(newSim);
      setTimeout(focusSimulationCanvas, 100);
    } finally {
      replayBtn.disabled = false;
      replayBtn.textContent = originalText;
    }
  };
});
