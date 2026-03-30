'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper.js'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testProcessAndLearningRoleHelpersExist() {
  assert(/function\s+getProcessRole\s*\(link\)\s*\{/.test(source), 'Expected getProcessRole(link) helper');
  assert(/function\s+getLearningRole\s*\(link\)\s*\{/.test(source), 'Expected getLearningRole(link) helper');
  assert(
    /if\s*\(link\.kind === 'primary' && link\.lane === 'traditional'\)\s*return 'traditional-flow';/.test(source),
    'Expected process role mapping for traditional primary links'
  );
  assert(
    /if\s*\(link\.kind === 'primary' && link\.lane === 'complexity'\)\s*return 'complexity-flow';/.test(source),
    'Expected process role mapping for complexity primary links'
  );
  assert(
    /if\s*\(link\.lane === 'complexity' && \(link\.kind === 'feedback' \|\| link\.kind === 'learning'\)\)\s*return 'learning-loop';/.test(source),
    'Expected learning role mapping for complexity loops'
  );
  assert(
    /if\s*\(link\.lane === 'complexity' && link\.kind === 'primary'\)\s*return 'learning-support';/.test(source),
    'Expected learning role mapping for complexity primary support links'
  );
}

function testModeStyleUsesDedicatedProcessLearningPalette() {
  assert(/var processColor = COLORS\.processArrow;/.test(source), 'Expected process mode unified color token');
  assert(/marker:\s*'url\(#mix-map-arrow-process\)'/.test(source), 'Expected process arrow marker usage');
  assert(/var learningColor = COLORS\.learningArrow;/.test(source), 'Expected learning mode unified color token');
  assert(/marker:\s*'url\(#mix-map-arrow-learning\)'/.test(source), 'Expected learning arrow marker usage');
}

function testPulseMotionIsDimensionAware() {
  assert(/function\s+pulseDistancePx\s*\(elapsedMs,\s*link,\s*idx,\s*mode\)\s*\{/.test(source), 'Expected pulseDistancePx helper');
  assert(
    /var distancePx = pulseDistancePx\(elapsed,\s*link,\s*idx,\s*state\.mode\);/.test(source),
    'Expected bindPulseAnimation to use pulseDistancePx'
  );
  assert(
    /getPointAtLength\(distancePx\)/.test(source),
    'Expected point sampling by absolute distance'
  );
  assert(
    !/t\s*\*\s*link\.__pathLength/.test(source),
    'Legacy fractional-path pulse motion still present'
  );
}

function testPulseCoverageAndMarkerDefinitions() {
  assert(
    /\.data\(LINKS,\s*function\(link\)/.test(source),
    'Expected pulse circles to bind to full LINKS set'
  );
  assert(
    /makeMarker\(defs,\s*'mix-map-arrow-process',\s*COLORS\.processArrow\);/.test(source),
    'Expected process marker definition'
  );
  assert(
    /makeMarker\(defs,\s*'mix-map-arrow-learning',\s*COLORS\.learningArrow\);/.test(source),
    'Expected learning marker definition'
  );
}

function testModeHelperCopyBindingExists() {
  assert(/var\s+MODE_HELPER_TEXT\s*=\s*\{/.test(source), 'Expected MODE_HELPER_TEXT map');
  assert(/function\s+setModeHelperText\s*\(mode\)\s*\{/.test(source), 'Expected setModeHelperText(mode) helper');
  assert(/setModeHelperText\(mode\);/.test(source), 'Expected applyMode to update helper copy');
}

function testPulseContextIsSuppressedByMode() {
  assert(
    /if\s*\(mode === 'process'\)\s*\{[\s\S]*?return 0;\s*\}/.test(source),
    'Expected process mode pulse logic to be disabled'
  );
  assert(
    /if\s*\(mode === 'assumptions'\)\s*\{[\s\S]*return 0;\s*\}/.test(source),
    'Expected assumptions mode pulse logic to be disabled'
  );
  assert(
    /if\s*\(mode === 'learning'\)\s*\{[\s\S]*return 0;\s*\}/.test(source),
    'Expected learning pulse logic to suppress non-learning links'
  );
}

function run() {
  testProcessAndLearningRoleHelpersExist();
  testModeStyleUsesDedicatedProcessLearningPalette();
  testPulseMotionIsDimensionAware();
  testPulseCoverageAndMarkerDefinitions();
  testModeHelperCopyBindingExists();
  testPulseContextIsSuppressedByMode();
  console.log('PASS: tests/test-mix-mapper-mode-motion-contract.js');
}

run();
