'use strict';

const fs = require('fs');
const path = require('path');

const semantics = require('../modules/mix-mapper/mix-mapper-semantics.js');
const geometry = require('../modules/mix-mapper/mix-mapper-geometry.js');
const layoutUtilsModule = require('../modules/mix-mapper/mix-mapper-layout-utils.js');
const nodeUtilsModule = require('../modules/mix-mapper/mix-mapper-node-utils.js');
const modePolicyModule = require('../modules/mix-mapper/mix-mapper-mode-policy.js');
const tooltipModule = require('../modules/mix-mapper/mix-mapper-tooltip.js');
const interactionsModule = require('../modules/mix-mapper/mix-mapper-interactions.js');
const rendererModule = require('../modules/mix-mapper/mix-mapper-renderer.js');

const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper.js'),
  'utf8'
);
const rendererSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'mix-mapper-renderer.js'),
  'utf8'
);

const htmlSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'mix-mapper', 'index.html'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testRoleHelpersBehavior() {
  assert(typeof semantics.getProcessRole === 'function', 'Expected getProcessRole helper export');
  assert(typeof semantics.getAssumptionRole === 'function', 'Expected getAssumptionRole helper export');
  assert(typeof semantics.getLearningRole === 'function', 'Expected getLearningRole helper export');

  const traditionalPrimary = { lane: 'traditional', kind: 'primary' };
  const traditionalMinor = { lane: 'traditional', kind: 'minor' };
  const complexityPrimary = { lane: 'complexity', kind: 'primary' };
  const complexityFeedback = { lane: 'complexity', kind: 'feedback' };

  assert(semantics.getProcessRole(traditionalPrimary) === 'traditional-flow', 'Expected traditional primary process role');
  assert(semantics.getProcessRole(complexityPrimary) === 'complexity-flow', 'Expected complexity primary process role');
  assert(semantics.getAssumptionRole(traditionalPrimary) === 'certainty', 'Expected traditional certainty assumption role');
  assert(semantics.getAssumptionRole(traditionalMinor) === 'certainty-revisit', 'Expected traditional revisit assumption role');
  assert(semantics.getLearningRole(complexityFeedback) === 'learning-loop', 'Expected complexity loop learning role');
}

function testGeometryModuleSurface() {
  assert(typeof geometry.linkPath === 'function', 'Expected linkPath geometry helper export');
  assert(typeof geometry.makeMarker === 'function', 'Expected makeMarker geometry helper export');
  assert(typeof geometry.laneArcSideSign === 'function', 'Expected laneArcSideSign geometry helper export');
}

function testRuntimeUsesSplitModules() {
  assert(
      /window\.MixMapperData/.test(runtimeSource) &&
      /window\.MixMapperSemantics/.test(runtimeSource) &&
      /window\.MixMapperGeometry/.test(runtimeSource) &&
      /window\.MixMapperLayoutUtils/.test(runtimeSource) &&
      /window\.MixMapperNodeUtils/.test(runtimeSource) &&
      /window\.MixMapperModePolicy/.test(runtimeSource) &&
      /window\.MixMapperTooltip/.test(runtimeSource) &&
      /window\.MixMapperInteractions/.test(runtimeSource) &&
      /window\.MixMapperRenderer/.test(runtimeSource),
    'Expected runtime to resolve split Mix Mapper modules from window'
  );
  assert(!/var\s+BASE_NODES\s*=\s*\[/.test(runtimeSource), 'Expected BASE_NODES to be externalized from runtime file');
  assert(!/var\s+LINKS\s*=\s*\[/.test(runtimeSource), 'Expected LINKS to be externalized from runtime file');
  assert(
    !/var\s+COMPLEXITY_LINK_NARRATIVES\s*=\s*\{/.test(runtimeSource),
    'Expected COMPLEXITY_LINK_NARRATIVES to be externalized from runtime file'
  );
}

function testScriptLoadOrderContract() {
  const dataPos = htmlSource.indexOf('mix-mapper-data.js');
  const semanticsPos = htmlSource.indexOf('mix-mapper-semantics.js');
  const geometryPos = htmlSource.indexOf('mix-mapper-geometry.js');
  const layoutPos = htmlSource.indexOf('mix-mapper-layout-utils.js');
  const nodePos = htmlSource.indexOf('mix-mapper-node-utils.js');
  const modePolicyPos = htmlSource.indexOf('mix-mapper-mode-policy.js');
  const tooltipPos = htmlSource.indexOf('mix-mapper-tooltip.js');
  const interactionsPos = htmlSource.indexOf('mix-mapper-interactions.js');
  const rendererPos = htmlSource.indexOf('mix-mapper-renderer.js');
  const runtimePos = htmlSource.indexOf('mix-mapper.js');

  assert(dataPos > -1, 'Expected data module script tag');
  assert(semanticsPos > -1, 'Expected semantics module script tag');
  assert(geometryPos > -1, 'Expected geometry module script tag');
  assert(layoutPos > -1, 'Expected layout utils module script tag');
  assert(nodePos > -1, 'Expected node utils module script tag');
  assert(modePolicyPos > -1, 'Expected mode policy module script tag');
  assert(tooltipPos > -1, 'Expected tooltip module script tag');
  assert(interactionsPos > -1, 'Expected interactions module script tag');
  assert(rendererPos > -1, 'Expected renderer module script tag');
  assert(runtimePos > -1, 'Expected runtime script tag');
  assert(dataPos < semanticsPos, 'Expected data script before semantics script');
  assert(semanticsPos < geometryPos, 'Expected semantics script before geometry script');
  assert(geometryPos < layoutPos, 'Expected geometry script before layout utils script');
  assert(layoutPos < nodePos, 'Expected layout utils script before node utils script');
  assert(nodePos < modePolicyPos, 'Expected node utils script before mode policy script');
  assert(modePolicyPos < tooltipPos, 'Expected mode policy script before tooltip script');
  assert(tooltipPos < interactionsPos, 'Expected tooltip script before interactions script');
  assert(interactionsPos < rendererPos, 'Expected interactions script before renderer script');
  assert(rendererPos < runtimePos, 'Expected renderer script before runtime script');
}

function testLayoutUtilsModuleSurface() {
  assert(typeof layoutUtilsModule.createLayoutUtils === 'function', 'Expected createLayoutUtils export');

  const layoutUtils = layoutUtilsModule.createLayoutUtils({
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    readScopedCssNumber: (_name, fallback) => fallback,
    getColors: () => ({ muted: '#5C4F3A', gold: '#B8943A' })
  });

  assert(typeof layoutUtils.getLayout === 'function', 'Expected getLayout helper');
  assert(typeof layoutUtils.layoutLaneHeaderText === 'function', 'Expected layoutLaneHeaderText helper');
  assert(typeof layoutUtils.layoutComparisonLabels === 'function', 'Expected layoutComparisonLabels helper');
}

function testModePolicyModuleSurface() {
  assert(typeof modePolicyModule.createModePolicy === 'function', 'Expected createModePolicy export');

  const policy = modePolicyModule.createModePolicy({
    getColors: () => ({ inkFaint: '#777', learningDot: '#4A6741', rust: '#9A4F2F', assumptionArrow: '#4A6741', learningArrow: '#4A6741', processArrow: '#2A2018' }),
    getProcessRole: (link) => (link.kind === 'primary' ? 'traditional-flow' : 'adaptive-context'),
    getAssumptionRole: (link) => (link.kind === 'primary' ? 'certainty' : 'context'),
    getLearningRole: (link) => (link.kind === 'learning' ? 'learning-loop' : 'learning-support'),
    linkKey: (link) => `${link.source}>${link.target}:${link.kind}`
  });

  assert(typeof policy.modeStyle === 'function', 'Expected modeStyle helper from policy');
  assert(typeof policy.pulseDistancePx === 'function', 'Expected pulseDistancePx helper from policy');
  assert(typeof policy.highlightLinkOpacity === 'function', 'Expected highlightLinkOpacity helper from policy');
}

function testNodeUtilsModuleSurface() {
  assert(typeof nodeUtilsModule.createNodeUtils === 'function', 'Expected createNodeUtils export');

  const nodeUtils = nodeUtilsModule.createNodeUtils({
    baseNodes: [{ id: 'x1', lane: 'traditional', step: 1, title: 'A', shortLabel: 'A', description: 'A', tags: [] }],
    links: [{ source: 'x1', target: 'x2', lane: 'traditional', kind: 'primary' }],
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  });

  assert(typeof nodeUtils.buildNodes === 'function', 'Expected buildNodes helper');
  assert(typeof nodeUtils.nodeShapePath === 'function', 'Expected nodeShapePath helper');
  assert(typeof nodeUtils.connectedNodeIds === 'function', 'Expected connectedNodeIds helper');
}

function testTooltipModuleSurface() {
  assert(typeof tooltipModule.createTooltipContent === 'function', 'Expected createTooltipContent export');

  const tooltip = tooltipModule.createTooltipContent({
    modeLabel: () => 'Process',
    complexityLinkNarrative: () => 'Narrative text'
  });

  assert(typeof tooltip.tooltipHtml === 'function', 'Expected tooltipHtml helper');
  assert(typeof tooltip.linkTooltipHtml === 'function', 'Expected linkTooltipHtml helper');
  assert(typeof tooltip.linkAriaLabel === 'function', 'Expected linkAriaLabel helper');
}

function testInteractionsModuleSurface() {
  assert(typeof interactionsModule.createInteractionBindings === 'function', 'Expected createInteractionBindings export');

  const bindings = interactionsModule.createInteractionBindings({
    getMode: () => 'process',
    showTooltip: () => {},
    hideTooltip: () => {},
    linkTooltipHtml: () => '',
    linkAriaLabel: () => '',
    tooltipHtml: () => '',
    highlightNode: () => {},
    clearHighlight: () => {}
  });

  assert(typeof bindings.updateLinkAriaLabels === 'function', 'Expected updateLinkAriaLabels binding');
  assert(typeof bindings.bindLinkInteractions === 'function', 'Expected bindLinkInteractions binding');
  assert(typeof bindings.bindNodeInteractions === 'function', 'Expected bindNodeInteractions binding');
  assert(typeof bindings.bindModeButtons === 'function', 'Expected bindModeButtons binding');
}

function testRendererModuleSurface() {
  assert(typeof rendererModule.createRenderer === 'function', 'Expected createRenderer export');

  const renderer = rendererModule.createRenderer({
    d3: null,
    svgEl: null,
    links: [],
    comparisonRows: [],
    comparisonLineRows: [],
    layoutUtils: null,
    nodeUtils: null,
    modePolicy: null,
    interactionBindings: null,
    linkPath: () => '',
    makeMarker: () => {},
    getColors: () => ({}),
    getCurrentRenderStamp: () => 0
  });

  assert(typeof renderer.renderGraph === 'function', 'Expected renderGraph function from renderer module');
}

function testRuntimeUsesPolicyPulseDistanceSampling() {
  assert(
    /modePolicy\.pulseDistancePx\(elapsed,\s*link,\s*idx,\s*state\.mode\)/.test(runtimeSource),
    'Expected runtime to route pulse distance through mode policy helper'
  );
  assert(/getPointAtLength\(distancePx\)/.test(runtimeSource), 'Expected pulse motion to sample path by distance');
}

function testRuntimeUsesInteractionBindings() {
  assert(
    /interactionBindings\.bindLinkInteractions\(linkHitSel,\s*nodeById\)/.test(rendererSource),
    'Expected renderer to bind link interactions through interaction module'
  );
  assert(
    /interactionBindings\.bindNodeInteractions\(nodeSel\)/.test(rendererSource),
    'Expected renderer to bind node interactions through interaction module'
  );
}

function testRuntimeUsesRendererModule() {
  assert(
    /renderer\.renderGraph\(\{/.test(runtimeSource),
    'Expected runtime to invoke renderer module renderGraph'
  );
}

function run() {
  testRoleHelpersBehavior();
  testGeometryModuleSurface();
  testLayoutUtilsModuleSurface();
  testNodeUtilsModuleSurface();
  testModePolicyModuleSurface();
  testTooltipModuleSurface();
  testInteractionsModuleSurface();
  testRendererModuleSurface();
  testRuntimeUsesSplitModules();
  testScriptLoadOrderContract();
  testRuntimeUsesPolicyPulseDistanceSampling();
  testRuntimeUsesInteractionBindings();
  testRuntimeUsesRendererModule();
  console.log('PASS: tests/test-mix-mapper-mode-motion-contract.js');
}

run();
