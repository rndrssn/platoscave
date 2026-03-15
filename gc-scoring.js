'use strict';

/**
 * gc-scoring.js
 * Organised Anarchy — Scoring Logic
 *
 * Converts survey responses into simulation parameters for the Garbage Can Model.
 * Exposes one function: scoreResponses(responses)
 *
 * Question order (8 questions, integers 1–5):
 *
 *   Energy load (problematic preferences, unclear technology, fluid participation):
 *   [0] "Our strategic goals shift faster than our plans can keep up with."
 *       1 = stable goals  →  5 = goals in constant flux
 *   [1] "How work actually gets done here is more a matter of judgement than established process."
 *       1 = clear process  →  5 = improvised judgement
 *   [2] "The people involved in any given decision vary significantly from one conversation to the next."
 *       1 = same people every time  →  5 = different people every time
 *
 *   Decision structure (who attends which choice opportunities):
 *   [3] "Participation in decisions is open to anyone with relevant knowledge, regardless of their level."
 *       1 = tightly restricted  →  5 = fully open        (openness dimension)
 *   [4] "Participation in decisions is primarily determined by seniority or title."
 *       1 = title irrelevant  →  5 = title determines access  (hierarchy dimension)
 *
 *   Access structure (which problems reach which forums):
 *   [5] "Problems and topics tend to surface in whatever forum happens to be meeting,
 *        rather than a specifically designated one."
 *       1 = problems go to the right place  →  5 = problems float freely  (openness dimension)
 *   [6] "Clear conventions exist about which types of problems belong in which meetings."
 *       1 = no clear conventions  →  5 = clear structured routing          (structure dimension)
 *   [7] "When a significant problem arises, it gets escalated through levels rather than
 *        going directly to the right forum."
 *       1 = direct routing  →  5 = escalation-based routing  (hierarchy dimension)
 */

// ─── Thresholds ───────────────────────────────────────────────────────────────

const ENERGY_LIGHT_MAX    = 7  / 3;  // ≤ 2.33 → light
const ENERGY_MODERATE_MAX = 11 / 3;  // ≤ 3.67 → moderate, else heavy

const OPEN_MIN = 3.5;   // openness score ≥ this → unsegmented
const HIER_MIN = 3.5;   // hierarchy score ≥ this → hierarchical (otherwise specialized)

// ─── Classifiers ─────────────────────────────────────────────────────────────

function classifyEnergy(raw) {
  if (raw <= ENERGY_LIGHT_MAX)    return 'light';
  if (raw <= ENERGY_MODERATE_MAX) return 'moderate';
  return 'heavy';
}

/**
 * Classify a structure dimension into one of three simulation parameters.
 * openness  high → unsegmented  (everyone accesses everything)
 * openness  low + hierarchy high → hierarchical (rank-based access)
 * openness  low + hierarchy low  → specialized  (narrow, role-specific access)
 */
function classifyStructure(openness, hierarchy) {
  if (openness  >= OPEN_MIN) return 'unsegmented';
  if (hierarchy >= HIER_MIN) return 'hierarchical';
  return 'specialized';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Score an array of 8 survey responses.
 *
 * @param {number[]} responses - Array of exactly 8 integers, each 1–5
 * @returns {{
 *   energyLoad:        'light'|'moderate'|'heavy',
 *   decisionStructure: 'unsegmented'|'hierarchical'|'specialized',
 *   accessStructure:   'unsegmented'|'hierarchical'|'specialized',
 *   raw: { energyScore: number, decisionScore: number, accessScore: number }
 * }}
 */
function scoreResponses(responses) {
  if (!Array.isArray(responses) || responses.length !== 8) {
    throw new Error('scoreResponses expects exactly 8 responses (integers 1–5).');
  }

  const [q0, q1, q2, q3, q4, q5, q6, q7] = responses;

  const energyScore   = (q0 + q1 + q2) / 3;
  const decisionScore = q3;               // openness — used for continuous positioning
  const accessScore   = q5;               // openness — used for continuous positioning

  return {
    energyLoad:        classifyEnergy(energyScore),
    decisionStructure: classifyStructure(q3, q4),
    accessStructure:   classifyStructure(q5, q7),
    raw: {
      energyScore,
      decisionScore,
      accessScore,
    },
  };
}

if (typeof module !== 'undefined') {
  module.exports = { scoreResponses };
}
