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

function testTypographyHelperAndDefaults() {
  assert(
    /function\s+readTypographySize\s*\(typography,\s*key,\s*fallback\)\s*\{/.test(source),
    'Expected centralized typography size helper'
  );
  assert(
    /laneTitleSize:\s*compact \? 13\.6 : 14\.8,/.test(source),
    'Expected lane title fallback size near shared viz typography baseline'
  );
  assert(
    /laneSubtitleSize:\s*compact \? 10\.6 : 11\.6,/.test(source),
    'Expected lane subtitle fallback size near shared viz typography baseline'
  );
  assert(
    /compareLabelSize:\s*compact \? 9\.8 : 10\.8,/.test(source),
    'Expected comparison label fallback size near shared viz typography baseline'
  );
}

function testLaneHeaderFitHelperExists() {
  assert(
    /function\s+layoutLaneHeaderText\s*\(titleSel,\s*subtitleSel,\s*layout,\s*laneTitle,\s*laneSubtitle,\s*typography\)\s*\{/.test(source),
    'Expected typography-aware layoutLaneHeaderText helper'
  );
  assert(
    /wrapTextToWidth\(this,\s*laneTitle,\s*laneTextWidth,\s*titleLineHeight\);/.test(source),
    'Expected lane title wrapping logic'
  );
  assert(
    /wrapTextToWidth\(this,\s*laneSubtitle,\s*laneTextWidth,\s*subtitleLineHeight\);/.test(source),
    'Expected lane subtitle wrapping logic'
  );
  assert(
    /readTypographySize\(typography,\s*'laneTitleFontU',\s*layout\.laneTitleSize\)/.test(source),
    'Expected lane title sizing to allow runtime typography override'
  );
  assert(
    /readTypographySize\(typography,\s*'laneSubtitleFontU',\s*layout\.laneSubtitleSize\)/.test(source),
    'Expected lane subtitle sizing to allow runtime typography override'
  );
}

function testComparisonTypographyOverrideExists() {
  assert(
    /function\s+layoutComparisonLabels\s*\(labelSel,\s*layout,\s*nodeById,\s*compareLineStart,\s*compareLineEnd,\s*typography\)\s*\{/.test(source),
    'Expected typography-aware comparison label layout helper'
  );
  assert(
    /readTypographySize\(typography,\s*'compareFontU',\s*layout\.compareLabelSize/.test(source),
    'Expected comparison label size to allow runtime typography override'
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
  assert(
    /text-anchor',\s*'start'/.test(source),
    'Expected lane header text to use left alignment'
  );
}

function run() {
  testTypographyHelperAndDefaults();
  testLaneHeaderFitHelperExists();
  testComparisonTypographyOverrideExists();
  testLaneHeaderOverlapDetectionExists();
  testLayoutUtilsExportSurface();
  console.log('PASS: tests/test-mix-mapper-lane-header-fit-contract.js');
}

run();
