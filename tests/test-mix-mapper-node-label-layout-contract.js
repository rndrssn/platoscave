'use strict';

const fs = require('fs');
const path = require('path');

const layoutUtilsSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'learning-feedback', 'mix-mapper-layout-utils.js'),
  'utf8'
);
const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'learning-feedback', 'mix-mapper.js'),
  'utf8'
);
const pageCssSource = fs.readFileSync(
  path.join(__dirname, '..', 'css', 'pages', 'mix-mapper.css'),
  'utf8'
);
const layoutUtilsModule = require('../modules/learning-feedback/mix-mapper-layout-utils.js');
const nodeUtilsModule = require('../modules/learning-feedback/mix-mapper-node-utils.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testNodeLabelWrappingContractInLayoutUtils() {
  assert(
    /--mix-map-node-label-max-lines/.test(layoutUtilsSource),
    'Expected layout to read node label max-lines setting'
  );
  assert(
    /function\s+wrapNodeLabelLines\s*\(textEl,\s*text,\s*maxWidth,\s*lineHeight,\s*maxLines/.test(layoutUtilsSource),
    'Expected dedicated node label wrapping helper'
  );
  assert(
    /wrapNodeLabelLines\(labelNode,\s*baseText,\s*maxLabelWidth,\s*baseFont \* 1\.06,\s*maxLines/.test(layoutUtilsSource),
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
    /--mix-map-mobile-compaction:\s*0;/.test(pageCssSource) &&
      /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*--mix-map-mobile-compaction:\s*1;/.test(pageCssSource),
    'Expected aggressive layout compaction to be explicitly gated to the mobile breakpoint'
  );
  assert(
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*--mix-map-fs-node-px:\s*7\.05px;/.test(pageCssSource),
    'Expected mobile breakpoint to reduce node label size by 25 percent'
  );
  assert(
    /nodeMinPx\s*=\s*layout\s*&&\s*layout\.mobileCompaction\s*\?\s*5\.8/.test(runtimeSource),
    'Expected runtime node label clamp to allow the reduced mobile label size'
  );
  assert(
    /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*--mix-map-fs-lane-title-px:\s*8\.4px;[\s\S]*--mix-map-fs-lane-subtitle-px:\s*6\.9px;/.test(pageCssSource),
    'Expected mobile breakpoint to reduce lane header text size by 25 percent'
  );
  assert(
    /layout\s*&&\s*layout\.mobileCompaction\s*\?\s*7\s*:\s*11\.2/.test(runtimeSource) &&
      /layout\s*&&\s*layout\.mobileCompaction\s*\?\s*6\.2\s*:\s*10/.test(runtimeSource),
    'Expected runtime lane header clamps to allow the reduced mobile header sizes'
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

function testMobileLayoutCompactionContract() {
  const cssValues = {
    '--mix-map-lane-gap-scale': 1.38,
    '--mix-map-node-width-scale': 0.54,
    '--mix-map-node-height-scale': 0.76,
    '--mix-map-mobile-compaction': 1,
    '--mix-map-mobile-step-gap-scale': 1.3,
    '--mix-map-learning-arc': 190,
    '--mix-map-feedback-arc': 126,
    '--mix-map-desktop-arc-overflow': 0
  };
  const layoutUtils = layoutUtilsModule.createLayoutUtils({
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    readScopedCssNumber: (name, fallback) => Object.prototype.hasOwnProperty.call(cssValues, name) ? cssValues[name] : fallback,
    getColors: () => ({ muted: '#5C4F3A', gold: '#B8943A' })
  });
  const layout = layoutUtils.getLayout({ clientWidth: 390 });

  assert(layout.compact === true, 'Expected narrow shell to use compact layout');
  assert(layout.mobileCompaction === true, 'Expected mobile CSS breakpoint to opt into aggressive compaction');
  assert(layout.height <= 640, 'Expected compact mobile viewBox height to stay vertically compressed');
  assert(layout.stepGap >= 48 && layout.stepGap <= 70, 'Expected compact mobile node spacing to be reduced without collapsing rows');
  assert(layout.nodeWidth <= 90, 'Expected compact mobile nodes to narrow further after mobile text reduction');
  assert(layout.topY >= 146, 'Expected compact first node to leave header clearance');
}

function testDesktopLayoutPreservationContract() {
  const layoutUtils = layoutUtilsModule.createLayoutUtils({
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    readScopedCssNumber: (_name, fallback) => fallback,
    getColors: () => ({ muted: '#5C4F3A', gold: '#B8943A' })
  });
  const layout = layoutUtils.getLayout({ clientWidth: 980 });

  assert(layout.compact === false, 'Expected desktop shell to keep non-compact layout');
  assert(layout.height === 990, 'Expected desktop viewBox height to remain at the pre-mobile-pass size');
  assert(layout.topY === 140, 'Expected desktop first node position to remain unchanged');
  assert(layout.nodeWidth === 196, 'Expected desktop node width to remain unchanged');
  assert(layout.laneGap === 304, 'Expected desktop lane spacing to remain unchanged');
  assert(layout.stepGap > 90 && layout.stepGap < 91, 'Expected desktop vertical spacing to remain unchanged');
  assert(layout.learningArc === 252, 'Expected desktop learning arc radius to remain unchanged');
  assert(layout.feedbackArc === 162, 'Expected desktop feedback arc radius to remain unchanged');
  assert(layout.allowArcOverflowX === true, 'Expected desktop arcs to retain horizontal overflow allowance');
}

function testNarrowDesktopLayoutPreservationContract() {
  const layoutUtils = layoutUtilsModule.createLayoutUtils({
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    readScopedCssNumber: (_name, fallback) => fallback,
    getColors: () => ({ muted: '#5C4F3A', gold: '#B8943A' })
  });
  const layout = layoutUtils.getLayout({ clientWidth: 650 });

  assert(layout.compact === true, 'Expected narrow desktop shell to use compact layout');
  assert(layout.mobileCompaction === false, 'Expected narrow desktop shell not to use mobile-only compaction');
  assert(layout.height === 923, 'Expected narrow desktop viewBox height to keep the previous compact value');
  assert(layout.topY === 142, 'Expected narrow desktop first node position to remain unchanged');
  assert(layout.nodeWidth === 142, 'Expected narrow desktop node width to remain unchanged');
  assert(layout.stepGap > 80 && layout.stepGap < 81, 'Expected narrow desktop vertical spacing to remain unchanged');
  assert(layout.learningArc === 150, 'Expected narrow desktop learning arc fallback to remain unchanged');
  assert(layout.feedbackArc === 92, 'Expected narrow desktop feedback arc fallback to remain unchanged');
}

function run() {
  testNodeLabelWrappingContractInLayoutUtils();
  testNodeWidthResolverSupportsFixedWidthMode();
  testMobileNodeFontScalingTokenContract();
  testMobileLayoutCompactionContract();
  testDesktopLayoutPreservationContract();
  testNarrowDesktopLayoutPreservationContract();
  console.log('PASS: tests/test-mix-mapper-node-label-layout-contract.js');
}

run();
