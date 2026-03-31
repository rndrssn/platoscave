'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper-layout-utils.js'),
  'utf8'
);

const layoutUtilsModule = require('../modules/mix-mapper/mix-mapper-layout-utils.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testLaneHeaderFontReduction() {
  assert(
    /laneTitleSize:\s*\(compact \? 17 : 20\) \* 0\.7,/.test(source),
    'Expected lane title size to be reduced by 30%'
  );
  assert(
    /laneSubtitleSize:\s*\(compact \? 11\.5 : 13\) \* 0\.7,/.test(source),
    'Expected lane subtitle size to be reduced by 30%'
  );
}

function testLaneHeaderFitHelperExists() {
  assert(
    /function\s+layoutLaneHeaderText\s*\(titleSel,\s*subtitleSel,\s*layout,\s*laneTitle,\s*laneSubtitle\)\s*\{/.test(source),
    'Expected layoutLaneHeaderText helper'
  );
  assert(
    /wrapTextToWidth\(this,\s*laneTitle,\s*laneTextWidth,\s*titleLineHeight\);/.test(source),
    'Expected lane title wrapping logic'
  );
  assert(
    /wrapTextToWidth\(this,\s*laneSubtitle,\s*laneTextWidth,\s*subtitleLineHeight\);/.test(source),
    'Expected lane subtitle wrapping logic'
  );
}

function testLayoutUtilsExportSurface() {
  assert(typeof layoutUtilsModule.createLayoutUtils === 'function', 'Expected createLayoutUtils export');
  const layoutUtils = layoutUtilsModule.createLayoutUtils({
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    readScopedCssNumber: (_name, fallback) => fallback,
    getColors: () => ({ muted: '#5C4F3A', gold: '#B8943A' })
  });
  assert(typeof layoutUtils.layoutLaneHeaderText === 'function', 'Expected layoutLaneHeaderText helper on layout utils');
}

function testLaneHeaderOverlapDetectionExists() {
  assert(
    /var overlapsTitle =/.test(source),
    'Expected overlap detection between title and subtitle'
  );
  assert(
    /var spillsIntoNodes =/.test(source),
    'Expected overflow detection for lane subtitle region'
  );
}

function run() {
  testLaneHeaderFontReduction();
  testLaneHeaderFitHelperExists();
  testLaneHeaderOverlapDetectionExists();
  testLayoutUtilsExportSurface();
  console.log('PASS: tests/test-mix-mapper-lane-header-fit-contract.js');
}

run();
