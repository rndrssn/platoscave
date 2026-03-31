'use strict';

const assert = require('assert');
const { buildGcPressureNarrative } = require('../modules/garbage-can/runtime/gc-pressure-narrative.js');

const levels = ['light', 'moderate', 'heavy'];
const structures = ['unsegmented', 'hierarchical', 'specialized'];

let count = 0;
levels.forEach((intensity) => {
  levels.forEach((inflow) => {
    structures.forEach((decision) => {
      structures.forEach((access) => {
        const out = buildGcPressureNarrative(intensity, inflow, decision, access);
        assert(out && typeof out === 'object', 'expected object narrative');
        assert(out.problemSummary && out.problemSummary.length > 0, 'missing problem summary');
        assert(out.coordinationSummary && out.coordinationSummary.length > 0, 'missing coordination summary');
        assert(out.synthesis && out.synthesis.length > 0, 'missing synthesis');
        count++;
      });
    });
  });
});

assert.strictEqual(count, 81, 'expected 81 combinations');

const extremeHigh = buildGcPressureNarrative('heavy', 'heavy', 'specialized', 'specialized');
assert(/High/.test(extremeHigh.problemSummary), 'expected High problem pressure at heavy/heavy');
assert(/High/.test(extremeHigh.coordinationSummary), 'expected High coordination pressure at specialized/specialized');

const extremeLow = buildGcPressureNarrative('light', 'light', 'unsegmented', 'unsegmented');
assert(/Low/.test(extremeLow.problemSummary), 'expected Low problem pressure at light/light');
assert(/Low/.test(extremeLow.coordinationSummary), 'expected Low coordination pressure at unsegmented/unsegmented');

console.log('PASS: tests/test-gc-pressure-narrative.js');
