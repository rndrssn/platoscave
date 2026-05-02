'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  calculateMM1,
  calculateKingman,
} = require(path.join(__dirname, '..', 'modules', 'flow-queuing', 'flow-queuing-model.js'));

const source = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'flow-queuing', 'flow-queuing.js'),
  'utf8'
);

// Slider bounds from explore/index.html
const BOUNDS = {
  arrivalRate: { min: 0.10, max: 0.98 },
  serviceRate:  { min: 0.50, max: 1.20 },
  cv:           { min: 0.00, max: 2.00 },
};

// Expected preset values — must stay in sync with PRESET_VALUES in flow-queuing.js
const PRESETS = {
  breathing: { arrivalRate: 0.48, serviceRate: 1.00, arrivalCv: 0.70, serviceCv: 0.80 },
  strained:  { arrivalRate: 0.78, serviceRate: 1.00, arrivalCv: 1.00, serviceCv: 1.00 },
  saturated: { arrivalRate: 0.94, serviceRate: 1.00, arrivalCv: 1.00, serviceCv: 1.00 },
  bursty:    { arrivalRate: 0.72, serviceRate: 1.00, arrivalCv: 1.65, serviceCv: 1.80 },
};

// 1. All preset values must be within slider bounds
Object.entries(PRESETS).forEach(function checkBounds([name, p]) {
  assert(
    p.arrivalRate >= BOUNDS.arrivalRate.min && p.arrivalRate <= BOUNDS.arrivalRate.max,
    'Preset ' + name + ': arrivalRate ' + p.arrivalRate + ' outside slider range'
  );
  assert(
    p.serviceRate >= BOUNDS.serviceRate.min && p.serviceRate <= BOUNDS.serviceRate.max,
    'Preset ' + name + ': serviceRate ' + p.serviceRate + ' outside slider range'
  );
  assert(
    p.arrivalCv >= BOUNDS.cv.min && p.arrivalCv <= BOUNDS.cv.max,
    'Preset ' + name + ': arrivalCv ' + p.arrivalCv + ' outside slider range'
  );
  assert(
    p.serviceCv >= BOUNDS.cv.min && p.serviceCv <= BOUNDS.cv.max,
    'Preset ' + name + ': serviceCv ' + p.serviceCv + ' outside slider range'
  );
});

// 2. All presets must produce a stable queue
Object.entries(PRESETS).forEach(function checkStability([name, p]) {
  const mm1 = calculateMM1({ arrivalRate: p.arrivalRate, serviceRate: p.serviceRate });
  assert.strictEqual(mm1.stable, true, 'Preset ' + name + ': must be stable (rho < 1)');
});

// 3. M/M/1 and Kingman readouts converge at Ca = Cs = 1 for all presets
Object.entries(PRESETS).forEach(function checkConvergence([name, p]) {
  const mm1     = calculateMM1({ arrivalRate: p.arrivalRate, serviceRate: p.serviceRate });
  const kingman = calculateKingman({ arrivalRate: p.arrivalRate, serviceRate: p.serviceRate, arrivalCv: 1, serviceCv: 1 });
  assert(
    Math.abs(mm1.systemLeadTime - kingman.systemLeadTime) < 1e-9,
    'Preset ' + name + ': M/M/1 and Kingman lead time must agree at Ca=Cs=1'
  );
});

// 4. Reseed-on-re-click contract (CLAUDE.md): re-clicking the active preset
//    reseeds local variability; the source must contain the guard and reassignment
assert(
  source.includes('preset === activePreset'),
  'Reseed contract: source must check preset === activePreset before reseeding'
);
assert(
  source.includes('sessionSeed = Math.random()'),
  'Reseed contract: source must reassign sessionSeed on re-click'
);

// 5. DISPLAY_ITEM_SCALE must be defined and equal 6
const scaleMatch = source.match(/DISPLAY_ITEM_SCALE\s*=\s*(\d+)/);
assert(scaleMatch, 'DISPLAY_ITEM_SCALE constant must be defined in flow-queuing.js');
assert.strictEqual(Number(scaleMatch[1]), 6, 'DISPLAY_ITEM_SCALE must equal 6');

// 6. updateStatus threshold boundaries must be present
assert(
  source.includes('utilization < 0.75'),
  'updateStatus: must contain 0.75 low-utilization boundary'
);
assert(
  source.includes('utilization >= 0.75'),
  'updateStatus: must contain 0.75 strained boundary'
);
assert(
  source.includes('utilization >= 0.9'),
  'updateStatus: must contain 0.9 near-saturation boundary'
);

// 7. Preset keys present in source (guards against silent rename of preset names).
// Keys appear as bare identifiers (breathing:) or quoted strings.
Object.keys(PRESETS).forEach(function checkPresetKey(name) {
  assert(
    source.includes(name + ':')
      || source.includes('"' + name + '"')
      || source.includes("'" + name + "'"),
    'Preset key "' + name + '" must appear in flow-queuing.js source'
  );
});

console.log('PASS: tests/test-flow-queuing-explore-contract.js');
