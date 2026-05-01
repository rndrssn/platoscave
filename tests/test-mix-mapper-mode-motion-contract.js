'use strict';

const fs = require('fs');
const path = require('path');

const semantics = require('../modules/learning-feedback/mix-mapper-semantics.js');
const geometry = require('../modules/learning-feedback/mix-mapper-geometry.js');
const layoutUtilsModule = require('../modules/learning-feedback/mix-mapper-layout-utils.js');
const nodeUtilsModule = require('../modules/learning-feedback/mix-mapper-node-utils.js');
const modePolicyModule = require('../modules/learning-feedback/mix-mapper-mode-policy.js');
const tooltipModule = require('../modules/learning-feedback/mix-mapper-tooltip.js');
const interactionsModule = require('../modules/learning-feedback/mix-mapper-interactions.js');
const rendererModule = require('../modules/learning-feedback/mix-mapper-renderer.js');

const runtimeSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'learning-feedback', 'mix-mapper.js'),
  'utf8'
);
const rendererSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'learning-feedback', 'mix-mapper-renderer.js'),
  'utf8'
);
const cssSource = fs.readFileSync(
  path.join(__dirname, '..', 'css', 'pages', 'mix-mapper.css'),
  'utf8'
);

const htmlSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'learning-feedback', 'index.html'),
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

function testLegendOrderContract() {
  const legendModes = Array.from(htmlSource.matchAll(/data-mode="([^"]+)"/g)).map((match) => match[1]);
  assert(
    legendModes.slice(0, 3).join(',') === 'learning,process,assumptions',
    'Expected Mix Mapper legend order to be Learning, Process, Assumptions'
  );
}

function testLegendMarkerShapeContract() {
  assert(
    /\.mix-mapper-legend-marker--process::after\s*\{[\s\S]*border-left:\s*0\.42rem solid var\(--ink-faint\)/.test(cssSource),
    'Expected Process legend marker to use an arrowhead'
  );
  assert(
    !/\.mix-mapper-legend-marker--assumptions::after/.test(cssSource),
    'Expected Assumptions legend marker to stay a plain line without a terminal dot'
  );
  assert(
    /\.mix-mapper-legend-btn\.is-active \.mix-mapper-legend-marker--assumptions\s*\{[\s\S]*border-top-color:\s*var\(--viz-slate/.test(cssSource),
    'Expected active Assumptions legend marker to color the line itself'
  );
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
  assert(typeof layoutUtils.comparisonRowY === 'function', 'Expected comparisonRowY helper for dot placement');
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
    baseNodes: [{ id: 'x1', lane: 'traditional', step: 1, title: 'A', shortLabel: 'Incremental Delivery', description: 'A', tags: [] }],
    links: [{ source: 'x1', target: 'x2', lane: 'traditional', kind: 'primary' }],
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  });

  assert(typeof nodeUtils.resolveNodeGeometry === 'function', 'Expected resolveNodeGeometry helper');
  assert(typeof nodeUtils.buildNodes === 'function', 'Expected buildNodes helper');
  assert(typeof nodeUtils.nodeShapePath === 'function', 'Expected nodeShapePath helper');
  assert(typeof nodeUtils.connectedNodeIds === 'function', 'Expected connectedNodeIds helper');

  const geometry = nodeUtils.resolveNodeGeometry(
    { compact: false, nodeWidth: 120, nodeHeight: 40, laneGap: 200 },
    { nodeFontU: 11.4 }
  );
  assert(geometry.nodeWidth >= 120, 'Expected geometry resolver to keep or increase node width');
  assert(geometry.laneGap >= 200, 'Expected geometry resolver to keep or increase lane gap');
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
  assert(typeof bindings.resolveNextMode === 'function', 'Expected resolveNextMode binding');
}

function testLegendToggleStickyBehavior() {
  const bindings = interactionsModule.createInteractionBindings();

  function makeModeButton(mode) {
    const listeners = Object.create(null);
    return {
      getAttribute(name) {
        return name === 'data-mode' ? mode : null;
      },
      addEventListener(type, handler) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
      },
      removeEventListener(type, handler) {
        if (!listeners[type]) return;
        listeners[type] = listeners[type].filter((fn) => fn !== handler);
      },
      click() {
        if (!listeners.click || !listeners.click.length) return;
        listeners.click.slice().forEach((fn) => fn());
      }
    };
  }

  const processButton = makeModeButton('process');
  const learningButton = makeModeButton('learning');
  const observedModes = [];
  let currentMode = 'all';

  bindings.bindModeButtons([processButton, learningButton], function(nextMode) {
    observedModes.push(nextMode);
    currentMode = nextMode;
  }, {
    getMode: () => currentMode
  });

  processButton.click();
  processButton.click();
  learningButton.click();

  assert(
    observedModes.join(',') === 'process,all,learning',
    'Expected legend clicks to toggle active mode on first click and reset to all on second click'
  );
}

function testLegendBindingIsIdempotent() {
  const bindings = interactionsModule.createInteractionBindings();
  const observedModes = [];
  let currentMode = 'all';

  const button = {
    _listeners: [],
    getAttribute(name) {
      return name === 'data-mode' ? 'process' : null;
    },
    addEventListener(type, handler) {
      if (type !== 'click') return;
      this._listeners.push(handler);
    },
    removeEventListener(type, handler) {
      if (type !== 'click') return;
      this._listeners = this._listeners.filter((fn) => fn !== handler);
    },
    click() {
      this._listeners.slice().forEach((fn) => fn());
    }
  };

  const onModeSelected = (nextMode) => {
    observedModes.push(nextMode);
    currentMode = nextMode;
  };

  bindings.bindModeButtons([button], onModeSelected, { getMode: () => currentMode });
  bindings.bindModeButtons([button], onModeSelected, { getMode: () => currentMode });
  button.click();

  assert(
    observedModes.length === 1 && observedModes[0] === 'process',
    'Expected rebinding mode buttons not to create duplicate click handlers'
  );
}

function testRuntimeLegendToggleFallbackContract() {
  assert(
    /function\s+bindLegendModeButtons\(\)\s*\{/.test(runtimeSource),
    'Expected runtime to bind legend mode buttons directly'
  );
  assert(
    /legendEl\.addEventListener\('click',\s*onLegendClick,\s*true\)/.test(runtimeSource),
    'Expected runtime to attach delegated capture-phase legend click handler'
  );
  assert(
    /event\.stopImmediatePropagation\(\)/.test(runtimeSource),
    'Expected delegated legend click handler to stop immediate propagation to avoid duplicate toggles'
  );
  assert(
    /state\.activeModes\[requestedMode\]\s*=\s*nextActive/.test(runtimeSource),
    'Expected runtime to toggle independent legend layer state per requested mode'
  );
  assert(
    /target\.nodeType\s*===\s*1/.test(runtimeSource) &&
    /target\.parentElement/.test(runtimeSource),
    'Expected runtime legend handler to normalize non-element click targets (for example text nodes)'
  );
  assert(
    /legendEl\.__mixMapperLegendDelegatedHandler/.test(runtimeSource),
    'Expected runtime delegated legend bindings to be idempotent per legend root'
  );
  assert(
    /function\s+resolveLinkMode\(link\)/.test(runtimeSource) &&
    /function\s+resolvePulseMode\(link\)/.test(runtimeSource),
    'Expected runtime to resolve composed link and pulse modes from multi-layer legend state'
  );
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
    /modePolicy\.pulseDistancePx\(elapsed,\s*link,\s*idx,\s*resolvePulseMode\(link\)\)/.test(runtimeSource),
    'Expected runtime to route pulse distance through composed pulse-mode helper'
  );
  assert(/getPointAtLength\(distancePx\)/.test(runtimeSource), 'Expected pulse motion to sample path by distance');
}

function testComplexityFeedbackPulsesReenterForwardFlow() {
  assert(
    /function\s+assignComplexityReentryMeta\(nodeById,\s*pathNodeByKey\)/.test(rendererSource),
    'Expected renderer to assign re-entry metadata for complexity feedback pulses'
  );
  assert(
    /link\.lane !== 'complexity'/.test(rendererSource) &&
      /link\.kind !== 'feedback' && link\.kind !== 'learning'/.test(rendererSource),
    'Expected only complexity feedback and learning arcs to receive re-entry metadata'
  );
  assert(
    /candidate\.kind === 'primary'/.test(rendererSource) &&
      /candidate\.source === link\.target/.test(rendererSource),
    'Expected feedback pulses to re-enter through the next downstream primary flow segment'
  );
  assert(
    /link\.__reentryPathNode/.test(runtimeSource) &&
      /link\.__reentryAbsorbDistance/.test(runtimeSource) &&
      /Math\.sin\(absorbProgress \* Math\.PI\)/.test(runtimeSource),
    'Expected runtime to dwell feedback pulses at the absorbing node before re-entry'
  );
  assert(
    /link\.__reentryPathNode\.getPointAtLength\(reentryDistancePx\)/.test(runtimeSource),
    'Expected runtime to move absorbed feedback pulses along the downstream re-entry path'
  );
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

function testRuntimeUsesScreenScaledTypography() {
  assert(
    /function\s+resolveTypography\s*\(layout\)\s*\{/.test(runtimeSource),
    'Expected runtime typography resolver'
  );
  assert(
    /svgEl\.getBoundingClientRect\(\)/.test(runtimeSource),
    'Expected runtime to read SVG viewport size for typography scaling'
  );
  assert(
    /readNumberCssVarFromEl\(svgEl,\s*'--mix-map-fs-node-px'/.test(runtimeSource),
    'Expected runtime typography to be driven by CSS typography tokens'
  );
  assert(
    /getTypography:\s*resolveTypography/.test(runtimeSource),
    'Expected runtime to pass typography resolver to renderer'
  );
}

function testRendererUsesTypographySurface() {
  assert(
    /var getTypography = typeof deps\.getTypography === 'function' \? deps\.getTypography/.test(rendererSource),
    'Expected renderer to support injected typography resolver'
  );
  assert(
    /var typography = getTypography\(layout\) \|\| \{\};/.test(rendererSource),
    'Expected renderer to resolve typography from layout'
  );
  assert(
    /layoutUtils\.comparisonRowY\(/.test(rendererSource),
    'Expected renderer to use comparisonRowY for dot placement'
  );
  assert(
    /layoutUtils\.layoutLaneHeaderText\([\s\S]*typography[\s\S]*\)/.test(rendererSource),
    'Expected renderer to render lane header text in SVG via layout helper'
  );
  assert(
    /learning-oriented\\nuncertainty-aware\\nadaptive/.test(rendererSource) &&
      /phase-gated\\nrequirements-first\\nlinear/.test(rendererSource),
    'Expected lane subtitles to render as explicit multiline descriptors without pipe separators'
  );
  assert(
    !/class="mix-mapper-lane-headings"/.test(htmlSource),
    'Expected no duplicate HTML lane heading block when SVG lane headers are active'
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
testLegendToggleStickyBehavior();
testLegendBindingIsIdempotent();
testRuntimeLegendToggleFallbackContract();
testRendererModuleSurface();
  testRuntimeUsesSplitModules();
  testScriptLoadOrderContract();
  testLegendOrderContract();
  testLegendMarkerShapeContract();
  testRuntimeUsesPolicyPulseDistanceSampling();
  testComplexityFeedbackPulsesReenterForwardFlow();
  testRuntimeUsesInteractionBindings();
  testRuntimeUsesRendererModule();
  testRuntimeUsesScreenScaledTypography();
  testRendererUsesTypographySurface();
  console.log('PASS: tests/test-mix-mapper-mode-motion-contract.js');
}

run();
