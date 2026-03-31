'use strict';

const fs = require('fs');
const path = require('path');

const layoutUtilsSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper-layout-utils.js'),
  'utf8'
);
const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper.js'),
  'utf8'
);
const pageCssSource = fs.readFileSync(
  path.join(__dirname, '..', 'css', 'pages', 'mix-mapper.css'),
  'utf8'
);
const nodeUtilsModule = require('../modules/mix-mapper/mix-mapper-node-utils.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testNodeLabelWrappingContractInLayoutUtils() {
  assert(
    /--mix-map-node-label-max-lines/.test(layoutUtilsSource),
    'Expected layout to read node label max-lines setting'
  );
  assert(
    /function\s+wrapNodeLabelLines\s*\(textEl,\s*text,\s*maxWidth,\s*lineHeight,\s*maxLines\)\s*\{/.test(layoutUtilsSource),
    'Expected dedicated node label wrapping helper'
  );
  assert(
    /wrapNodeLabelLines\(labelNode,\s*baseText,\s*maxLabelWidth,\s*baseFont \* 1\.06,\s*maxLines\);/.test(layoutUtilsSource),
    'Expected node label fit to route through max-lines wrapping helper'
  );
  assert(
    /function\s+wrapNodeLabelLines\s*\([\s\S]*truncateTextWithEllipsis\(/.test(layoutUtilsSource),
    'Expected wrapped node labels to use ellipsis truncation rather than glyph stretching on overflow'
  );
}

function testNodeWidthResolverSupportsFixedWidthMode() {
  const nodeUtils = nodeUtilsModule.createNodeUtils({
    baseNodes: [
      {
        id: 'x1',
        lane: 'complexity',
        step: 1,
        title: 'Node',
        shortLabel: 'Very Long Label For Width Expansion Checks',
        description: 'Node description',
        tags: []
      }
    ],
    links: [],
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  });

  const fixedGeometry = nodeUtils.resolveNodeGeometry(
    {
      compact: false,
      nodeWidth: 120,
      nodeHeight: 40,
      laneGap: 220,
      fitContentNodeWidth: false
    },
    { nodeFontU: 11.4 }
  );

  const contentFitGeometry = nodeUtils.resolveNodeGeometry(
    {
      compact: false,
      nodeWidth: 120,
      nodeHeight: 40,
      laneGap: 220,
      fitContentNodeWidth: true
    },
    { nodeFontU: 11.4 }
  );

  assert(fixedGeometry.nodeWidth === 120, 'Expected fixed node width mode to keep configured width');
  assert(contentFitGeometry.nodeWidth >= 120, 'Expected content-fit mode not to shrink configured width');
  assert(contentFitGeometry.nodeWidth > fixedGeometry.nodeWidth, 'Expected content-fit mode to expand for long labels');
}

function testMobileNodeFontScalingTokenContract() {
  assert(
    /--mix-map-node-font-scale/.test(runtimeSource),
    'Expected runtime typography to read dedicated node font scale token'
  );
  assert(
    /--mix-map-node-font-scale:\s*1;/.test(pageCssSource),
    'Expected mix-mapper page CSS to define base node font scale token'
  );
  assert(
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*--mix-map-node-font-scale:\s*0\.(?:8[0-9]|9[0-9]?);/.test(pageCssSource),
    'Expected mobile breakpoint to tune node font scale token'
  );
  assert(
    /--mix-map-mobile-step-gap-scale/.test(layoutUtilsSource),
    'Expected layout to read dedicated mobile step gap scale token'
  );
  assert(
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*--mix-map-mobile-step-gap-scale:\s*1\.3;/.test(pageCssSource),
    'Expected mobile breakpoint to increase vertical node spacing via step-gap scale token'
  );
  assert(
    /--mix-map-learning-arc/.test(layoutUtilsSource) &&
      /--mix-map-feedback-arc/.test(layoutUtilsSource),
    'Expected layout to read token-driven arc radii for predictable curvature control'
  );
  assert(
    /--mix-map-learning-arc:\s*520;/.test(pageCssSource) &&
      /--mix-map-feedback-arc:\s*340;/.test(pageCssSource),
    'Expected desktop arc-radius tokens to be explicitly declared in page CSS'
  );
  assert(
    /--mix-map-desktop-arc-overflow/.test(layoutUtilsSource),
    'Expected layout to read desktop arc overflow token'
  );
  assert(
    /--mix-map-desktop-arc-overflow:\s*1;/.test(pageCssSource) &&
      /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*--mix-map-desktop-arc-overflow:\s*0;/.test(pageCssSource),
    'Expected desktop arc overflow token to enable on desktop and disable on mobile'
  );
}

function run() {
  testNodeLabelWrappingContractInLayoutUtils();
  testNodeWidthResolverSupportsFixedWidthMode();
  testMobileNodeFontScalingTokenContract();
  console.log('PASS: tests/test-mix-mapper-node-label-layout-contract.js');
}

run();
