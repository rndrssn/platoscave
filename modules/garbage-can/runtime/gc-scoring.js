'use strict';

/**
 * gc-scoring.js
 * Organised Anarchy — Scoring Logic
 *
 * Converts 12 survey responses into simulation parameters for the Garbage Can Model.
 * Exposes one function: scoreResponses(responses)
 *
 * Question order (12 questions, integers 1–5):
 *
 *   Energy load (Q1–Q5, indices 0–4) — mean of five raw scores:
 *   [0] Goals shift often enough that work started under one priority gets abandoned for another.
 *   [1] If you asked three colleagues how a decision gets made, you'd get three different answers.
 *   [2] Organisation carries a backlog of unresolved issues no one has the mandate to close.
 *   [3] Institutional memory lives in people's heads rather than anywhere reliably accessible.
 *   [4] Hard to point to a decision made this year that definitively closed a problem.
 *
 *   Access structure (Q6–Q8, indices 5–7):
 *   [5] Problems tend to find their way to the right people and the right forum.
 *       (INVERTED: 6 − raw, because agreement = good routing = unsegmented)
 *   [6] Who hears about a problem depends more on who raised it than on who should deal with it.
 *   [7] Organisation has forums for making decisions but it is rarely clear which forum owns which problem.
 *
 *   Decision structure (Q9–Q12, indices 8–11) — mean of four raw scores:
 *   [8]  Seniority determines who gets a seat at the table more than relevance to the problem.
 *   [9]  The people closest to a problem are rarely the ones who decide how it gets resolved.
 *   [10] The people with the most relevant expertise are often not the ones with the final say.
 *   [11] Decisions are often announced rather than made — the real decision happened somewhere else.
 *
 * Thresholds:
 *   Energy:    ≤2.0 → light,       ≤3.5 → moderate,     else heavy
 *   Structure: ≤2.0 → unsegmented, ≤3.5 → hierarchical, else specialized
 */

// ─── Classifiers ─────────────────────────────────────────────────────────────

function classifyEnergy(mean) {
  if (mean <= 2.0) return 'light';
  if (mean <= 3.5) return 'moderate';
  return 'heavy';
}

function classifyStructure12(mean) {
  if (mean <= 2.0) return 'unsegmented';
  if (mean <= 3.5) return 'hierarchical';
  return 'specialized';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Score an array of 12 survey responses.
 *
 * @param {number[]} responses - Array of exactly 12 integers, each 1–5
 * @returns {{
 *   energyLoad:        'light'|'moderate'|'heavy',
 *   decisionStructure: 'unsegmented'|'hierarchical'|'specialized',
 *   accessStructure:   'unsegmented'|'hierarchical'|'specialized',
 *   raw: { energyScore: number, decisionScore: number, accessScore: number }
 * }}
 */
function scoreResponses(responses) {
  if (!Array.isArray(responses) || responses.length !== 12) {
    throw new Error('scoreResponses expects exactly 12 responses (integers 1–5).');
  }

  const q6inv       = 6 - responses[5];  // invert question 6
  const energyScore   = (responses[0] + responses[1] + responses[2] + responses[3] + responses[4]) / 5;
  const accessScore   = (q6inv + responses[6] + responses[7]) / 3;
  const decisionScore = (responses[8] + responses[9] + responses[10] + responses[11]) / 4;

  return {
    energyLoad:        classifyEnergy(energyScore),
    decisionStructure: classifyStructure12(decisionScore),
    accessStructure:   classifyStructure12(accessScore),
    raw: { energyScore, decisionScore, accessScore },
  };
}

if (typeof module !== 'undefined') {
  module.exports = { scoreResponses };
}
