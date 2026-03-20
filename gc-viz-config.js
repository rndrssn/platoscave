'use strict';

// Shared configuration for GC visualization sizing and behavior.
const GC_VIZ_CONFIG = Object.freeze({
  defaults: Object.freeze({
    choices: 10,
    problems: 20,
    periods: 20,
    textScale: 'default',
  }),
  textScale: Object.freeze({
    compact: 0.9,
    default: 1,
    large: 1.12,
  }),
  layout: Object.freeze({
    empty: Object.freeze({
      svgW: 900,
      choiceRadius: 36,
      padH: 55,
      squareTop: 102,
      bottomLegendPad: 66,
      bottomLegendOffset: 56,
      enteringOffset: -32,
    }),
    live: Object.freeze({
      svgW: 900,
      choiceRadius: 36,
      padH: 35,
      squareTop: 108,
      bottomLegendPad: 74,
      bottomLegendOffset: 56,
      floatY0Offset: -36,
      floatY1Offset: -14,
    }),
  }),
});

if (typeof window !== 'undefined') {
  window.GC_VIZ_CONFIG = GC_VIZ_CONFIG;
}

if (typeof module !== 'undefined') {
  module.exports = { GC_VIZ_CONFIG };
}
