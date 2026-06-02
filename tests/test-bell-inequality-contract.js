// Contract tests for archived Alice and Bob: section IA, CHSH simulation, and Bell explainer labels.
'use strict';

const fs = require('fs');
const path = require('path');
const bell = require('../archive/alice-and-bob/bell-inequality.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function within(value, expected, tolerance, label) {
  assert(
    Math.abs(value - expected) <= tolerance,
    label + ' expected ' + expected + ' +/- ' + tolerance + ', got ' + value
  );
}

function run() {
  const html = read('archive/alice-and-bob/index.html');
  const taxonomyHtml = read('archive/alice-and-bob/taxonomy/index.html');
  const classicalHtml = read('archive/alice-and-bob/classical-expectation/index.html');
  const classicalJs = read('archive/alice-and-bob/classical-expectation/classical-expectation.js');
  const exploreHtml = read('archive/alice-and-bob/explore/index.html');
  const js = read('archive/alice-and-bob/bell-inequality.js');

  assert(
    /class="module-header-number module-context-number module-context-link" href="\.\/">Alice and Bob<\/a>/.test(html),
    'Bell module context link must be renamed to Alice and Bob'
  );
  assert(
    /class="module-sub-nav-link module-sub-nav-link--active" href="\.\/" aria-current="page"><span class="module-sub-nav-number">01<\/span> On Bell&apos;s Inequality/.test(html),
    'Alice and Bob root must expose On Bell\'s Inequality as active local section 01'
  );
  ['taxonomy/', 'classical-expectation/', 'explore/'].forEach((href) => {
    assert(html.includes('href="' + href + '"'), 'Root sub-nav must link to ' + href);
  });
  assert(/<h1 class="module-header-title">On Bell&apos;s Inequality<\/h1>/.test(html), 'Root h1 must be theorem-oriented');

  [
    { source: taxonomyHtml, section: '02', label: 'Taxonomy', path: 'taxonomy' },
    { source: classicalHtml, section: '03', label: 'Classical Expectation', path: 'classical-expectation' },
    { source: exploreHtml, section: '04', label: 'Explore', path: 'explore' },
  ].forEach((page) => {
    assert(
      /<a class="module-back-link" href="\.\.\/\.\.\/" aria-label="Back to Archive"><\/a>/.test(page.source),
      page.path + ' must include archive back-link'
    );
    assert(
      /class="module-header-number module-context-number module-context-link" href="\.\.\/">Alice and Bob<\/a>/.test(page.source),
      page.path + ' must link context back to module root'
    );
    assert(
      new RegExp('module-sub-nav-link module-sub-nav-link--active" href="\\.\\/" aria-current="page"><span class="module-sub-nav-number">' + page.section + '<\\/span> ' + page.label).test(page.source),
      page.path + ' must expose active section ' + page.section
    );
  });

  assert(
    classicalHtml.indexOf('assets/vendor/d3.v7.min.js') < classicalHtml.indexOf('classical-expectation.js'),
    'Classical Expectation must load local D3 before its page runtime'
  );
  assert(/^\/\/ Animates why a local prewritten answer card/m.test(classicalJs), 'Classical runtime must keep top-of-file purpose comment');
  assert(/red question or a blue question/.test(classicalHtml), 'Classical page must use ELI5 red/blue question framing');
  assert(/best classical score is three out of\s+four: 75%/.test(classicalHtml), 'Classical page must explain the 75% limit');

  assert(
    exploreHtml.indexOf('assets/vendor/d3.v7.min.js') < exploreHtml.indexOf('bell-inequality.js'),
    'Explore must load local D3 before its page runtime'
  );
  assert(
    /data-bell-status[^>]*>Waiting for script\.\.\.<\/span>/.test(exploreHtml),
    'Explore must distinguish static HTML from initialized JS status'
  );
  assert(/bell-inequality\.js\?v=/.test(exploreHtml), 'Bell runtime script URL should carry a cache-busting query');
  assert(/bell-js-ready/.test(js), 'Bell runtime must mark the document when JS has initialized');
  assert(/root\.PlatoscaveBellInequality = factory\(root\);/.test(js), 'Bell browser wrapper must pass root into the factory');
  assert(/function buildBellInequalityModule\(root\)/.test(js), 'Bell factory must receive root so browser init can access d3');
  assert(
    exploreHtml.indexOf('js/module-route-data.js') < exploreHtml.indexOf('js/nav-controller.js'),
    'Explore must load module-route-data before nav-controller'
  );
  assert(/Local randomness/.test(exploreHtml), 'Explore must label the local randomness readout');
  assert(/Classical ceiling/.test(exploreHtml), 'Explore must show the classical ceiling');
  assert(/Quantum target/.test(exploreHtml), 'Explore must show the quantum target');
  assert(/Quantum mechanical correlation/.test(exploreHtml), 'Explore must foreground quantum mechanical correlation');
  assert(/abstract analyzer dials/.test(exploreHtml), 'Explore SVG label must describe the abstract analyzer dials');
  assert(
    /^\/\/ Runs the Bell Lab CHSH animation/m.test(js),
    'Bell runtime must keep a top-of-file purpose comment for REPO_MAP.md'
  );
  assert(/no message crosses this gap/.test(js), 'Bell animation must label the no-message gap between labs');
  assert(/local tape: random here/.test(js), 'Bell animation must show local random tapes');
  assert(/analyzer setting/.test(js), 'Bell animation must use analyzer dials instead of cross detectors');
  assert(/2200/.test(js) && /duration\(1800\)/.test(js), 'Bell Explore animation must be slowed down for readability');
  assert(!/function drawDetector/.test(js), 'Bell animation should not use the old cross-detector drawing function');

  within(bell.QUANTUM_WIN_PROBABILITY, (2 + Math.SQRT2) / 4, 1e-12, 'Quantum CHSH win probability');
  within(bell.CLASSICAL_CEILING, 0.75, 1e-12, 'Classical CHSH ceiling');

  assert(bell.BEST_CLASSICAL_CARDS.length > 0, 'Expected best classical instruction cards');
  bell.BEST_CLASSICAL_CARDS.forEach((card, index) => {
    const wins = bell.evaluateInstructionCard(card).filter((test) => test.win).length;
    assert(wins === 3, 'Best classical card #' + index + ' must win exactly 3 of 4 setting pairs');
  });

  const quantum = bell.simulateRounds({ mode: 'quantum', count: 20000, seed: 42 });
  within(quantum.winRate, bell.QUANTUM_WIN_PROBABILITY, 0.012, 'Seeded quantum win rate');
  within(quantum.alicePlusRate, 0.5, 0.02, 'Seeded quantum Alice local plus rate');
  within(quantum.bobPlusRate, 0.5, 0.02, 'Seeded quantum Bob local plus rate');
  within(quantum.chsh, 2 * Math.SQRT2, 0.07, 'Seeded quantum CHSH S');

  const classical = bell.simulateRounds({ mode: 'classical', count: 20000, seed: 42 });
  assert(classical.winRate <= 0.765, 'Seeded classical instruction strategy must stay near the 75% ceiling');
  within(classical.chsh, 2, 0.08, 'Seeded classical CHSH S');

  console.log('PASS: tests/test-bell-inequality-contract.js');
}

run();
