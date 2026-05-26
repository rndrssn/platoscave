# platoscave — Repository Map

*Auto-generated. 114 JS files · 447 symbols · 68 HTML pages · 379,803 total tokens. Excludes vendor and minified files.*

This is a structural index of the repository. JS files list top-level functions; HTML pages list which scripts they load. Use this to orient before reading source.

## Overview

### JavaScript

| Group | Files | Symbols | Tokens |
|-------|------:|--------:|-------:|
| Modules | 34 | 122 | 120,483 |
| Build scripts | 6 | 63 | 15,828 |
| Contract tests | 65 | 262 | 74,525 |
| Page-level scripts | 8 | 0 | 10,283 |
| Root-level files | 1 | 0 | 301 |

### HTML pages

| Group | Pages | Script refs | Tokens |
|-------|------:|------------:|-------:|
| Articles | 2 | 9 | 11,682 |
| Case pages | 4 | 0 | 698 |
| Module pages | 39 | 165 | 94,166 |
| Root-level pages | 1 | 5 | 1,272 |
| colophon | 1 | 4 | 1,436 |
| tests | 2 | 7 | 7,121 |
| tags | 11 | 44 | 13,077 |
| notes | 5 | 21 | 7,480 |
| cv | 1 | 0 | 166 |
| skills | 1 | 0 | 162 |
| design-system | 1 | 4 | 21,123 |

## JavaScript

### Modules
*34 files · 122 symbols · 120,483 tokens*

### `modules/ambiguity-clarity/section-map/section-map.js`
Interactive section map (Document Map) for Module 06: per-concern readiness across PM, UX, and Eng tracks.
*0 symbols · 336 lines · 3,706 tokens*

### `modules/emergence/emergence-primer-gantt.js`
Game-of-Life–driven Gantt model for the Emergence GANTT meets Game of Life visualization.
*0 symbols · 403 lines · 4,068 tokens*

### `modules/emergence/emergence-primer.js`
Conway's Game of Life canvas simulation for the Emergence module primer.
*0 symbols · 1036 lines · 8,995 tokens*

### `modules/experience-skill-graph/graph-data-loader.js`
Loads and validates skill/experience graph data from markdown frontmatter for the force-directed Skills graph.
*0 symbols · 188 lines · 1,518 tokens*

### `modules/flow-queuing/concept-graph/concept-graph.js`
D3 force-directed concept map for the Flow & Queuing module (section 04).
*0 symbols · 578 lines · 6,844 tokens*

### `modules/flow-queuing/flow-queuing-model.js`
M/M/1 queueing model calculations: Little's Law, utilization, and variability-adjusted lead time.
*0 symbols · 183 lines · 1,646 tokens*

### `modules/flow-queuing/flow-queuing.js`
Flow & Queuing Explore page: D3 bar charts and preset scenarios for arrival and backlog visualization.
*0 symbols · 370 lines · 3,884 tokens*

### `modules/garbage-can/assess/assess.js`
Assess page wiring: questionnaire flow, scoring, and simulation trigger for the Garbage Can module.
*6 symbols · 336 lines · 3,015 tokens*

  - `setSimError(message)` (L44)
  - `buildAssessPressureNarrative(problemIntensity, problemInflow, decisionStructure, accessStructure)` (L58)
  - `setActiveResultsNav(targetId)` (L65)
  - `validateGroup(groupIdx)` (L114)
  - `advanceGroup(fromIdx)` (L124)
  - `showStage(id, delay)` (L184)

### `modules/garbage-can/can-explainer/can-explainer.js`
Animated D3 explainer diagram illustrating the Garbage Can Model concept.
*0 symbols · 471 lines · 4,176 tokens*

### `modules/garbage-can/explorer/explorer.js`
Explorer page wiring: parameter controls and simulation trigger for the Garbage Can module.
*6 symbols · 206 lines · 1,760 tokens*

  - `setSimError(message)` (L16)
  - `buildExplorerNarrative(intensity, inflow, decision, access)` (L29)
  - `setActiveResultsNav(targetId)` (L34)
  - `allDropdownsSelected()` (L58)
  - `updateDiagnosis()` (L67)
  - `resetSimulation()` (L111)

### `modules/garbage-can/gc-ui-utils.js`
Shared UI helpers for Garbage Can pages (assess, explorer).
*1 symbols · 12 lines · 130 tokens*

  - `centerSimulationCanvasInViewport()` (L3)

### `modules/garbage-can/runtime/gc-diagnosis.js`
Maps decision/access structure combinations to organisational diagnosis clusters and descriptive text.
*2 symbols · 81 lines · 985 tokens*

  - `getDiagnosis(decisionStructure, accessStructure, unresolvedShare)` (L54)
  - `getDiagnosisPreview(body)` (L74)

### `modules/garbage-can/runtime/gc-pressure-narrative.js`
Generates human-readable narrative strings describing Garbage Can pressure and structural configuration.
*0 symbols · 70 lines · 693 tokens*

### `modules/garbage-can/runtime/gc-scoring.js`
Converts 12 survey responses into Garbage Can Model simulation parameters (energy load, access structure, decision structure).
*3 symbols · 85 lines · 944 tokens*

  - `classifyEnergy(mean)` (L39)
  - `classifyStructure12(mean)` (L45)
  - `scoreResponses(responses)` (L64)

### `modules/garbage-can/runtime/gc-simulation-config.js`
Simulation constants for the Garbage Can Model: agent counts, energy loads, and problem-inflow schedules.
*0 symbols · 50 lines · 430 tokens*

### `modules/garbage-can/runtime/gc-simulation-core.js`
Core Garbage Can Model simulation: Cohen, March & Olsen (1972) Monte Carlo implementation.
*0 symbols · 691 lines · 6,571 tokens*

### `modules/garbage-can/runtime/gc-simulation.js`
Public API wrapper for gc-simulation-core.js; resolves the core module in browser and Node.js environments.
*7 symbols · 313 lines · 2,578 tokens*

  - `resolveSimulationCore()` (L9)
  - `buildSimulationContext({ problemIntensity, problemInflow, energyLoad, decisionStructure, accessStructure, })` (L80)
  - `finalizeSimulationResult(agg, lastResult)` (L112)
  - `getGarbageCanDefaults()` (L162)
  - `runGarbageCanSimulation({ problemIntensity, problemInflow, energyLoad, decisionStructure, accessStructure, })` (L170)
  - `runGarbageCanSimulationAsync(params, options)` (L194)
  - `validateSimulation()` (L219)

### `modules/garbage-can/runtime/gc-viz-config.js`
Shared layout and sizing configuration for the GC simulation visualization.
*0 symbols · 47 lines · 279 tokens*

### `modules/garbage-can/runtime/gc-viz-helpers.js`
Low-level rendering utilities for GC viz: CSS variable reading, label formatters, and SVG path helpers.
*0 symbols · 154 lines · 1,457 tokens*

### `modules/garbage-can/runtime/gc-viz-timing.js`
Animation timing constants for the GC simulation visualization.
*0 symbols · 69 lines · 602 tokens*

### `modules/garbage-can/runtime/gc-viz.js`
D3 visualization for the Garbage Can Model: positioning diagram and animated simulation with summary.
*15 symbols · 1275 lines · 14,806 tokens*

  - `resolveVizDimensions(simResult, options)` (L147)
  - `resolveTextScale(scalePresetOrNumber)` (L151)
  - `drawBottomLegend(svg, legendY, sizing)` (L155)
  - `createTopLegend(svg)` (L201)
  - `ensureVizEventTicker()` (L212)
  - `getVizSizing()` (L231)
  - `resolveVizLayout(mode, sizing)` (L235)
  - `resolveChoiceFieldBox(layout, sizing)` (L239)
  - `buildChoiceCenters(fieldBox, choiceRadius, choiceCount)` (L243)
  - `collectChoiceDeltaForTick(prevTick, currTick, choiceCount)` (L247)
  - `choiceEventTextFromDelta(choiceDelta)` (L268)
  - `drawPositioning(raw)` (L288)
  - `drawEmptyState(options)` (L356)
  - `showEndState( pctRes, pctOver, pctFli, probResolved, probDisplaced, probAdrift, probInForum, probNeverEntered, choiceResolvedPerCoMean, lastTick, dims )` (L438)
  - `drawViz(simResult, options)` (L542)

### `modules/learning-feedback/mix-mapper-data.js`
Node and link data for the Mix Mapper: process steps, complexity flows, assumption arcs, and learning connections.
*0 symbols · 239 lines · 2,570 tokens*

### `modules/learning-feedback/mix-mapper-geometry.js`
Arc geometry calculations for Mix Mapper: path routing, control points, and link-span computation.
*0 symbols · 241 lines · 2,316 tokens*

### `modules/learning-feedback/mix-mapper-interactions.js`
Mouse and keyboard interaction bindings for Mix Mapper nodes and links.
*0 symbols · 255 lines · 2,036 tokens*

### `modules/learning-feedback/mix-mapper-layout-utils.js`
Layout metric factory for Mix Mapper: lane sizing, node positions, and CSS variable reading.
*0 symbols · 423 lines · 3,956 tokens*

### `modules/learning-feedback/mix-mapper-mode-policy.js`
Mode-specific visual policy for Mix Mapper: colors, opacity, and animation behavior per active mode.
*0 symbols · 362 lines · 3,038 tokens*

### `modules/learning-feedback/mix-mapper-node-utils.js`
Node utility factory for Mix Mapper: label sizing, lane grouping, and node-by-id lookup.
*0 symbols · 129 lines · 1,116 tokens*

### `modules/learning-feedback/mix-mapper-renderer.js`
D3 rendering engine for Mix Mapper: draws lanes, nodes, arcs, animated dots, and comparison rows.
*0 symbols · 394 lines · 3,528 tokens*

### `modules/learning-feedback/mix-mapper-semantics.js`
Semantic helpers for Mix Mapper: mode labels, link keys, narrative text, and process/assumption role lookups.
*0 symbols · 117 lines · 1,181 tokens*

### `modules/learning-feedback/mix-mapper-tooltip.js`
Tooltip content factory for Mix Mapper: HTML generation for node and link hover states.
*0 symbols · 79 lines · 745 tokens*

### `modules/learning-feedback/mix-mapper.js`
Top-level orchestrator for the Mix Mapper visualization: wires all sub-modules and bootstraps the SVG.
*0 symbols · 782 lines · 7,197 tokens*

### `modules/products-over-projects/assessment/products-over-projects-assessment.js`
Products vs Projects risk classifier: scores slider responses into product, execution, or hybrid governance.
*0 symbols · 128 lines · 1,232 tokens*

### `modules/satellite-index/demo/satellite-index.js`
Satellite NDVI demo: MapLibre map, live Sentinel Hub data via Cloudflare Worker, and Plotly 3D surface.
*30 symbols · 1010 lines · 10,175 tokens*

  - `canUseMapLibre()` (L235)
  - `canUsePlotly()` (L239)
  - `getAnalysisDate()` (L245)
  - `clamp(value, min, max)` (L249)
  - `isFiniteNumber(value)` (L253)
  - `getViewportMetrics(bounds)` (L257)
  - `getAdaptiveGridSize(metrics)` (L269)
  - `canRequestLive(metrics)` (L275)
  - `getLiveLimitLabel()` (L279)
  - `formatArea(metrics)` (L283)
  - `buildLocalAxes(metrics, grid)` (L290)
  - `generateNdviGrid(bounds, size)` (L314)
  - `smoothNdviGridForRender(grid, passes)` (L337)
  - `addContourIntersection(points, a, b, level)` (L366)
  - `buildIndexContourTraces(grid, axes, minValue, maxValue, step)` (L380)
  - `decodeNdviPng(base64)` (L442)
  - `decodeRgbToLuminance(base64)` (L477)
  - `decodeIndexPng(base64, encMin, encMax)` (L524)
  - `renderSurface(ndviGrid, imageGrid, axes, showBase)` (L558)
  - `renderCurrentSurface()` (L663)
  - `initIndexGrid()` (L669)
  - `renderIndexSurface(def, renderGrid, axes)` (L709)
  - `renderAllIndexSurfaces()` (L778)
  - `setStatus(msg, variant)` (L787)
  - `setSurfacePlaceholder(msg)` (L794)
  - `resetAnalysisButton()` (L802)
  - `setMeta(bounds, date, scene)` (L810)
  - `updateViewportReadout()` (L838)
  - `runAnalysis()` (L855)
  - `initMap()` (L951)

### `modules/satellite-index/three/satellite-index-three.js`
Boundary-free monitoring Explorer: renders Sentinel-derived spectral surfaces with satellite basemap and optional MapTiler contours-v2 isolines.
*52 symbols · 1257 lines · 12,306 tokens*

  - `canUseMapLibre()` (L267)
  - `isWorkerKeyConfigured()` (L271)
  - `clamp(value, min, max)` (L275)
  - `isFiniteNumber(value)` (L279)
  - `getAnalysisDate()` (L283)
  - `getViewportMetrics(bounds)` (L287)
  - `getAdaptiveGridSize(metrics)` (L295)
  - `canRequestLive(metrics)` (L301)
  - `getLiveLimitLabel()` (L305)
  - `formatArea(metrics)` (L309)
  - `generateNdviGrid(bounds, size)` (L316)
  - `smoothNdviGridForRender(grid, passes)` (L341)
  - `decodeNdviPng(base64)` (L370)
  - `lonToTileX(lon, zoom)` (L405)
  - `latToTileY(lat, zoom)` (L409)
  - `chooseBaseTileZoom(bounds)` (L415)
  - `buildSatelliteTileUrl(x, y, zoom)` (L423)
  - `buildContourTileJsonUrl()` (L434)
  - `loadImageBlob(url)` (L438)
  - `makeThreeTexture(canvas)` (L459)
  - `drawTileMosaic(bounds, zoom, buildUrl, drawTile)` (L467)
  - `loadSatelliteBaseTexture(bounds)` (L508)
  - `buildContourStyle()` (L516)
  - `snapshotMapCanvas(mapInstance, size)` (L566)
  - `loadContourBaseTexture(bounds)` (L577)
  - `setStatus(msg, variant)` (L637)
  - `setSurfacePlaceholder(msg)` (L649)
  - `updateAnalysisButtonLabel(liveAllowed)` (L656)
  - `resetAnalysisButton()` (L666)
  - `resetToSelection()` (L674)
  - `setViewerMode(mode)` (L682)
  - `setMeta(date, sceneData, textureLoaded, fallbackReason)` (L696)
  - `updateViewportReadout()` (L716)
  - `colorForIndex(value, def)` (L733)
  - `decodeIndexPng(base64, encMin, encMax)` (L745)
  - `buildTerrainGeometry(grid, metrics, heightScale, surfaceOffset, colorFn, heightFn)` (L775)
  - `updateTerrainContextVisibility()` (L822)
  - `applyBaseContextMode(mode)` (L829)
  - `clearSceneMeshes()` (L852)
  - `updateRendererSize()` (L867)
  - `prefersReducedMotion()` (L878)
  - `renderOnce(force)` (L882)
  - `startRenderLoop()` (L890)
  - `updateNorthIndicator()` (L901)
  - `initThreeScene()` (L912)
  - `frameCamera(metrics, heightScale, surfaceOffset)` (L947)
  - `renderThreeSurface(grid, metrics, bounds, colorFn, heightFn)` (L968)
  - `updateIndexLegend(def)` (L1029)
  - `updateIndexGuide(indexId)` (L1049)
  - `rebuildTerrain(indexId)` (L1060)
  - `runAnalysis()` (L1099)
  - `initMap()` (L1196)

### Build scripts
*6 files · 63 symbols · 15,828 tokens*

### `scripts/build-notes.js`
Build pipeline: converts published notes/articles from markdown to HTML, and builds tag index and search data.
*39 symbols · 974 lines · 8,966 tokens*

  - `ensureDir(dirPath)` (L21)
  - `readFile(filePath)` (L25)
  - `writeFile(filePath, content)` (L29)
  - `removeDirIfExists(dirPath)` (L34)
  - `listMarkdownFiles(dirPath)` (L38)
  - `escapeHtml(value)` (L55)
  - `escapeAttr(value)` (L64)
  - `isExternalHref(href)` (L68)
  - `sanitizeHref(hrefRaw)` (L73)
  - `splitFrontmatter(raw)` (L86)
  - `parseFrontmatterYaml(yamlText)` (L93)
  - `splitCsv(text)` (L136)
  - `parseScalar(value)` (L163)
  - `slugify(value)` (L174)
  - `humanizeTagLabel(label)` (L186)
  - `normalizeTags(tagsValue)` (L193)
  - `formatCount(count, singular, plural)` (L210)
  - `resolveRelatedModules(relatedIds, modulesById)` (L215)
  - `parseDate(value)` (L224)
  - `formatDate(date)` (L232)
  - `renderInline(rawText)` (L237)
  - `renderMarkdown(markdown)` (L275)
  - `extractBodyPreview(markdown, maxLines)` (L359)
  - `renderTagLinks(tags, hrefPrefix)` (L397)
  - `readModulesMeta()` (L404)
  - `collectPublishedContent(publishedDir)` (L423)
  - `collectNotes()` (L514)
  - `collectArticles()` (L518)
  - `assertNoCrossCollectionSlugCollision(notes, articles)` (L522)
  - `renderWritingIndexCard(entry, options)` (L531)
  - `writeWritingPage(entry, options)` (L562)
  - `writeNotePage(note)` (L608)
  - `writeNotesIndex(notes)` (L621)
  - `writeArticlePage(article)` (L663)
  - `writeArticlesIndex(articles)` (L681)
  - `writeTagPage(tag, notes, articles, modules)` (L723)
  - `writeTagsIndex(tagsWithCounts)` (L806)
  - `cleanGeneratedDirs(baseDir, keepFiles)` (L847)
  - `build()` (L862)

### `scripts/check-claude-links.js`
Verifies that backtick file paths in CLAUDE.md and AGENTS.md exist in the repo, and that both files are identical.
*3 symbols · 72 lines · 581 tokens*

  - `collectBacktickPaths(source)` (L11)
  - `isOverlayPath(p)` (L19)
  - `checkReferencedPaths(contractName, source)` (L24)

### `scripts/check-docs-integrity.js`
Scans docs/ markdown for broken internal cross-references and link integrity violations.
*1 symbols · 52 lines · 407 tokens*

  - `walk(dir)` (L10)

### `scripts/lib/page-shell.js`
HTML generation helpers for the build pipeline: nav markup and full page shell used by build-notes.
*4 symbols · 93 lines · 1,512 tokens*

  - `escapeHtml(value)` (L4)
  - `escapeAttr(value)` (L13)
  - `navHtml(prefix, active)` (L17)
  - `htmlShell(params)` (L40)

### `scripts/new-module.js`
Scaffold generator: creates a new module index.html following the canonical section-01 landing pattern.
*5 symbols · 193 lines · 1,956 tokens*

  - `printUsage()` (L8)
  - `parseArgs(argv)` (L22)
  - `escapeHtml(value)` (L42)
  - `renderModuleLandingHtml(config)` (L51)
  - `main()` (L140)

### `scripts/polish-note.js`
Optional AI writing-polish step (spelling and punctuation only) for notes and articles.
*11 symbols · 302 lines · 2,406 tokens*

  - `parseArgs(argv)` (L31)
  - `printHelp()` (L77)
  - `splitFrontmatter(raw)` (L87)
  - `parseSimpleFrontmatter(frontmatterText)` (L98)
  - `slugify(value)` (L109)
  - `listMarkdownFiles(dirPath)` (L121)
  - `resolveTargetFile(opts)` (L130)
  - `extractOutputText(responseJson)` (L185)
  - `requestPolish(bodyMarkdown, meta)` (L207)
  - `normalizeNewlines(text)` (L263)
  - `main()` (L267)

### Contract tests
*65 files · 262 symbols · 74,525 tokens*

### `tests/helpers/fake-dom.js`
Minimal fake DOM (FakeClassList, FakeElement) for unit-testing browser-dependent code under Node.js.
*1 symbols · 209 lines · 1,186 tokens*

  - `buildWindow(doc)` (L196)

### `tests/helpers/load-simulation-internals.js`
Loads GC simulation internals into a vm.Script context, exposing private functions for unit tests.
*1 symbols · 39 lines · 351 tokens*

  - `loadSimulationInternals(options)` (L8)

### `tests/helpers/load-simulation.js`
Loads the GC simulation module into a vm.Script context for integration tests.
*1 symbols · 32 lines · 257 tokens*

  - `loadSimulationModule()` (L8)

### `tests/helpers/read-css-with-imports.js`
Recursively resolves CSS @import chains into a single string for use in contract tests.
*1 symbols · 27 lines · 188 tokens*

  - `readCssWithImports(filePath, visited = new Set())` (L7)

### `tests/run-all.js`
Test runner: executes all test suites and script checks, reporting pass/fail counts.
*0 symbols · 93 lines · 905 tokens*

### `tests/test-a11y-critical-pages.js`
Accessibility contract tests: checks aria attributes, roles, and alt text on critical pages.
*2 symbols · 54 lines · 901 tokens*

  - `read(relPath)` (L8)
  - `has(pattern, source)` (L12)

### `tests/test-assess-integration.js`
Integration tests for the Garbage Can assess page: questionnaire scoring and simulation trigger.
*3 symbols · 176 lines · 1,909 tokens*

  - `loadAssessWithHarness(harness)` (L12)
  - `makeAssessHarness()` (L36)
  - `run()` (L111)

### `tests/test-browser-smoke-optional.js`
Optional Playwright smoke tests for browser rendering; auto-skips when Playwright is not installed.
*1 symbols · 59 lines · 492 tokens*

  - `run()` (L7)

### `tests/test-build-notes-link-sanitization.js`
Tests link sanitization and inline-markdown rendering in the build-notes pipeline.
*4 symbols · 53 lines · 621 tokens*

  - `assert(condition, message)` (L7)
  - `testSanitizeHref()` (L11)
  - `testRenderInlineHrefOutput()` (L24)
  - `run()` (L46)

### `tests/test-can-explainer-integration.js`
Integration tests for the Garbage Can can-explainer animated diagram.
*4 symbols · 283 lines · 2,183 tokens*

  - `createD3Stub()` (L10)
  - `makeHarness()` (L184)
  - `loadScript(contextHarness)` (L227)
  - `run()` (L240)

### `tests/test-css-theme-contract.js`
Contract tests: verifies required CSS custom properties are defined across theme stylesheets.
*8 symbols · 119 lines · 803 tokens*

  - `loadAllThemeCss()` (L11)
  - `assert(condition, message)` (L56)
  - `getThemeBlocks(css)` (L60)
  - `findDeclaredVars(blockBody)` (L70)
  - `testNoDuplicateVarDeclarationsPerThemeBlock()` (L74)
  - `testRequiredTokensExistInEveryThemeTokenBlock()` (L88)
  - `testVizGeometryTokensInRootTokens()` (L101)
  - `run()` (L111)

### `tests/test-emergence-primer-gantt-layout-contract.js`
Contract tests for the Emergence Gantt model: correct row/column layout output.
*9 symbols · 262 lines · 2,778 tokens*

  - `assert(condition, message)` (L17)
  - `overlaps(a, b)` (L21)
  - `horizontalOverlap(a, b)` (L25)
  - `testModuleSurface()` (L29)
  - `testLayoutContract()` (L37)
  - `testGateMarkersOnDependencySegments()` (L64)
  - `testDependencyRouteShape()` (L99)
  - `testLabelOverlapContract()` (L166)
  - `run()` (L252)

### `tests/test-emergence-primer-jump-anchors-contract.js`
Contract tests for Emergence primer jump-anchor markup.
*6 symbols · 95 lines · 720 tokens*

  - `assert(condition, message)` (L18)
  - `extractSeedKeys(source)` (L22)
  - `extractJumpAnchors(source)` (L32)
  - `getAttr(tag, name)` (L42)
  - `checkPage(page)` (L48)
  - `run()` (L89)

### `tests/test-experience-skill-graph-security-contract.js`
Security contract tests: verifies the skill graph data loader sanitizes user-supplied content.
*2 symbols · 22 lines · 184 tokens*

  - `assert(condition, message)` (L7)
  - `run()` (L14)

### `tests/test-experience-skill-shell-contract.js`
Contract tests for the HTML shell structure of the Experience/Skills graph page.
*3 symbols · 56 lines · 620 tokens*

  - `assert(condition, message)` (L7)
  - `read(relPath)` (L11)
  - `run()` (L15)

### `tests/test-explorer-integration.js`
Integration tests for the GC Explorer page: parameter controls and simulation wiring.
*3 symbols · 155 lines · 1,726 tokens*

  - `loadExplorerWithHarness(harness)` (L12)
  - `makeExplorerHarness()` (L34)
  - `run()` (L90)

### `tests/test-explorer-narrative-combinations.js`
Tests all pressure/structure parameter combinations for the GC pressure narrative generator.
*3 symbols · 97 lines · 984 tokens*

  - `buildHarness()` (L12)
  - `triggerChange(el)` (L52)
  - `run()` (L56)

### `tests/test-explorer-race-guards.js`
Tests that concurrent simulation requests in the GC Explorer are correctly serialized.
*2 symbols · 83 lines · 834 tokens*

  - `setup()` (L10)
  - `run()` (L61)

### `tests/test-flow-queuing-concept-graph-contract.js`
Contract tests for the Flow & Queuing concept graph: required nodes, groups, and link kinds.
*1 symbols · 39 lines · 303 tokens*

  - `read(relPath)` (L10)

### `tests/test-flow-queuing-explore-contract.js`
Contract tests for the Flow & Queuing Explore page: fallback element, preset buttons, and chart containers.
*0 symbols · 111 lines · 1,246 tokens*

### `tests/test-flow-queuing-model.js`
Unit tests for QueueMachineModel: Little's Law, utilization, and variability calculations.
*2 symbols · 103 lines · 1,187 tokens*

  - `nearlyEqual(actual, expected, epsilon, label)` (L14)
  - `run()` (L21)

### `tests/test-gc-decision-type-classifier.js`
Unit tests for the GC decision-type classifier: resolution, oversight, and flight against known inputs.
*1 symbols · 51 lines · 538 tokens*

  - `build2D(rows, cols, fill)` (L9)

### `tests/test-gc-diagnosis-share.js`
Tests that all GC diagnosis cluster combinations return well-formed title and body text.
*0 symbols · 22 lines · 263 tokens*

### `tests/test-gc-diagnosis.js`
Unit tests for gc-diagnosis: cluster mapping and getDiagnosis output for all structure combinations.
*0 symbols · 30 lines · 268 tokens*

### `tests/test-gc-pressure-narrative.js`
Tests buildGcPressureNarrative across all pressure, structure, and diagnosis parameter combinations.
*0 symbols · 37 lines · 393 tokens*

### `tests/test-gc-scoring-12.js`
Validates gc-scoring.js (12-question spec) against known survey archetypes.
*1 symbols · 55 lines · 584 tokens*

  - `assert(label, actual, expected)` (L18)

### `tests/test-gc-scoring-boundaries.js`
Tests gc-scoring boundary conditions: minimum/maximum survey responses and parameter edge cases.
*2 symbols · 38 lines · 402 tokens*

  - `makeResponses({ energy, access, decision })` (L7)
  - `runCase(label, means, expected)` (L13)

### `tests/test-gc-scoring.js`
Unit tests for gc-scoring: survey response to parameter conversion for known archetypes.
*0 symbols · 46 lines · 454 tokens*

### `tests/test-gc-simulation-golden-seeded.js`
Golden-value tests for GC simulation output using a seeded random number generator.
*3 symbols · 89 lines · 755 tokens*

  - `mulberry32(seed)` (L7)
  - `runSeeded(seed, params)` (L16)
  - `snap(result)` (L21)

### `tests/test-gc-simulation-import-no-side-effects.js`
Verifies that requiring gc-simulation.js produces no global side effects.
*0 symbols · 24 lines · 172 tokens*

### `tests/test-gc-simulation-invariants.js`
Tests GC simulation statistical invariants across a parameter sweep.
*4 symbols · 130 lines · 1,201 tokens*

  - `inRange(n, min, max)` (L13)
  - `assertThrowsUnknownParam()` (L17)
  - `assertAllCombosInvariant()` (L40)
  - `assertAsyncApiContract()` (L94)

### `tests/test-gc-simulation-matrix-builders.js`
Unit tests for the GC access and decision matrix builder functions.
*0 symbols · 61 lines · 598 tokens*

### `tests/test-gc-simulation-meta-contract.js`
Contract tests: verifies that simResult.meta fields are present and correctly typed.
*0 symbols · 32 lines · 300 tokens*

### `tests/test-gc-simulation-require-fallback.js`
Verifies that gc-simulation.js resolves gc-simulation-core.js via the cwd-based fallback when primary require paths fail.
*3 symbols · 65 lines · 491 tokens*

  - `assert(condition, message)` (L14)
  - `testCwdFallbackResolvesModule()` (L18)
  - `run()` (L59)

### `tests/test-gc-summary-consistency.js`
Checks that GC simulation summary totals are consistent with per-tick resolution counts.
*2 symbols · 61 lines · 710 tokens*

  - `countLastTickProblems(lastTick)` (L9)
  - `countLastTickChoices(lastTick)` (L18)

### `tests/test-gc-viz-contract.js`
Contract tests: verifies gc-viz.js exposes the required public API surface (drawPositioning, drawViz, C).
*3 symbols · 78 lines · 710 tokens*

  - `assert(condition, message)` (L11)
  - `loadContracts()` (L15)
  - `run()` (L66)

### `tests/test-gc-viz-event-contract.js`
Contract tests for GC viz event callbacks: correct firing order and argument shapes.
*4 symbols · 103 lines · 1,003 tokens*

  - `assert(condition, message)` (L11)
  - `loadContracts()` (L15)
  - `makeTick(choiceStates)` (L66)
  - `run()` (L73)

### `tests/test-gc-viz-typography-contract.js`
Contract tests: verifies GC viz uses the correct font tokens and typographic CSS variables.
*2 symbols · 46 lines · 457 tokens*

  - `assert(condition, message)` (L28)
  - `run()` (L32)

### `tests/test-innerhtml-sink-contract.js`
Audits source files for unsafe innerHTML assignments to enforce XSS hygiene.
*5 symbols · 114 lines · 864 tokens*

  - `assert(condition, message)` (L33)
  - `walkFiles(baseDir)` (L37)
  - `findInnerHtmlSites()` (L57)
  - `matchAllowlist(site)` (L75)
  - `run()` (L79)

### `tests/test-link-language-contract.js`
Contract tests: checks the site-wide link language stays centralized and quiet.
*10 symbols · 137 lines · 1,207 tokens*

  - `assert(condition, message)` (L14)
  - `getPageImports(source)` (L18)
  - `testLinkLanguageLoadedLast()` (L22)
  - `testLegacyHomeSchemaRemovedFromComponents()` (L31)
  - `testThemeScopedContentLinkOverridesRemoved()` (L38)
  - `testLegacyNotesUnderlineRulesRemoved()` (L45)
  - `testCanonicalLinkLayerCoverage()` (L60)
  - `testQuietCanonicalLinkLayer()` (L85)
  - `testNeutralLinkTokens()` (L104)
  - `run()` (L125)

### `tests/test-mix-mapper-arc-routing-contract.js`
Contract tests for mix-mapper-geometry arc routing: correct path calculations.
*10 symbols · 159 lines · 1,797 tokens*

  - `assert(condition, message)` (L6)
  - `parseNumbers(pathData)` (L10)
  - `buildFixtures()` (L18)
  - `testLaneSideSignContract()` (L41)
  - `testComplexityArcAnchorsLeft()` (L46)
  - `testTraditionalArcAnchorsRight()` (L66)
  - `testPrimaryLinksRemainVerticalWithinLane()` (L85)
  - `testArcControlPointsStayInsideCanvasBounds()` (L98)
  - `testArcControlPointsCanOverflowDesktopWhenEnabled()` (L124)
  - `run()` (L148)

### `tests/test-mix-mapper-assumptions-contract.js`
Contract tests: verifies assumption arcs are correctly defined in mix-mapper-data.
*6 symbols · 78 lines · 652 tokens*

  - `assert(condition, message)` (L7)
  - `findLink(source, target, kind)` (L11)
  - `testAssumptionRoleClassifierBehavior()` (L15)
  - `testAssumptionNarrativeCoverage()` (L44)
  - `testDataContractForAssumptionsView()` (L61)
  - `run()` (L70)

### `tests/test-mix-mapper-interaction-tooltip-contract.js`
Contract tests for Mix Mapper tooltip HTML structure and content.
*6 symbols · 102 lines · 1,215 tokens*

  - `assert(condition, message)` (L24)
  - `testHoverHitAreaIsIntentionallyLarge()` (L28)
  - `testPointerTrackingOnHover()` (L39)
  - `testReadableTooltipPlacementInViewport()` (L58)
  - `testTooltipReadabilityStylingContract()` (L82)
  - `run()` (L93)

### `tests/test-mix-mapper-lane-header-fit-contract.js`
Contract tests: verifies lane header sizing fits within lane boundaries in Mix Mapper.
*7 symbols · 107 lines · 928 tokens*

  - `assert(condition, message)` (L14)
  - `testTypographyHelperAndDefaults()` (L18)
  - `testLaneHeaderFitHelperExists()` (L37)
  - `testComparisonDotPlacementHelperExists()` (L60)
  - `testLayoutUtilsExportSurface()` (L72)
  - `testLaneHeaderOverlapDetectionExists()` (L82)
  - `run()` (L97)

### `tests/test-mix-mapper-link-anchor-and-marker-invariants.js`
Contract tests for Mix Mapper link anchor points and SVG marker invariants.
*7 symbols · 136 lines · 1,252 tokens*

  - `assert(condition, message)` (L14)
  - `parseNumbers(pathData)` (L18)
  - `buildFixtures()` (L26)
  - `testSharedComplexityEntryPortsStayAligned()` (L48)
  - `testSharedTraditionalEntryPortsStayAligned()` (L78)
  - `testAssumptionDotMarkerContract()` (L107)
  - `run()` (L128)

### `tests/test-mix-mapper-link-narratives-contract.js`
Contract tests: verifies all Mix Mapper links have valid semantic narrative text.
*8 symbols · 97 lines · 925 tokens*

  - `assert(condition, message)` (L7)
  - `findLink(source, target, kind)` (L11)
  - `testComplexityNarrativeMapExists()` (L15)
  - `testComplexityNarrativeCoverageForComplexityLinks()` (L26)
  - `testNarrativeResolutionByMode()` (L42)
  - `testLaunchOutcomeDirectValidationLoopNarrative()` (L58)
  - `testModeLabelsContract()` (L80)
  - `run()` (L87)

### `tests/test-mix-mapper-mode-matrix-contract.js`
Contract tests for the Mix Mapper mode-to-visibility matrix across all modes.
*11 symbols · 159 lines · 1,840 tokens*

  - `assert(condition, message)` (L7)
  - `approxEqual(a, b, epsilon)` (L11)
  - `buildPolicy()` (L15)
  - `fixtures()` (L36)
  - `layout()` (L47)
  - `testOverviewModeStylesBothLanes()` (L55)
  - `testProcessModeHighlightsProcessAndFaintsOthers()` (L71)
  - `testAssumptionsModeMarkersAndOpacity()` (L87)
  - `testLearningModeAndDotSemantics()` (L105)
  - `testPulseContractAcrossModeMatrix()` (L122)
  - `run()` (L149)

### `tests/test-mix-mapper-mode-motion-contract.js`
Contract tests: verifies animated dot motion is correctly configured per Mix Mapper mode.
*23 symbols · 489 lines · 4,793 tokens*

  - `assert(condition, message)` (L34)
  - `testRoleHelpersBehavior()` (L38)
  - `testGeometryModuleSurface()` (L55)
  - `testRuntimeUsesSplitModules()` (L61)
  - `testScriptLoadOrderContract()` (L82)
  - `testLegendOrderContract()` (L115)
  - `testLegendMarkerShapeContract()` (L123)
  - `testLayoutUtilsModuleSurface()` (L138)
  - `testModePolicyModuleSurface()` (L152)
  - `testNodeUtilsModuleSurface()` (L168)
  - `testTooltipModuleSurface()` (L190)
  - `testInteractionsModuleSurface()` (L203)
  - `testLegendToggleStickyBehavior()` (L224)
  - `testLegendBindingIsIdempotent()` (L270)
  - `testRuntimeLegendToggleFallbackContract()` (L308)
  - `testRendererModuleSurface()` (L341)
  - `testRuntimeUsesPolicyPulseDistanceSampling()` (L363)
  - `testComplexityFeedbackPulsesReenterForwardFlow()` (L371)
  - `testRuntimeUsesInteractionBindings()` (L398)
  - `testRuntimeUsesRendererModule()` (L409)
  - `testRuntimeUsesScreenScaledTypography()` (L416)
  - `testRendererUsesTypographySurface()` (L435)
  - `run()` (L463)

### `tests/test-mix-mapper-node-label-layout-contract.js`
Contract tests: verifies Mix Mapper node labels stay within lane bounds.
*8 symbols · 227 lines · 2,544 tokens*

  - `assert(condition, message)` (L22)
  - `testNodeLabelWrappingContractInLayoutUtils()` (L26)
  - `testNodeWidthResolverSupportsFixedWidthMode()` (L45)
  - `testMobileNodeFontScalingTokenContract()` (L89)
  - `testMobileLayoutCompactionContract()` (L153)
  - `testDesktopLayoutPreservationContract()` (L179)
  - `testNarrowDesktopLayoutPreservationContract()` (L198)
  - `run()` (L216)

### `tests/test-module-landing-pattern-contract.js`
Contract tests enforcing module IA: back-link, sub-nav, and active section-01 link on all module root pages.
*5 symbols · 92 lines · 842 tokens*

  - `assert(condition, message)` (L13)
  - `read(relPath)` (L17)
  - `decodeHtmlText(value)` (L21)
  - `countActiveSubNavLinks(html)` (L30)
  - `run()` (L35)

### `tests/test-module-subpage-back-link-contract.js`
Contract tests: verifies module sub-pages have correct back-links pointing to the module root.
*2 symbols · 48 lines · 409 tokens*

  - `assert(condition, message)` (L16)
  - `run()` (L20)

### `tests/test-nav-controller.js`
Unit tests for nav-controller.js: active link detection and nav swatch application.
*4 symbols · 107 lines · 829 tokens*

  - `makeClassList()` (L10)
  - `makeElement(className)` (L19)
  - `assert(condition, message)` (L47)
  - `run()` (L51)

### `tests/test-nav-modules-menu-contract.js`
Contract tests: verifies the modules mega-menu contains all registered module routes.
*5 symbols · 163 lines · 1,375 tokens*

  - `assert(condition, message)` (L17)
  - `decodeHtmlText(value)` (L21)
  - `parseModulesIndex(source)` (L30)
  - `listNavHtmlPages(rootDir)` (L59)
  - `run()` (L85)

### `tests/test-nav-theme-contract.js`
Contract tests: verifies nav-specific CSS tokens are defined in theme stylesheets.
*5 symbols · 89 lines · 842 tokens*

  - `assert(condition, message)` (L27)
  - `testRootTokenDeclarations()` (L31)
  - `testComponentsConsumeNavTokens()` (L40)
  - `testDecisionCollisionColdOverridesTokensOnly()` (L61)
  - `run()` (L81)

### `tests/test-navigation-links.js`
Checks that all internal href links in HTML files resolve to existing paths.
*7 symbols · 136 lines · 1,031 tokens*

  - `walkHtmlFiles(baseDir)` (L16)
  - `pageRouteFromRelHtml(relHtmlPath)` (L37)
  - `extractHrefs(htmlSource)` (L44)
  - `shouldSkipHref(href)` (L55)
  - `toInternalPath(href, pageRoute)` (L64)
  - `resolveFsPathFromRequestPath(requestPath)` (L69)
  - `run()` (L94)

### `tests/test-no-cdn-runtime-deps.js`
Enforces that no production HTML pages load scripts from external CDNs at runtime.
*1 symbols · 50 lines · 353 tokens*

  - `walkHtmlFiles(baseDir)` (L11)

### `tests/test-notes-build-contract.js`
Integration tests for build-notes: verifies output HTML structure and tag index generation.
*7 symbols · 293 lines · 3,063 tokens*

  - `listMarkdownFiles(dirPath)` (L20)
  - `parseFrontmatter(raw, filePath)` (L35)
  - `splitCsv(text)` (L76)
  - `parseScalar(value)` (L101)
  - `slugify(input)` (L112)
  - `runBuild()` (L124)
  - `run()` (L136)

### `tests/test-notes-build-negative.js`
Negative tests for build-notes: verifies correct rejection of malformed or invalid content.
*7 symbols · 169 lines · 1,217 tokens*

  - `runBuild()` (L14)
  - `writeTempNote(name, body)` (L21)
  - `writeTempArticle(name, body)` (L27)
  - `expectBuildFail(noteFileName, noteBody, expectedPattern)` (L34)
  - `expectBuildPass(noteFileName, noteBody)` (L46)
  - `expectBuildFailForArticle(articleFileName, articleBody, expectedPattern)` (L57)
  - `run()` (L69)

### `tests/test-products-over-projects-assessment.js`
Tests the Products vs Projects risk classifier for all residual-risk family and scorecard combinations.
*2 symbols · 95 lines · 615 tokens*

  - `scores(product, execution, control)` (L16)
  - `run()` (L29)

### `tests/test-satellite-index-contract.js`
Contract tests for satellite-index.js: constants, function exports, and structural requirements.
*4 symbols · 417 lines · 13,010 tokens*

  - `read(relPath)` (L10)
  - `assertIncludes(source, needle, label)` (L14)
  - `assertNotMatches(source, pattern, label)` (L18)
  - `selectorBlock(source, selector)` (L22)

### `tests/test-security-hardening-contract.js`
Contract tests: checks security hardening patterns (CSP, referrer policy, sandbox) across HTML pages.
*6 symbols · 52 lines · 493 tokens*

  - `assert(condition, message)` (L7)
  - `read(relPath)` (L11)
  - `assertPinnedAction(workflowSource, actionName, workflowPath)` (L15)
  - `testPageShellCsp()` (L21)
  - `testWorkflowPinning()` (L31)
  - `run()` (L45)

### `tests/test-the-descent-section-map-contract.js`
Contract tests for the Document Map section in Module 06 (The Descent / Ambiguity & Clarity).
*6 symbols · 76 lines · 879 tokens*

  - `assert(condition, message)` (L17)
  - `testScriptOrderContract()` (L21)
  - `testDataContract()` (L33)
  - `testInteractionContract()` (L49)
  - `testPageWiringContract()` (L61)
  - `run()` (L67)

### `tests/test-theme-bootstrap.js`
Unit tests for theme-bootstrap.js: theme application, alias resolution, and stylesheet injection.
*8 symbols · 88 lines · 649 tokens*

  - `runWithTheme(themeValue)` (L10)
  - `assert(condition, message)` (L37)
  - `testDefaultCasesClearTheme()` (L43)
  - `testCustomThemeSetsDataTheme()` (L52)
  - `testCustomThemeIsTrimmed()` (L60)
  - `testAliasThemeMapsToCanonicalName()` (L66)
  - `testInvalidThemeFallsBackToDefault()` (L72)
  - `run()` (L78)

### `tests/test-theme-config-contract.js`
Contract tests: verifies theme.config.js sets a valid, known PLATOSCAVE_THEME value.
*7 symbols · 124 lines · 961 tokens*

  - `loadAllThemeCss()` (L11)
  - `assert(condition, message)` (L24)
  - `getDeclaredThemeNames(cssSource)` (L28)
  - `parseThemeConfigAssignments(configSource)` (L38)
  - `parseBootstrapAllowlist(bootstrapSource)` (L51)
  - `testThemeConfigAndThemeCssStayInSync()` (L64)
  - `run()` (L118)

### `tests/test-vendor-d3-checksum.js`
Verifies the vendored D3 library against a known checksum to detect unauthorized modifications.
*3 symbols · 33 lines · 263 tokens*

  - `assert(condition, message)` (L8)
  - `sha256File(filePath)` (L17)
  - `run()` (L22)

### Page-level scripts
*8 files · 0 symbols · 10,283 tokens*

### `js/articles-search.js`
Client-side keyword filter for the articles index page.
*0 symbols · 28 lines · 174 tokens*

### `js/doodle-background.js`
Injects decorative SVG doodles behind page content for pages with the doodle-bg-page body class.
*0 symbols · 183 lines · 2,058 tokens*

### `js/force-graph-utils.js`
Shared interaction helpers for D3 force-directed graphs: link index, highlight state, and legend-filter.
*0 symbols · 235 lines · 1,928 tokens*

### `js/katex-render.js`
Renders all [data-formula] elements on the page using KaTeX in display mode.
*0 symbols · 21 lines · 133 tokens*

### `js/module-route-data.js`
Registry of all module routes used by the nav mega-menu and module-navigation UI.
*0 symbols · 114 lines · 793 tokens*

### `js/nav-controller.js`
Global nav controller: active-link highlighting, modules mega-menu, and nav swatch theming.
*0 symbols · 492 lines · 4,046 tokens*

### `js/notes-search.js`
Client-side keyword filter for the notes index page.
*0 symbols · 28 lines · 174 tokens*

### `js/theme-bootstrap.js`
Reads PLATOSCAVE_THEME config and applies the active theme stylesheet and data-theme attribute on page load.
*0 symbols · 120 lines · 977 tokens*

### Root-level files
*1 files · 0 symbols · 301 tokens*

### `theme.config.js`
Global theme switch. Keep one line uncommented. Set to 'default' (or empty) for base theme with no data-theme attribute.
*0 symbols · 28 lines · 301 tokens*

## Pages

### Articles
*2 pages · 9 script refs · 11,682 tokens*

### `articles/index.html`
**Title:** Articles · To the Bedrock
**H1:** Articles
*84 lines · 1,247 tokens*

Scripts loaded:
  - `../theme.config.js`
  - `../js/theme-bootstrap.js`
  - `../js/articles-search.js`
  - `../js/module-route-data.js`
  - `../js/nav-controller.js`

### `articles/lowvolumehighsoftware/index.html`
**Title:** Operating model for low-Volume High-Software-Content Products · Articles · To the Bedrock
**H1:** Operating model for low-Volume High-Software-Content Products
*208 lines · 10,435 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### Case pages
*4 pages · 0 script refs · 698 tokens*

### `cases/index.html`
**Title:** Cases moved · To the Bedrock
*16 lines · 170 tokens*

### `cases/satellite-index/demo/index.html`
**Title:** Demo moved · Satellite Index · To the Bedrock
*16 lines · 177 tokens*

### `cases/satellite-index/index.html`
**Title:** Boundary-free monitoring moved · To the Bedrock
*16 lines · 170 tokens*

### `cases/satellite-index/three/index.html`
**Title:** Explorer moved · Boundary-free monitoring · To the Bedrock
*16 lines · 181 tokens*

### Module pages
*39 pages · 165 script refs · 94,166 tokens*

### `modules/ambiguity-clarity/index.html`
**Title:** Ambiguous Documents · To the Bedrock
**H1:** Ambiguous Documents
*193 lines · 2,705 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `modules/ambiguity-clarity/section-map/index.html`
**Title:** Document Map · Ambiguous Documents · To the Bedrock
**H1:** Document Map
*113 lines · 1,638 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../assets/vendor/d3.v7.min.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `section-map.js`

### `modules/emergence-primer/ganttgol/index.html`
**Title:** GANTT meets Game of Life · Redirecting · To the Bedrock
*16 lines · 186 tokens*

### `modules/emergence-primer/index.html`
**Title:** Emergence · Redirecting · To the Bedrock
*16 lines · 155 tokens*

### `modules/emergence/ganttgol/index.html`
**Title:** GANTT meets Game of Life · Emergence · To the Bedrock
**H1:** GANTT meets Game of Life
*165 lines · 2,626 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `../emergence-primer-gantt.js`
  - `../emergence-primer.js`

### `modules/emergence/index.html`
**Title:** Conway's Game of Life · Emergence · To the Bedrock
**H1:** Conway's Game of Life
*166 lines · 2,641 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`
  - `emergence-primer-gantt.js`
  - `emergence-primer.js`

### `modules/experience-skill-graph/cv/index.html`
**Title:** CV · Experience-Skill Graph · To the Bedrock
**H1:** CV
*160 lines · 2,499 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`

### `modules/experience-skill-graph/index.html`
**Title:** Skills Graph · Experience-Skill Graph · To the Bedrock
**H1:** Skills Graph
*850 lines · 8,226 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../assets/vendor/d3.v7.min.js`
  - `graph-data-loader.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `modules/flow-queuing/concept-graph/index.html`
**Title:** Concept Map · Flow & Queuing · To the Bedrock
**H1:** Concept Map
*157 lines · 2,327 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `../../../assets/vendor/d3.v7.min.js`
  - `../../../js/force-graph-utils.js`
  - `concept-graph.js`

### `modules/flow-queuing/derivation/index.html`
**Title:** Appendix: M/M/1 Derivation · Flow & Queuing · To the Bedrock
**H1:** Appendix: M/M/1 Derivation
*496 lines · 9,006 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `../../../assets/vendor/katex/katex.min.js`
  - `../../../js/katex-render.js`

### `modules/flow-queuing/explore/index.html`
**Title:** Explore · Flow & Queuing · To the Bedrock
**H1:** Explore
*190 lines · 3,250 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `../../../assets/vendor/d3.v7.min.js`
  - `../flow-queuing-model.js`
  - `../flow-queuing.js`

### `modules/flow-queuing/index.html`
**Title:** Flow and Waiting · Flow & Queuing · To the Bedrock
**H1:** Flow and Waiting
*346 lines · 5,295 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`
  - `../../assets/vendor/katex/katex.min.js`
  - `../../js/katex-render.js`

### `modules/flow-queuing/taxonomy/index.html`
**Title:** Taxonomy · Flow & Queuing · To the Bedrock
**H1:** Taxonomy
*226 lines · 3,224 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`

### `modules/garbage-can/assess/index.html`
**Title:** Assess · The Garbage Can Model · To the Bedrock
**H1:** Assess
*435 lines · 7,129 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../assets/vendor/d3.v7.min.js`
  - `../runtime/gc-simulation-config.js`
  - `../runtime/gc-simulation-core.js`
  - `../runtime/gc-simulation.js`
  - `../runtime/gc-scoring.js`
  - `../runtime/gc-diagnosis.js`
  - `../runtime/gc-viz-config.js`
  - `../runtime/gc-viz-timing.js`
  - `../runtime/gc-viz-helpers.js`
  - `../runtime/gc-viz.js`
  - `../runtime/gc-pressure-narrative.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `../gc-ui-utils.js`
  - `assess.js`

### `modules/garbage-can/can-explainer/index.html`
**Title:** What's a Garbage Can? · The Garbage Can Model · To the Bedrock
**H1:** What's a Garbage Can?
*106 lines · 1,584 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../assets/vendor/d3.v7.min.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `can-explainer.js`

### `modules/garbage-can/explorer/index.html`
**Title:** Explore · The Garbage Can Model · To the Bedrock
**H1:** Explore
*227 lines · 3,087 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../assets/vendor/d3.v7.min.js`
  - `../runtime/gc-simulation-config.js`
  - `../runtime/gc-simulation-core.js`
  - `../runtime/gc-simulation.js`
  - `../runtime/gc-diagnosis.js`
  - `../runtime/gc-viz-config.js`
  - `../runtime/gc-viz-timing.js`
  - `../runtime/gc-viz-helpers.js`
  - `../runtime/gc-viz.js`
  - `../runtime/gc-pressure-narrative.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `../gc-ui-utils.js`
  - `explorer.js`

### `modules/garbage-can/index.html`
**Title:** Organised Anarchy · The Garbage Can Model · To the Bedrock
**H1:** Organised Anarchy
*200 lines · 2,444 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `modules/garbage-can/taxonomy/index.html`
**Title:** Taxonomy · The Garbage Can Model · To the Bedrock
**H1:** Taxonomy
*266 lines · 3,167 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`

### `modules/index.html`
**Title:** Catalogue — To the Bedrock
**H1:** Catalogue
*169 lines · 1,771 tokens*

Scripts loaded:
  - `../theme.config.js`
  - `../js/theme-bootstrap.js`
  - `../js/module-route-data.js`
  - `../js/nav-controller.js`

### `modules/learning-feedback/feedback-debt/index.html`
**Title:** Feedback Debt · Learning & Feedback · To the Bedrock
**H1:** Feedback Debt
*241 lines · 3,196 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`

### `modules/learning-feedback/index.html`
**Title:** Epistemic Bets · Learning & Feedback · To the Bedrock
**H1:** Epistemic Bets
*128 lines · 1,924 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../assets/vendor/d3.v7.min.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`
  - `mix-mapper-data.js`
  - `mix-mapper-semantics.js`
  - `mix-mapper-geometry.js`
  - `mix-mapper-layout-utils.js`
  - `mix-mapper-node-utils.js`
  - `mix-mapper-mode-policy.js`
  - `mix-mapper-tooltip.js`
  - `mix-mapper-interactions.js`
  - `mix-mapper-renderer.js`
  - `mix-mapper.js`

### `modules/learning-feedback/process-vs-knowledge/index.html`
**Title:** Epistemic Bets · Redirecting · To the Bedrock
*16 lines · 164 tokens*

### `modules/maturity/index.html`
**Title:** Organisational Diagnostic · To the Bedrock
**H1:** Organisational Diagnostic
*85 lines · 1,023 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `modules/mix-mapper/feedback-debt/index.html`
**Title:** Feedback Debt · Redirecting · To the Bedrock
*16 lines · 165 tokens*

### `modules/mix-mapper/index.html`
**Title:** Learning & Feedback · Redirecting · To the Bedrock
*16 lines · 160 tokens*

### `modules/mix-mapper/process-vs-knowledge/index.html`
**Title:** Epistemic Bets · Redirecting · To the Bedrock
*16 lines · 167 tokens*

### `modules/products-over-projects/assessment/index.html`
**Title:** Assessment · Products Over Projects · To the Bedrock
**H1:** Residual Risk Assessment
*287 lines · 5,825 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `products-over-projects-assessment.js`

### `modules/products-over-projects/index.html`
**Title:** Risk Lens · Products Over Projects · To the Bedrock
**H1:** Risk Lens
*242 lines · 3,319 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `modules/products-over-projects/taxonomy/index.html`
**Title:** Taxonomy · Products Over Projects · To the Bedrock
**H1:** Taxonomy
*281 lines · 3,761 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`

### `modules/queue-machine/concept-graph/index.html`
**Title:** Concept Map · Redirecting · To the Bedrock
*16 lines · 169 tokens*

### `modules/queue-machine/derivation/index.html`
**Title:** Appendix · Redirecting · To the Bedrock
*16 lines · 169 tokens*

### `modules/queue-machine/explore/index.html`
**Title:** Explore · Redirecting · To the Bedrock
*16 lines · 162 tokens*

### `modules/queue-machine/index.html`
**Title:** Flow & Queuing · Redirecting · To the Bedrock
*16 lines · 171 tokens*

### `modules/queue-machine/taxonomy/index.html`
**Title:** Taxonomy · Redirecting · To the Bedrock
*16 lines · 169 tokens*

### `modules/satellite-index/demo/index.html`
**Title:** Demo · Satellite Index · To the Bedrock
**H1:** Spectral Index Demo
*143 lines · 1,990 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `satellite-index.js`

External scripts:
  - `https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js`
  - `https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.3/plotly.min.js`

### `modules/satellite-index/index.html`
**Title:** Boundary-free monitoring · Satellite Index · To the Bedrock
**H1:** Boundary-free monitoring
*323 lines · 5,344 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`
  - `../../assets/vendor/katex/katex.min.js`
  - `../../js/katex-render.js`

### `modules/satellite-index/three/index.html`
**Title:** Explorer · Boundary-free monitoring · To the Bedrock
**H1:** Explorer
*193 lines · 2,988 tokens*

Scripts loaded:
  - `../../../theme.config.js`
  - `../../../js/theme-bootstrap.js`
  - `../../../js/module-route-data.js`
  - `../../../js/nav-controller.js`
  - `satellite-index-three.js`

External scripts:
  - `https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js`

### `modules/the-descent/index.html`
**Title:** Ambiguous Documents · Redirecting · To the Bedrock
*16 lines · 167 tokens*

### `modules/the-descent/section-map/index.html`
**Title:** Document Map · Redirecting · To the Bedrock
*16 lines · 173 tokens*

### Root-level pages
*1 pages · 5 script refs · 1,272 tokens*

### `index.html`
**Title:** To the Bedrock
*95 lines · 1,272 tokens*

Scripts loaded:
  - `theme.config.js`
  - `js/theme-bootstrap.js`
  - `js/module-route-data.js`
  - `js/nav-controller.js`
  - `js/doodle-background.js`

### Colophon
*1 pages · 4 script refs · 1,436 tokens*

### `colophon/index.html`
**Title:** Site Notes · To the Bedrock
**H1:** Site Notes
*112 lines · 1,436 tokens*

Scripts loaded:
  - `../theme.config.js`
  - `../js/theme-bootstrap.js`
  - `../js/module-route-data.js`
  - `../js/nav-controller.js`

### Tests
*2 pages · 7 script refs · 7,121 tokens*

### `tests/test-gc-simulation.html`
**Title:** GC Simulation — Validation
**H1:** Organised Anarchy Simulation Test
*526 lines · 4,345 tokens*

Scripts loaded:
  - `../modules/garbage-can/runtime/gc-simulation-config.js`
  - `../modules/garbage-can/runtime/gc-simulation-core.js`
  - `../modules/garbage-can/runtime/gc-simulation.js`

### `tests/test-gc-viz.html`
**Title:** Organised Anarchy — Visualization Test
**H1:** Organised Anarchy
*289 lines · 2,776 tokens*

Scripts loaded:
  - `../assets/vendor/d3.v7.min.js`
  - `../modules/garbage-can/runtime/gc-simulation-config.js`
  - `../modules/garbage-can/runtime/gc-simulation-core.js`
  - `../modules/garbage-can/runtime/gc-simulation.js`

### Tags
*11 pages · 44 script refs · 13,077 tokens*

### `tags/complexity/index.html`
**Title:** Tag: complexity · To the Bedrock
**H1:** Tag: complexity
*88 lines · 1,124 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/cost-overrun/index.html`
**Title:** Tag: cost overrun · To the Bedrock
**H1:** Tag: cost overrun
*88 lines · 1,132 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/decision-making/index.html`
**Title:** Tag: decision making · To the Bedrock
**H1:** Tag: decision making
*89 lines · 1,156 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/emergence/index.html`
**Title:** Tag: emergence · To the Bedrock
**H1:** Tag: emergence
*88 lines · 1,124 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/garbage-can-model/index.html`
**Title:** Tag: garbage can model · To the Bedrock
**H1:** Tag: garbage can model
*89 lines · 1,159 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/index.html`
**Title:** Tags · To the Bedrock
**H1:** Tags
*106 lines · 1,418 tokens*

Scripts loaded:
  - `../theme.config.js`
  - `../js/theme-bootstrap.js`
  - `../js/module-route-data.js`
  - `../js/nav-controller.js`

### `tags/long-tails/index.html`
**Title:** Tag: long tails · To the Bedrock
**H1:** Tag: long tails
*88 lines · 1,132 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/organised-anarchy/index.html`
**Title:** Tag: organised anarchy · To the Bedrock
**H1:** Tag: organised anarchy
*89 lines · 1,159 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/product-management/index.html`
**Title:** Tag: product management · To the Bedrock
**H1:** Tag: product management
*93 lines · 1,230 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/statistics/index.html`
**Title:** Tag: statistics · To the Bedrock
**H1:** Tag: statistics
*88 lines · 1,129 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `tags/the-mix/index.html`
**Title:** Tag: the mix · To the Bedrock
**H1:** Tag: the mix
*100 lines · 1,314 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### Notes
*5 pages · 21 script refs · 7,480 tokens*

### `notes/cost-overruns/index.html`
**Title:** Flyvbjerg & cost overruns · Notes · To the Bedrock
**H1:** Flyvbjerg & cost overruns
*79 lines · 1,387 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `notes/index.html`
**Title:** Notes · To the Bedrock
**H1:** Notes
*117 lines · 2,706 tokens*

Scripts loaded:
  - `../theme.config.js`
  - `../js/theme-bootstrap.js`
  - `../js/notes-search.js`
  - `../js/module-route-data.js`
  - `../js/nav-controller.js`

### `notes/pm-complexity/index.html`
**Title:** PM-ing and Complexity · Notes · To the Bedrock
**H1:** PM-ing and Complexity
*77 lines · 1,163 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `notes/semantics/index.html`
**Title:** Semantic modernization & new jargon · Notes · To the Bedrock
**H1:** Semantic modernization & new jargon
*76 lines · 1,089 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### `notes/what-works-and-what-doesnt-work/index.html`
**Title:** What works and what doesn't work · Notes · To the Bedrock
**H1:** What works and what doesn't work
*77 lines · 1,135 tokens*

Scripts loaded:
  - `../../theme.config.js`
  - `../../js/theme-bootstrap.js`
  - `../../js/module-route-data.js`
  - `../../js/nav-controller.js`

### Cv
*1 pages · 0 script refs · 166 tokens*

### `cv/index.html`
**Title:** Redirecting to CV
*18 lines · 166 tokens*

### Skills
*1 pages · 0 script refs · 162 tokens*

### `skills/index.html`
**Title:** Redirecting to Skills Graph
*18 lines · 162 tokens*

### Design-System
*1 pages · 4 script refs · 21,123 tokens*

### `design-system/index.html`
**Title:** Design System · To the Bedrock
**H1:** Design System
*1525 lines · 21,123 tokens*

Scripts loaded:
  - `../theme.config.js`
  - `../js/theme-bootstrap.js`
  - `../js/module-route-data.js`
  - `../js/nav-controller.js`
