'use strict';

/**
 * gc-diagnosis.js
 * Organised Anarchy — Diagnosis Lookup
 *
 * Exposes:
 *   DIAGNOSIS_CLUSTERS - maps decision/access combinations to cluster keys
 *   DIAGNOSES          - cluster diagnosis text
 *   getDiagnosis(decisionStructure, accessStructure, unresolvedShare) - returns { title, body }
 *
 * @param {string} decisionStructure - 'unsegmented' | 'hierarchical' | 'specialized'
 * @param {string} accessStructure   - 'unsegmented' | 'hierarchical' | 'specialized'
 * @param {number} unresolvedShare   - proportion of unresolved problems (0–1), from simulation output
 * @returns {{ title: string, body: string }}
 */

const DIAGNOSIS_CLUSTERS = {
  'unsegmented/unsegmented':  'cluster-2',
  'unsegmented/hierarchical': 'cluster-4',
  'unsegmented/specialized':  'cluster-4',
  'hierarchical/hierarchical':'cluster-1',
  'hierarchical/unsegmented': 'cluster-3',
  'hierarchical/specialized': 'cluster-3',
  'specialized/specialized':  'cluster-5',
  'specialized/hierarchical': 'cluster-3',  // intentional: hierarchical access is the dominant constraint — biased toward The Mix, not The Siloed Organisation
  'specialized/unsegmented':  'cluster-4',
};

const DIAGNOSES = {
  'cluster-1': {
    title: 'The Coherent Traditional Organisation',
    body:  'Your organisation shows a coherent traditional pattern. Problems usually reach the relevant choice opportunities, and decisions are mostly made where formal authority sits. This alignment keeps decision flow relatively stable across iterations. In organisations like yours, roughly {resolved}% of problems are genuinely resolved.',
  },
  'cluster-2': {
    title: 'The Complexity-Informed Organisation',
    body:  'Your organisation shows a complexity-informed pattern. Problems and participants move fluidly across choice opportunities, so decisions emerge from who is present and engaged. This increases adaptability but can reduce traceability of who decided what and whether a problem was resolved or displaced. In organisations like yours, roughly {unresolved}% of problems remain unresolved.',
  },
  'cluster-3': {
    title: 'The Mix',
    body:  'Your organisation shows a Mix pattern. Problems surface broadly, but decision authority remains concentrated in hierarchical choice opportunities. This creates a repeated mismatch between where problems appear and where closure can happen. In organisations like yours, roughly {unresolved}% of problems remain unresolved because structural fit is low.',
  },
  'cluster-4': {
    title: 'The Inverse Mix',
    body:  'Your organisation shows an Inverse Mix pattern. Participation in decisions is relatively open, but problem access to choice opportunities is filtered. This means willing decision makers can be present while high-need problems arrive late or not at all. In organisations like yours, roughly {unresolved}% of problems remain unresolved.',
  },
  'cluster-5': {
    title: 'The Siloed Organisation',
    body:  'Your organisation shows a siloed pattern. Problems and participants are both routed into specialized choice opportunities. This supports local clarity but weakens handling of cross-boundary issues that do not fit a single channel. In organisations like yours, roughly {unresolved}% of problems remain unresolved.',
  },
};

function getDiagnosis(decisionStructure, accessStructure, unresolvedShare) {
  const key        = `${decisionStructure}/${accessStructure}`;
  const clusterKey = DIAGNOSIS_CLUSTERS[key] || 'cluster-3';
  const cluster    = DIAGNOSES[clusterKey];
  const unresolvedPct = Math.round(unresolvedShare * 100);
  const resolvedPct = Math.max(0, 100 - unresolvedPct);
  return {
    title: cluster.title,
    body:  cluster.body
      .replace('{resolved}', resolvedPct)
      .replace('{unresolved}', unresolvedPct),
  };
}

/**
 * getDiagnosisPreview(body)
 * Strips the trailing simulation-dependent sentence from a diagnosis body,
 * for display before a simulation result is available.
 * Owned here because the regex is coupled to the exact text in DIAGNOSES above.
 */
function getDiagnosisPreview(body) {
  return body.replace(/In organisations like yours, roughly.*$/, '').trim();
}

if (typeof module !== 'undefined') {
  module.exports = { DIAGNOSIS_CLUSTERS, DIAGNOSES, getDiagnosis, getDiagnosisPreview };
}
