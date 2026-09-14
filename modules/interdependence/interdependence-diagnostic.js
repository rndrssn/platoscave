// Interdependence diagnostic: classifies work structure, retraction, and boundary capacity from plain-language responses.
'use strict';

(function initInterdependenceDiagnostic(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  factory().init(root.document);
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildInterdependenceDiagnostic() {
  var COPY = {
    pooled: {
      title: 'Pooled work is dominant',
      body: 'The contributions mostly remain independent until they are combined. Use standards, clear ownership, and a final merge. Add stronger coordination when a named dependency requires it.'
    },
    sequential: {
      title: 'Sequential work is dominant',
      body: 'Known handoffs and their order matter, while earlier output usually remains usable. Stable interfaces, acceptance criteria, and flow management should carry most of the coordination load.'
    },
    sequentialRetractive: {
      title: 'Sequential work has retractive feedback',
      body: 'The primary flow is one-way, but downstream learning can invalidate upstream output. Put a fast feedback loop at the revision point. A sequential plan alone will understate rework risk.'
    },
    reciprocalAdditive: {
      title: 'Reciprocal work is mostly additive',
      body: 'The teams need repeated exchange, but earlier conclusions often remain usable. Maintain shared context and timely contact. Check which feedback actually changes an existing commitment.'
    },
    reciprocalRetractive: {
      title: 'Reciprocal-retractive work is dominant',
      body: 'The work repeatedly produces cross-boundary changes that invalidate prior commitments. Put decision rights, context, and revision records close to the work. Delayed escalation allows adjustment costs to accumulate as rework.'
    }
  };

  function average(values) {
    return values.length ? values.reduce(function(sum, value) { return sum + value; }, 0) / values.length : 0;
  }

  function scoreValue(value) {
    var numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(2, numeric)) : null;
  }

  function readScores(form) {
    var names = ['pooled', 'sequential', 'mutual', 'unknown', 'retraction', 'contention', 'rework', 'cadence', 'authority', 'context', 'record', 'integration'];
    var scores = {};
    names.forEach(function(name) {
      var selected = form.querySelector('input[name="' + name + '"]:checked');
      scores[name] = selected ? scoreValue(selected.value) : null;
    });
    return scores;
  }

  function classify(scores) {
    var reciprocal = average([scores.mutual, scores.unknown].filter(Number.isFinite));
    var retraction = average([scores.retraction, scores.contention, scores.rework].filter(Number.isFinite));
    var boundary = average([scores.cadence, scores.authority, scores.context, scores.record, scores.integration].filter(Number.isFinite));
    var pooled = scoreValue(scores.pooled);
    var sequential = scoreValue(scores.sequential);
    var structureAnswered = ['pooled', 'sequential', 'mutual', 'unknown', 'retraction', 'contention', 'rework']
      .filter(function(name) { return Number.isFinite(scores[name]); }).length;
    var boundaryAnswered = ['cadence', 'authority', 'context', 'record', 'integration']
      .filter(function(name) { return Number.isFinite(scores[name]); }).length;
    var kind = 'pooled';

    if (reciprocal >= 1 && retraction >= 1) {
      kind = 'reciprocalRetractive';
    } else if (reciprocal >= 1) {
      kind = 'reciprocalAdditive';
    } else if (retraction >= 1) {
      kind = 'sequentialRetractive';
    } else if (sequential !== null && (pooled === null || sequential >= pooled)) {
      kind = 'sequential';
    }

    return {
      kind: kind,
      reciprocal: reciprocal,
      retraction: retraction,
      boundary: boundary,
      structureAnswered: structureAnswered,
      boundaryAnswered: boundaryAnswered
    };
  }

  function boundaryLabel(result) {
    if (!result.boundaryAnswered) return 'Not scored';
    if (result.boundary >= 1.4) return 'Strong';
    if (result.boundary >= 0.75) return 'Partial';
    return 'Exposed';
  }

  function resultBody(result) {
    var copy = COPY[result.kind];
    if (!result.boundaryAnswered) return copy.body + ' Score Set 2 to test whether the current boundary can support this need.';
    if (result.kind === 'reciprocalRetractive' && result.boundary < 0.75) {
      return copy.body + ' The boundary is exposed: conflict visibility, authority, shared context, or revision records are too weak for the work described.';
    }
    if ((result.kind === 'reciprocalRetractive' || result.kind === 'sequentialRetractive') && result.boundary < 1.4) {
      return copy.body + ' The boundary only partly supports the adjustment. Find the first handoff where a contradiction can persist beyond its safe adjustment window.';
    }
    return copy.body + ' The boundary reading is ' + boundaryLabel(result).toLowerCase() + '; preserve that capacity as the work changes.';
  }

  function renderResult(doc, result) {
    var title = doc.getElementById('interdependence-result-title');
    var body = doc.getElementById('interdependence-result-body');
    var structureScore = doc.getElementById('interdependence-structure-score');
    var retractionScore = doc.getElementById('interdependence-retraction-score');
    var boundaryScore = doc.getElementById('interdependence-boundary-score');

    if (!result.structureAnswered) {
      if (title) title.textContent = 'Answer the questions above';
      if (body) body.textContent = 'The instrument will distinguish the structure of the work from the capacity of its current boundary.';
      if (structureScore) structureScore.textContent = '—';
      if (retractionScore) retractionScore.textContent = '—';
      if (boundaryScore) boundaryScore.textContent = '—';
      return;
    }

    if (title) title.textContent = COPY[result.kind].title;
    if (body) body.textContent = resultBody(result);
    if (structureScore) structureScore.textContent = result.reciprocal.toFixed(1) + ' / 2';
    if (retractionScore) retractionScore.textContent = result.retraction.toFixed(1) + ' / 2';
    if (boundaryScore) boundaryScore.textContent = boundaryLabel(result);
  }

  function init(doc) {
    if (!doc) return;
    var form = doc.getElementById('interdependence-assessment');
    if (!form) return;
    function update() {
      renderResult(doc, classify(readScores(form)));
    }
    form.addEventListener('change', update);
    update();
  }

  return { classify: classify, readScores: readScores, boundaryLabel: boundaryLabel, init: init };
}));
