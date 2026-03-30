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

function testComplexityNarrativeMapExists() {
  assert(
    /var\s+COMPLEXITY_LINK_NARRATIVES\s*=\s*\{/.test(source),
    'Expected COMPLEXITY_LINK_NARRATIVES map'
  );
  assert(
    /'c6>c1:learning'\s*:\s*\{/.test(source),
    'Expected c6>c1 learning narrative entry'
  );
  assert(
    /Assumes post-launch evidence is captured and used to reshape upstream opportunity sensing\./.test(source),
    'Expected explicit assumptions narrative for launch-to-sensing learning loop'
  );
}

function testLinkNarrativeHelpersExist() {
  assert(/function\s+defaultLinkNarrative\s*\(link,\s*mode\)\s*\{/.test(source), 'Expected defaultLinkNarrative helper');
  assert(/function\s+complexityLinkNarrative\s*\(link,\s*mode\)\s*\{/.test(source), 'Expected complexityLinkNarrative helper');
  assert(/function\s+linkTooltipHtml\s*\(link,\s*mode,\s*nodeById\)\s*\{/.test(source), 'Expected linkTooltipHtml helper');
  assert(/function\s+linkAriaLabel\s*\(link,\s*mode,\s*nodeById\)\s*\{/.test(source), 'Expected linkAriaLabel helper');
}

function testLinksAreInteractive() {
  assert(
    /\.attr\('role',\s*'button'\)/.test(source),
    'Expected links to expose button role'
  );
  assert(
    /\.attr\('tabindex',\s*0\)/.test(source),
    'Expected links to be keyboard focusable'
  );
  assert(
    /\.on\('mousemove',\s*function\(event,\s*link\)\s*\{[\s\S]*linkTooltipHtml\(link,\s*state\.mode,\s*nodeById\)/.test(source),
    'Expected link mousemove to show mode-aware tooltip'
  );
  assert(
    /\.on\('focus',\s*function\(event,\s*link\)\s*\{[\s\S]*showTooltip\(/.test(source),
    'Expected link focus to show tooltip'
  );
}

function testAriaLabelsUpdateByMode() {
  assert(/function\s+updateLinkAriaLabels\s*\(mode\)\s*\{/.test(source), 'Expected updateLinkAriaLabels helper');
  assert(/updateLinkAriaLabels\(mode\);/.test(source), 'Expected applyMode to refresh link aria labels');
}

function run() {
  testComplexityNarrativeMapExists();
  testLinkNarrativeHelpersExist();
  testLinksAreInteractive();
  testAriaLabelsUpdateByMode();
  console.log('PASS: tests/test-mix-mapper-link-narratives-contract.js');
}

run();
