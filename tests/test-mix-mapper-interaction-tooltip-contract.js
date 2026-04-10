'use strict';

const fs = require('fs');
const path = require('path');

const rendererSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper-renderer.js'),
  'utf8'
);
const interactionsSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper-interactions.js'),
  'utf8'
);
const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper.js'),
  'utf8'
);
const cssSource = fs.readFileSync(
  path.join(__dirname, '..', 'css', 'pages', 'mix-mapper.css'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testHoverHitAreaIsIntentionallyLarge() {
  assert(
    /stroke-width',\s*Math\.max\(14,\s*layout\.edgePrimary \* 6\)/.test(rendererSource),
    'Expected dedicated hit-target path width for easier link hover interactions'
  );
  assert(
    /attr\('pointer-events',\s*'stroke'\)/.test(rendererSource),
    'Expected link hit-target paths to accept pointer events on stroke area'
  );
}

function testPointerTrackingOnHover() {
  assert(
    /var getLinkMode = deps\.getLinkMode \|\| function\(_link,\s*fallbackMode\)\s*\{\s*return fallbackMode \|\| getMode\(\);\s*\};/.test(interactionsSource),
    'Expected interactions module to support link-level mode resolution for tooltips and aria labels'
  );
  assert(
    /\.on\('mousemove',\s*function\(event,\s*node\)\s*\{\s*showTooltip\(tooltipHtml\(node\),\s*event\.clientX,\s*event\.clientY\);/s.test(interactionsSource),
    'Expected node tooltip to follow pointer on mousemove'
  );
  assert(
    /\.on\('mousemove',\s*function\(event,\s*link\)\s*\{\s*var modeForLink = getLinkMode\(link,\s*getMode\(\)\);\s*showTooltip\(linkTooltipHtml\(link,\s*modeForLink,\s*nodeById\),\s*event\.clientX,\s*event\.clientY\);/s.test(interactionsSource),
    'Expected link tooltip to follow pointer on mousemove using resolved per-link mode'
  );
  assert(
    /\.on\('click',\s*function\(event,\s*link\)\s*\{\s*var modeForLink = getLinkMode\(link,\s*getMode\(\)\);\s*showTooltip\(linkTooltipHtml\(link,\s*modeForLink,\s*nodeById\),\s*event\.clientX,\s*event\.clientY\);/s.test(interactionsSource),
    'Expected click fallback to show tooltip with resolved per-link mode at current pointer location'
  );
}

function testReadableTooltipPlacementInViewport() {
  assert(
    /var rightX = clientX \+ offsetX;[\s\S]*var leftX = clientX - tooltipWidth - offsetX;/.test(runtimeSource),
    'Expected horizontal placement candidates on both sides of pointer'
  );
  assert(
    /var belowY = clientY \+ offsetY;[\s\S]*var aboveY = clientY - tooltipHeight - offsetY;/.test(runtimeSource),
    'Expected vertical placement candidates above and below pointer'
  );
  assert(
    /if \(nextLeft \+ tooltipWidth > viewportWidth - viewportPad && leftX >= viewportPad\)/.test(runtimeSource),
    'Expected horizontal overflow guard before placing tooltip'
  );
  assert(
    /if \(nextTop \+ tooltipHeight > viewportHeight - viewportPad && aboveY >= viewportPad\)/.test(runtimeSource),
    'Expected vertical overflow guard before placing tooltip'
  );
  assert(
    /nextLeft = clamp\(nextLeft,\s*viewportPad,\s*viewportWidth - tooltipWidth - viewportPad\);/.test(runtimeSource) &&
      /nextTop = clamp\(nextTop,\s*viewportPad,\s*viewportHeight - tooltipHeight - viewportPad\);/.test(runtimeSource),
    'Expected final tooltip coordinates to be clamped inside viewport'
  );
}

function testTooltipReadabilityStylingContract() {
  assert(/\.mix-mapper-tooltip\s*\{/.test(cssSource), 'Expected dedicated tooltip style block');
  assert(/max-width:\s*14rem;/.test(cssSource), 'Expected bounded tooltip width for readability');
  assert(/line-height:\s*1\.48;/.test(cssSource), 'Expected readable tooltip line-height');
  assert(/font-size:\s*0\.6rem;/.test(cssSource), 'Expected small but explicit tooltip font size');
  assert(/\.mix-mapper-tooltip-header\s*\{/.test(cssSource), 'Expected tooltip header block class');
  assert(/\.mix-mapper-tooltip-lens--process/.test(cssSource), 'Expected lens colour variant for process mode');
  assert(/\.mix-mapper-tooltip-lens--assumptions/.test(cssSource), 'Expected lens colour variant for assumptions mode');
  assert(/\.mix-mapper-tooltip-lens--learning/.test(cssSource), 'Expected lens colour variant for learning mode');
}

function run() {
  testHoverHitAreaIsIntentionallyLarge();
  testPointerTrackingOnHover();
  testReadableTooltipPlacementInViewport();
  testTooltipReadabilityStylingContract();
  console.log('PASS: tests/test-mix-mapper-interaction-tooltip-contract.js');
}

run();
