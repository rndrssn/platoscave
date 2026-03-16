'use strict';

/**
 * gc-diagnosis.js
 * Organised Anarchy — Diagnosis Lookup
 *
 * Exposes:
 *   DIAGNOSIS_CLUSTERS - maps decision/access combinations to cluster keys
 *   DIAGNOSES          - cluster diagnosis text
 *   getDiagnosis(decisionStructure, accessStructure, flight) - returns { title, body }
 *
 * @param {string} decisionStructure - 'unsegmented' | 'hierarchical' | 'specialized'
 * @param {string} accessStructure   - 'unsegmented' | 'hierarchical' | 'specialized'
 * @param {number} flight            - proportion of flight decisions (0–1), from simulation output
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
    body:  'Your organisation is what it believes itself to be. Problems reach the forums designed for them. Decisions are made by the people with the authority to make them. The instruments of traditional management (governance structures, reporting lines, sanctioned decision forums) are reasonably well matched to the work being done. The Garbage Can Model has limited explanatory power here. If this diagnosis surprises you, it is worth asking whether the questions captured the full complexity of your environment, or whether parts of your organisation are operating under different conditions than the ones you described. In organisations like yours, roughly {flight}% of decisions are made by resolution: the underlying problem is genuinely closed.',
  },
  'cluster-2': {
    title: 'The Complexity-Informed Organisation',
    body:  'Your organisation has rejected the decomposable worldview, at least in practice. Problems surface wherever they can find a forum. Participation is fluid and expertise-driven rather than seniority-driven. Decisions emerge from whoever is present and engaged rather than from sanctioned authority. This is not disorder \u2014 it is a different kind of order, one that the Garbage Can Model describes well. The risk here is not anarchy but invisibility: when everything is permeable, it becomes difficult to know which decisions were actually made, by whom, and whether the underlying problem was resolved or merely displaced. In organisations like yours, roughly {flight}% of decisions are made without the underlying problem being resolved.',
  },
  'cluster-3': {
    title: 'The Mix',
    body:  'Your organisation has inherited the instruments of a decomposable worldview: governance structures, reporting lines, sanctioned decision forums, capital allocation processes designed around predictable throughput. It applies them to a system that does not behave decomposably. Problems surface everywhere because the work itself is emergent \u2014 complex interactions between people, technology, and context that cannot be predicted from their parts. But decisions are made hierarchically, because the management frame requires it. The result is a permanent structural gap: problems live where the work is, decisions are made where the authority is, and the two rarely occupy the same room at the same time. This is not a communication problem. It is two incompatible beliefs about the nature of the system, operating simultaneously on the same organisation. In organisations like yours, roughly {flight}% of decisions are made without the underlying problem being resolved, not because of incompetence, but because the instruments were designed for a different kind of system.',
  },
  'cluster-4': {
    title: 'The Inverse Mix',
    body:  'Your organisation has open, fluid decision-making: in principle, anyone can weigh in, participation is not strictly governed by seniority. But the problems that reach decision forums are filtered before they arrive. Important issues that originate at the edges of the organisation (where the work actually happens) travel slowly or not at all toward the forums where they could be addressed. The people in the room are willing to decide. The problems that most need deciding rarely make it through the door. In organisations like yours, roughly {flight}% of decisions are made without the underlying problem being resolved. The forum was open, but the problem was elsewhere.',
  },
  'cluster-5': {
    title: 'The Siloed Organisation',
    body:  'Your organisation has partitioned itself: problems are assigned to designated channels, people are assigned to designated forums. On paper this looks like clarity. In practice it means that problems which do not fit their designated channel have nowhere to go. The work that falls between the silos (the integrations, the dependencies, the emergent issues that span functions) has no legitimate forum. It either disappears from view or creates informal decision-making that the organisation cannot see or govern. In organisations like yours, roughly {flight}% of decisions are made without the underlying problem being resolved. The problems most likely to go unresolved are the ones the structure was never designed to see.',
  },
};

function getDiagnosis(decisionStructure, accessStructure, flight) {
  const key        = `${decisionStructure}/${accessStructure}`;
  const clusterKey = DIAGNOSIS_CLUSTERS[key] || 'cluster-3';
  const cluster    = DIAGNOSES[clusterKey];
  const flightPct  = Math.round(flight * 100);
  return {
    title: cluster.title,
    body:  cluster.body.replace('{flight}', flightPct),
  };
}

if (typeof module !== 'undefined') {
  module.exports = { DIAGNOSIS_CLUSTERS, DIAGNOSES, getDiagnosis };
}
